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

// Initializer
export function initStorage(): void {
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
  }
  if (!localStorage.getItem(STORAGE_KEYS.BK_NOTES)) {
    localStorage.setItem(STORAGE_KEYS.BK_NOTES, JSON.stringify(initialBKNotes));
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

  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
  notifySubscribers();
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
    return true;
  }
  return false;
}

export function importStudentsBulk(newStudents: Array<Omit<Student, 'id' | 'created_at'>>): number {
  const currentList = getStudents();
  let addedCount = 0;

  newStudents.forEach((ns) => {
    // Avoid exact duplicate NISN
    const exists = currentList.find((s) => s.nisn === ns.nisn);
    if (!exists && ns.nama && ns.kelas) {
      currentList.push({
        ...ns,
        id: 'std-imp-' + Date.now() + '-' + Math.floor(Math.random() * 10000) + '-' + addedCount,
        created_at: new Date().toISOString(),
      });
      addedCount++;
    }
  });

  if (addedCount > 0) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(currentList));
    notifySubscribers();
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
 */
export function saveDailyAttendance(
  date: string,
  records: Array<{ student_id: string; status: AttendanceStatus; note?: string }>
): { updated: number; created: number } {
  const allAttendance = getAttendanceRecords();
  let created = 0;
  let updated = 0;
  const now = new Date().toISOString();

  records.forEach((rec) => {
    const existingIndex = allAttendance.findIndex(
      (a) => a.attendance_date === date && a.student_id === rec.student_id
    );

    if (existingIndex >= 0) {
      allAttendance[existingIndex] = {
        ...allAttendance[existingIndex],
        status: rec.status,
        note: rec.note,
        updated_at: now,
      };
      updated++;
    } else {
      allAttendance.push({
        id: `att-${rec.student_id}-${date}`,
        student_id: rec.student_id,
        attendance_date: date,
        status: rec.status,
        note: rec.note,
        created_at: now,
        updated_at: now,
      });
      created++;
    }
  });

  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(allAttendance));
  notifySubscribers();
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
    return raw ? JSON.parse(raw) : defaultSettings;
  } catch (e) {
    console.error('Failed to get settings', e);
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  notifySubscribers();
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
  return saved;
}

export function deleteBKNote(id: string): boolean {
  let list = getBKNotes();
  const initial = list.length;
  list = list.filter((n) => n.id !== id);
  if (list.length !== initial) {
    localStorage.setItem(STORAGE_KEYS.BK_NOTES, JSON.stringify(list));
    notifySubscribers();
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
  const targetStudents = filterKelas && filterKelas !== 'Semua'
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

// Reset data to default seed
export function resetDatabase(): void {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(generateInitialAttendance()));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  localStorage.setItem(STORAGE_KEYS.BK_NOTES, JSON.stringify(initialBKNotes));
  notifySubscribers();
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
    return true;
  } catch (e) {
    console.error('Failed to import JSON backup', e);
    return false;
  }
}
