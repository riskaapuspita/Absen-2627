import {
  Student,
  AttendanceRecord,
  AppSettings,
  BKNote,
  StudentRecap,
  DailyClassSummary,
  AttendanceStatus,
} from '../types';
import {
  defaultSettings,
  initialStudents,
  generateInitialAttendance,
  initialBKNotes,
} from '../data/initialData';
import {
  db,
  COLLECTIONS,
  updateSyncState,
  getSyncState,
  CloudSyncStatus,
} from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  STUDENTS: 'sia_bk_students_v1',
  ATTENDANCE: 'sia_bk_attendance_v1',
  SETTINGS: 'sia_bk_settings_v1',
  BK_NOTES: 'sia_bk_notes_v1',
};

// Event emitter pattern for real-time reactivity in UI
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribeToData(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifySubscribers() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error notifying subscriber:', e);
    }
  });
}

// Track active Firestore unsubscribe handles
let unsubscribes: Unsubscribe[] = [];
let isFirebaseInitialized = false;

// Initializer: setups local storage first then launches real-time Firestore sync
export function initStorage(): void {
  // 1. Initial Local Cache
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(
      STORAGE_KEYS.ATTENDANCE,
      JSON.stringify(generateInitialAttendance())
    );
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  } else {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
      if (!existing?.teacherProfile?.schoolName || existing?.teacherProfile?.schoolName === 'SMA Negeri 1 Nusantara') {
        existing.teacherProfile = {
          ...existing.teacherProfile,
          ...defaultSettings.teacherProfile,
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(existing));
      }
    } catch {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.BK_NOTES)) {
    localStorage.setItem(STORAGE_KEYS.BK_NOTES, JSON.stringify(initialBKNotes));
  }

  // 2. Launch Real-time Cloud Synchronization
  if (!isFirebaseInitialized) {
    initFirebaseSync();
    isFirebaseInitialized = true;
  }
}

/**
 * Initializes real-time listener synchronization with Cloud Firestore.
 * Ensures all devices receive instant updates without refreshing.
 */
export function initFirebaseSync(): void {
  try {
    updateSyncState({ status: 'syncing' });

    // Clean up any old listeners
    unsubscribes.forEach((unsub) => {
      try {
        unsub();
      } catch (err) {
        console.warn('Error unsubscribing previous listener', err);
      }
    });
    unsubscribes = [];

    // --- 1. Students Collection Listener ---
    const unsubStudents = onSnapshot(
      collection(db, COLLECTIONS.STUDENTS),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteStudents: Student[] = [];
          snapshot.forEach((docSnap) => {
            remoteStudents.push(docSnap.data() as Student);
          });
          // Sort by name or class
          remoteStudents.sort((a, b) => a.nama.localeCompare(b.nama));
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(remoteStudents));
          notifySubscribers();
        } else {
          // Cloud collection is empty: seed existing local students to cloud
          const localStudents = getStudents();
          if (localStudents.length > 0) {
            seedStudentsToCloud(localStudents);
          }
        }
        updateSyncState({ status: 'connected', lastSyncedAt: new Date() });
      },
      (error) => {
        console.error('Firestore students sync error:', error);
        updateSyncState({ status: 'error', errorMessage: error.message });
      }
    );
    unsubscribes.push(unsubStudents);

    // --- 2. Attendance Collection Listener ---
    const unsubAttendance = onSnapshot(
      collection(db, COLLECTIONS.ATTENDANCE),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteAttendance: AttendanceRecord[] = [];
          snapshot.forEach((docSnap) => {
            remoteAttendance.push(docSnap.data() as AttendanceRecord);
          });
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(remoteAttendance));
          notifySubscribers();
        } else {
          // Cloud attendance is empty: seed existing local attendance
          const localAttendance = getAttendanceRecords();
          if (localAttendance.length > 0) {
            seedAttendanceToCloud(localAttendance);
          }
        }
        updateSyncState({ status: 'connected', lastSyncedAt: new Date() });
      },
      (error) => {
        console.error('Firestore attendance sync error:', error);
        updateSyncState({ status: 'error', errorMessage: error.message });
      }
    );
    unsubscribes.push(unsubAttendance);

    // --- 3. App Settings Document Listener ---
    const unsubSettings = onSnapshot(
      doc(db, COLLECTIONS.SETTINGS, 'app_settings'),
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteSettings = snapshot.data() as AppSettings;
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(remoteSettings));
          notifySubscribers();
        } else {
          // Cloud settings empty: upload default
          const localSettings = getSettings();
          setDoc(doc(db, COLLECTIONS.SETTINGS, 'app_settings'), localSettings).catch(console.error);
        }
        updateSyncState({ status: 'connected', lastSyncedAt: new Date() });
      },
      (error) => {
        console.error('Firestore settings sync error:', error);
      }
    );
    unsubscribes.push(unsubSettings);

    // --- 4. BK Notes Collection Listener ---
    const unsubBKNotes = onSnapshot(
      collection(db, COLLECTIONS.BK_NOTES),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteNotes: BKNote[] = [];
          snapshot.forEach((docSnap) => {
            remoteNotes.push(docSnap.data() as BKNote);
          });
          remoteNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          localStorage.setItem(STORAGE_KEYS.BK_NOTES, JSON.stringify(remoteNotes));
          notifySubscribers();
        } else {
          const localNotes = getBKNotes();
          if (localNotes.length > 0) {
            seedBKNotesToCloud(localNotes);
          }
        }
        updateSyncState({ status: 'connected', lastSyncedAt: new Date(), activeListenersCount: unsubscribes.length });
      },
      (error) => {
        console.error('Firestore bk notes sync error:', error);
      }
    );
    unsubscribes.push(unsubBKNotes);
  } catch (error) {
    console.error('Failed to initialize Firebase Sync:', error);
    updateSyncState({ status: 'error', errorMessage: (error as Error).message });
  }
}

// Seed Helpers for Initial Cloud Sync
async function seedStudentsToCloud(students: Student[]) {
  try {
    const batch = writeBatch(db);
    // Firestore batch max 500 operations
    const chunk = students.slice(0, 450);
    chunk.forEach((st) => {
      batch.set(doc(db, COLLECTIONS.STUDENTS, st.id), st);
    });
    await batch.commit();
  } catch (e) {
    console.error('Failed to seed students to Firestore:', e);
  }
}

async function seedAttendanceToCloud(records: AttendanceRecord[]) {
  try {
    const batch = writeBatch(db);
    const chunk = records.slice(0, 450);
    chunk.forEach((rec) => {
      batch.set(doc(db, COLLECTIONS.ATTENDANCE, rec.id), rec);
    });
    await batch.commit();
  } catch (e) {
    console.error('Failed to seed attendance to Firestore:', e);
  }
}

async function seedBKNotesToCloud(notes: BKNote[]) {
  try {
    const batch = writeBatch(db);
    const chunk = notes.slice(0, 450);
    chunk.forEach((n) => {
      batch.set(doc(db, COLLECTIONS.BK_NOTES, n.id), n);
    });
    await batch.commit();
  } catch (e) {
    console.error('Failed to seed BK notes to Firestore:', e);
  }
}

// --- STUDENT REPOSITORY ---

export function getStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return raw ? JSON.parse(raw) : initialStudents;
  } catch (e) {
    console.error('Failed to get students from localStorage', e);
    return initialStudents;
  }
}

export function saveStudent(student: Omit<Student, 'id' | 'created_at'> & { id?: string }): Student {
  const list = getStudents();
  let savedStudent: Student;

  if (student.id) {
    // Edit existing
    const index = list.findIndex((s) => s.id === student.id);
    if (index !== -1) {
      savedStudent = {
        ...list[index],
        ...student,
        id: student.id,
      };
      list[index] = savedStudent;
    } else {
      savedStudent = {
        ...student,
        id: student.id,
        created_at: new Date().toISOString(),
      } as Student;
      list.push(savedStudent);
    }
  } else {
    // Create new
    savedStudent = {
      ...student,
      id: 'std-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      created_at: new Date().toISOString(),
    } as Student;
    list.push(savedStudent);
  }

  // 1. Update Local Cache
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
  notifySubscribers();

  // 2. Sync to Cloud Firestore in background
  setDoc(doc(db, COLLECTIONS.STUDENTS, savedStudent.id), savedStudent)
    .then(() => updateSyncState({ lastSyncedAt: new Date() }))
    .catch((err) => console.error('Cloud sync student failed:', err));

  return savedStudent;
}

export function deleteStudent(id: string): boolean {
  let list = getStudents();
  const initialLen = list.length;
  list = list.filter((s) => s.id !== id);

  if (list.length !== initialLen) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    // Also cleanup attendance records for this student
    const attendance = getAttendanceRecords().filter((a) => a.student_id !== id);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    notifySubscribers();

    // Sync deletion to Cloud Firestore
    deleteDoc(doc(db, COLLECTIONS.STUDENTS, id)).catch((err) =>
      console.error('Cloud delete student failed:', err)
    );

    return true;
  }
  return false;
}

export function importStudentsBulk(newStudents: Array<Omit<Student, 'id' | 'created_at'>>): number {
  const currentList = getStudents();
  let addedCount = 0;
  const addedItems: Student[] = [];

  newStudents.forEach((ns) => {
    // Avoid exact duplicate NISN
    const exists = currentList.find((s) => s.nisn === ns.nisn);
    if (!exists && ns.nama && ns.kelas) {
      const studentObj: Student = {
        ...ns,
        id: 'std-imp-' + Date.now() + '-' + Math.floor(Math.random() * 10000) + '-' + addedCount,
        created_at: new Date().toISOString(),
      };
      currentList.push(studentObj);
      addedItems.push(studentObj);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(currentList));
    notifySubscribers();

    // Write batch to Firestore
    try {
      const batch = writeBatch(db);
      addedItems.slice(0, 450).forEach((st) => {
        batch.set(doc(db, COLLECTIONS.STUDENTS, st.id), st);
      });
      batch
        .commit()
        .then(() => updateSyncState({ lastSyncedAt: new Date() }))
        .catch((err) => console.error('Cloud bulk import failed:', err));
    } catch (e) {
      console.error('Failed to create Firestore batch for students:', e);
    }
  }
  return addedCount;
}

// --- ATTENDANCE REPOSITORY ---

export function getAttendanceRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to get attendance records', e);
    return [];
  }
}

/**
 * Saves attendance records for multiple students on a specific date.
 * Guarantees NO DUPLICATES for the same student on the same date (upsert rule).
 * Immediately syncs online across all devices.
 */
export function saveDailyAttendance(
  date: string,
  records: Array<{ student_id: string; status: AttendanceStatus; note?: string }>
): { updated: number; created: number } {
  const allAttendance = getAttendanceRecords();
  let created = 0;
  let updated = 0;
  const now = new Date().toISOString();
  const changedRecords: AttendanceRecord[] = [];

  records.forEach((rec) => {
    const existingIndex = allAttendance.findIndex(
      (a) => a.attendance_date === date && a.student_id === rec.student_id
    );

    if (existingIndex >= 0) {
      const updatedRec: AttendanceRecord = {
        ...allAttendance[existingIndex],
        status: rec.status,
        note: rec.note,
        updated_at: now,
      };
      allAttendance[existingIndex] = updatedRec;
      changedRecords.push(updatedRec);
      updated++;
    } else {
      const newRec: AttendanceRecord = {
        id: `att-${rec.student_id}-${date}`,
        student_id: rec.student_id,
        attendance_date: date,
        status: rec.status,
        note: rec.note,
        created_at: now,
        updated_at: now,
      };
      allAttendance.push(newRec);
      changedRecords.push(newRec);
      created++;
    }
  });

  // 1. Update Local Storage
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(allAttendance));
  notifySubscribers();

  // 2. Sync changed records to Cloud Firestore
  try {
    const batch = writeBatch(db);
    changedRecords.slice(0, 450).forEach((item) => {
      batch.set(doc(db, COLLECTIONS.ATTENDANCE, item.id), item);
    });
    batch
      .commit()
      .then(() => updateSyncState({ lastSyncedAt: new Date() }))
      .catch((err) => console.error('Cloud attendance batch sync failed:', err));
  } catch (err) {
    console.error('Firestore batch error for attendance:', err);
  }

  return { updated, created };
}

export function getAttendanceByDateAndClass(date: string, kelas: string): {
  student: Student;
  record?: AttendanceRecord;
}[] {
  const students = getStudents().filter((s) => s.kelas === kelas && s.status === 'Aktif');
  const allRecords = getAttendanceRecords();

  return students.map((student) => {
    const record = allRecords.find(
      (r) => r.attendance_date === date && r.student_id === student.id
    );
    return {
      student,
      record,
    };
  });
}

// --- SETTINGS REPOSITORY ---

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    if (!parsed?.teacherProfile?.schoolName || parsed?.teacherProfile?.schoolName === 'SMA Negeri 1 Nusantara') {
      parsed.teacherProfile = {
        ...parsed.teacherProfile,
        ...defaultSettings.teacherProfile,
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.error('Failed to get settings', e);
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  notifySubscribers();

  // Cloud Firestore Sync
  setDoc(doc(db, COLLECTIONS.SETTINGS, 'app_settings'), settings)
    .then(() => updateSyncState({ lastSyncedAt: new Date() }))
    .catch((err) => console.error('Cloud sync settings failed:', err));
}

// --- BK NOTES REPOSITORY ---

export function getBKNotes(): BKNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BK_NOTES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to get BK notes', e);
    return [];
  }
}

export function getBKNotesByStudent(studentId: string): BKNote[] {
  return getBKNotes().filter((n) => n.student_id === studentId);
}

export function saveBKNote(note: Omit<BKNote, 'id' | 'created_at'> & { id?: string }): BKNote {
  const list = getBKNotes();
  let saved: BKNote;

  if (note.id) {
    const idx = list.findIndex((n) => n.id === note.id);
    if (idx !== -1) {
      saved = { ...list[idx], ...note, id: note.id };
      list[idx] = saved;
    } else {
      saved = { ...note, id: note.id, created_at: new Date().toISOString() } as BKNote;
      list.push(saved);
    }
  } else {
    saved = {
      ...note,
      id: 'note-' + Date.now(),
      created_at: new Date().toISOString(),
    } as BKNote;
    list.unshift(saved);
  }

  localStorage.setItem(STORAGE_KEYS.BK_NOTES, JSON.stringify(list));
  notifySubscribers();

  // Cloud Sync
  setDoc(doc(db, COLLECTIONS.BK_NOTES, saved.id), saved)
    .then(() => updateSyncState({ lastSyncedAt: new Date() }))
    .catch((err) => console.error('Cloud save BK note failed:', err));

  return saved;
}

export function deleteBKNote(id: string): boolean {
  let list = getBKNotes();
  const initial = list.length;
  list = list.filter((n) => n.id !== id);
  if (list.length !== initial) {
    localStorage.setItem(STORAGE_KEYS.BK_NOTES, JSON.stringify(list));
    notifySubscribers();

    deleteDoc(doc(db, COLLECTIONS.BK_NOTES, id)).catch((err) =>
      console.error('Cloud delete BK note failed:', err)
    );
    return true;
  }
  return false;
}

// --- CALCULATION & RECAP HELPERS ---

export function calculateStudentRecap(
  student: Student,
  records: AttendanceRecord[],
  thresholds: AppSettings['warningThresholds']
): StudentRecap {
  const studentRecords = records.filter((r) => r.student_id === student.id);
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alfa = 0;

  studentRecords.forEach((r) => {
    if (r.status === 'hadir') hadir++;
    else if (r.status === 'sakit') sakit++;
    else if (r.status === 'izin') izin++;
    else if (r.status === 'alfa') alfa++;
  });

  const totalDays = studentRecords.length;
  const totalAbsen = sakit + izin + alfa;
  const percentage = totalDays > 0 ? Math.round((hadir / totalDays) * 100) : 100;

  let warningLevel: 'aman' | 'kuning' | 'merah' | 'prioritas' = 'aman';
  if (alfa >= thresholds.priority) {
    warningLevel = 'prioritas';
  } else if (alfa >= thresholds.red) {
    warningLevel = 'merah';
  } else if (alfa >= thresholds.yellow) {
    warningLevel = 'kuning';
  }

  return {
    student,
    hadir,
    sakit,
    izin,
    alfa,
    totalDays,
    totalAbsen,
    percentage,
    warningLevel,
  };
}

export function getFullRecap(
  filterKelas?: string,
  startDate?: string,
  endDate?: string
): StudentRecap[] {
  const allStudents = getStudents().filter((s) => s.status === 'Aktif');
  const targetStudents =
    filterKelas && filterKelas !== 'Semua'
      ? allStudents.filter((s) => s.kelas === filterKelas)
      : allStudents;

  let records = getAttendanceRecords();
  if (startDate && endDate) {
    records = records.filter(
      (r) => r.attendance_date >= startDate && r.attendance_date <= endDate
    );
  } else if (startDate) {
    records = records.filter((r) => r.attendance_date >= startDate);
  }

  const settings = getSettings();
  return targetStudents.map((s) => calculateStudentRecap(s, records, settings.warningThresholds));
}

// Manual Push to Cloud (Sync All Local Data)
export async function syncAllLocalToCloud(): Promise<boolean> {
  try {
    updateSyncState({ status: 'syncing' });

    // 1. Settings
    const settings = getSettings();
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'app_settings'), settings);

    // 2. Students
    const students = getStudents();
    if (students.length > 0) {
      await seedStudentsToCloud(students);
    }

    // 3. Attendance
    const attendance = getAttendanceRecords();
    if (attendance.length > 0) {
      await seedAttendanceToCloud(attendance);
    }

    // 4. BK Notes
    const notes = getBKNotes();
    if (notes.length > 0) {
      await seedBKNotesToCloud(notes);
    }

    updateSyncState({ status: 'connected', lastSyncedAt: new Date() });
    return true;
  } catch (e) {
    console.error('Failed to sync all local data to cloud:', e);
    updateSyncState({ status: 'error', errorMessage: (e as Error).message });
    return false;
  }
}

// Reset data to default seed
export function resetDatabase(): void {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(generateInitialAttendance()));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  localStorage.setItem(STORAGE_KEYS.BK_NOTES, JSON.stringify(initialBKNotes));
  notifySubscribers();
  syncAllLocalToCloud().catch(console.error);
}

// Export / Backup as JSON
export function exportAllDataAsJSON(): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    students: getStudents(),
    attendance: getAttendanceRecords(),
    settings: getSettings(),
    bkNotes: getBKNotes(),
  };
  return JSON.stringify(data, null, 2);
}

// Import JSON Backup
export function importAllDataFromJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.students && Array.isArray(data.students)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
    }
    if (data.attendance && Array.isArray(data.attendance)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data.attendance));
    }
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    if (data.bkNotes && Array.isArray(data.bkNotes)) {
      localStorage.setItem(STORAGE_KEYS.BK_NOTES, JSON.stringify(data.bkNotes));
    }
    notifySubscribers();
    syncAllLocalToCloud().catch(console.error);
    return true;
  } catch (e) {
    console.error('Failed to import JSON backup', e);
    return false;
  }
}
