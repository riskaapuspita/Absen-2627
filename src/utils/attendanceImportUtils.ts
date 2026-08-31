import * as XLSX from 'xlsx';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { formatIndonesianDate, getTodayString } from './dateUtils';

export interface ParsedAttendanceItem {
  student_id?: string;
  student_nama: string;
  student_nisn: string;
  student_kelas: string;
  isNewStudent: boolean;
  date: string; // 'YYYY-MM-DD'
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceImportResult {
  items: ParsedAttendanceItem[];
  uniqueStudentsCount: number;
  newStudentsCount: number;
  newStudentsList: Array<Omit<Student, 'id' | 'created_at'>>;
  dateRange: { start: string; end: string };
  stats: {
    totalRecords: number;
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
  };
  formatDetected: 'matrix' | 'list' | 'unknown';
  errors: string[];
}

// Normalize attendance status string into canonical AttendanceStatus
export function normalizeAttendanceStatus(rawVal: any): AttendanceStatus | null {
  if (rawVal === undefined || rawVal === null) return null;
  const str = String(rawVal).trim().toLowerCase();
  if (!str) return null;

  if (['h', 'hadir', '1', 'v', '✓', '+', 'p', 'present', 'masuk'].includes(str)) {
    return 'hadir';
  }
  if (['s', 'sakit', 'sick'].includes(str)) {
    return 'sakit';
  }
  if (['i', 'izin', 'ijin', 'permit', 'cuti'].includes(str)) {
    return 'izin';
  }
  if (['a', 'alfa', 'alpa', 'tanpa keterangan', 'absent', '0', '-'].includes(str)) {
    return 'alfa';
  }

  return null;
}

// Format raw date value from Excel into YYYY-MM-DD
export function normalizeExcelDate(val: any, defaultYear: number = new Date().getFullYear(), defaultMonth: number = new Date().getMonth() + 1): string | null {
  if (val === undefined || val === null) return null;

  // Case 1: Excel numeric serial date (e.g., 45170)
  if (typeof val === 'number') {
    if (val >= 1 && val <= 31) {
      // Day number within default month
      const yyyy = defaultYear;
      const mm = String(defaultMonth).padStart(2, '0');
      const dd = String(Math.floor(val)).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    try {
      const dateObj = XLSX.SSF.parse_date_code(val);
      if (dateObj && dateObj.y && dateObj.m && dateObj.d) {
        const yyyy = dateObj.y;
        const mm = String(dateObj.m).padStart(2, '0');
        const dd = String(dateObj.d).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch {
      // ignore
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  // Case 2: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Case 3: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const dd = String(dmyMatch[1]).padStart(2, '0');
    const mm = String(dmyMatch[2]).padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // Case 4: Day number string e.g. "1", "2", "05", "Tgl 12"
  const dayMatch = str.match(/^(?:tgl\s*|tanggal\s*)?(\d{1,2})$/i);
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[1], 10);
    if (dayNum >= 1 && dayNum <= 31) {
      const yyyy = defaultYear;
      const mm = String(defaultMonth).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // Case 5: JS Date string parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

// ==========================================
// 1. DOWNLOAD TEMPLATES
// ==========================================

/**
 * Downloads monthly attendance matrix Excel template (.xlsx)
 * Columns: No, NISN, Nama Siswa, Kelas, 1..31 (days)
 */
export function downloadAttendanceMatrixTemplate(targetClass: string = 'X-1', month: number = new Date().getMonth() + 1, year: number = new Date().getFullYear()): void {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[month - 1] || 'Bulan Berjalan';

  // Days in month
  const daysInMonth = new Date(year, month, 0).getDate();

  const titleRows = [
    [`FORMAT REKAPITULASI PRESENSI SISWA - MATRIX BULANAN`],
    [`SMAN 1 LEUWILIANG by Riska Puspita`],
    [`Kelas: ${targetClass} | Periode: ${monthName} ${year}`],
    [`Keterangan Kode: H = Hadir, S = Sakit, I = Izin, A = Alfa`],
    [],
  ];

  // Base Headers
  const headers = ['No', 'NISN', 'Nama Siswa', 'Kelas', 'L/P'];
  for (let d = 1; d <= daysInMonth; d++) {
    headers.push(String(d));
  }

  // Sample data rows
  const sampleStudents = [
    { nama: 'Aditia Pratama', nisn: '0081234501', jk: 'L' },
    { nama: 'Aisyah Putri Azzahra', nisn: '0081234502', jk: 'P' },
    { nama: 'Alif Kurniawan', nisn: '0081234503', jk: 'L' },
    { nama: 'Anisa Rahmawati', nisn: '0081234504', jk: 'P' },
    { nama: 'Bagas Sanjaya', nisn: '0081234505', jk: 'L' },
    { nama: 'Cantika Dewi Lestari', nisn: '0081234506', jk: 'P' },
    { nama: 'Daffa Rizky Ramadhan', nisn: '0081234507', jk: 'L' },
    { nama: 'Dinda Permata Sari', nisn: '0081234508', jk: 'P' },
  ];

  const dataRows: any[][] = [];
  sampleStudents.forEach((st, idx) => {
    const row: any[] = [
      idx + 1,
      st.nisn,
      st.nama,
      targetClass,
      st.jk,
    ];
    // Fill sample attendance for first 10 days
    for (let d = 1; d <= daysInMonth; d++) {
      if (d <= 5) {
        if (idx === 1 && d === 3) row.push('S');
        else if (idx === 3 && d === 4) row.push('I');
        else if (idx === 6 && d === 2) row.push('A');
        else row.push('H');
      } else {
        row.push('');
      }
    }
    dataRows.push(row);
  });

  const fullSheet = [...titleRows, headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(fullSheet);

  // Column widths
  const colWidths = [
    { wch: 5 },  // No
    { wch: 15 }, // NISN
    { wch: 28 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 6 },  // L/P
  ];
  for (let d = 1; d <= daysInMonth; d++) {
    colWidths.push({ wch: 4 });
  }
  ws['!cols'] = colWidths;

  const instructions = [
    ['PANDUAN PENGISIAN TEMPLATE REKAP PRESENSI MATRIX (.XLSX)'],
    [],
    ['1. Kolom "Nama Siswa" dan "Kelas" wajib diisi.'],
    ['2. Kolom "NISN" opsional, namun disarankan agar pencocokan data lebih akurat.'],
    ['3. Kolom angka 1 s.d. 31 merepresentasikan tanggal pada bulan tersebut.'],
    ['4. Isikan kode presensi pada kolom tanggal:'],
    ['   - "H" atau "1" : Hadir'],
    ['   - "S" : Sakit'],
    ['   - "I" : Izin'],
    ['   - "A" : Alfa / Tanpa Keterangan'],
    ['   - Kosongkan jika hari libur atau belum ada data presensi.'],
    ['5. Format ini mendukung impor sekaligus untuk 1 bulan penuh secara otomatis.'],
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(instructions);
  wsGuide['!cols'] = [{ wch: 70 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Rekap_${targetClass}`);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan');

  const fileName = `Template_Impor_Rekap_Presensi_Matrix_${targetClass.replace(/\s+/g, '_')}_${monthName}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Downloads list-format attendance Excel template (.xlsx)
 * Columns: Tanggal (YYYY-MM-DD), NISN, Nama Siswa, Kelas, Status Kehadiran, Catatan
 */
export function downloadAttendanceListTemplate(targetClass: string = 'X-1'): void {
  const headers = ['Tanggal (YYYY-MM-DD)', 'NISN', 'Nama Siswa', 'Kelas', 'Status (H/S/I/A)', 'Catatan / Alasan'];
  const today = getTodayString();

  const sampleData = [
    headers,
    [today, '0081234501', 'Aditia Pratama', targetClass, 'H', ''],
    [today, '0081234502', 'Aisyah Putri Azzahra', targetClass, 'S', 'Surat dokter terlampir'],
    [today, '0081234503', 'Alif Kurniawan', targetClass, 'I', 'Acara keluarga di Bandung'],
    [today, '0081234504', 'Anisa Rahmawati', targetClass, 'A', 'Tanpa keterangan'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 15 },
    { wch: 28 },
    { wch: 10 },
    { wch: 18 },
    { wch: 35 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Log Presensi');
  XLSX.writeFile(wb, `Template_Impor_Log_Presensi_${targetClass.replace(/\s+/g, '_')}.xlsx`);
}

// ==========================================
// 2. PARSE EXCEL / CSV ATTENDANCE FILE
// ==========================================

export async function parseAttendanceFromExcel(
  file: File,
  existingStudents: Student[],
  options: {
    defaultClass?: string;
    defaultMonth?: number;
    defaultYear?: number;
  } = {}
): Promise<AttendanceImportResult> {
  const defaultClass = options.defaultClass || 'X-1';
  const defaultMonth = options.defaultMonth || new Date().getMonth() + 1;
  const defaultYear = options.defaultYear || new Date().getFullYear();

  const isCSV = file.name.endsWith('.csv');
  let rawRows: any[][] = [];

  if (isCSV) {
    const text = await file.text();
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    rawRows = lines.map((l) => {
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const matches: string[] = [];
      let m;
      while ((m = regex.exec(l)) !== null) {
        if (m.index === regex.lastIndex) regex.lastIndex++;
        let val = m[1] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        matches.push(val.trim());
      }
      return matches;
    });
  } else {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }

  if (!rawRows || rawRows.length === 0) {
    return {
      items: [],
      uniqueStudentsCount: 0,
      newStudentsCount: 0,
      newStudentsList: [],
      dateRange: { start: getTodayString(), end: getTodayString() },
      stats: { totalRecords: 0, hadir: 0, sakit: 0, izin: 0, alfa: 0 },
      formatDetected: 'unknown',
      errors: ['File Excel kosong atau tidak terbaca.'],
    };
  }

  // Detect metadata in top rows (e.g., class name, month, year)
  let detectedClass = defaultClass;
  let detectedMonth = defaultMonth;
  let detectedYear = defaultYear;

  for (let i = 0; i < Math.min(rawRows.length, 6); i++) {
    const row = rawRows[i] || [];
    const joined = row.map((c) => String(c || '')).join(' ');

    const classMatch = joined.match(/(?:kelas|rombel)[:\s]+([A-Za-z0-9\-\s]+)/i);
    if (classMatch && classMatch[1]) {
      const candidateClass = classMatch[1].split('|')[0].trim();
      if (candidateClass.length > 0 && candidateClass.length < 20) {
        detectedClass = candidateClass;
      }
    }

    const yearMatch = joined.match(/(?:20\d{2})/);
    if (yearMatch) {
      detectedYear = parseInt(yearMatch[0], 10);
    }

    const indonesianMonths = [
      'januari', 'februari', 'maret', 'april', 'mei', 'juni',
      'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
    ];
    indonesianMonths.forEach((mName, mIdx) => {
      if (joined.toLowerCase().includes(mName)) {
        detectedMonth = mIdx + 1;
      }
    });
  }

  // Find Header Row
  let headerRowIndex = -1;
  let isMatrixFormat = false;
  let nameColIdx = -1;
  let nisnColIdx = -1;
  let classColIdx = -1;
  let dateColIdx = -1;
  let statusColIdx = -1;
  let noteColIdx = -1;
  const dateColumns: Array<{ colIdx: number; dateStr: string }> = [];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r] || [];
    if (!row || row.length === 0) continue;

    let hasName = false;
    let numDaysFound = 0;

    row.forEach((cell, cIdx) => {
      const str = String(cell || '').trim().toLowerCase();
      if (str.includes('nama') || str.includes('siswa') || str.includes('student')) {
        nameColIdx = cIdx;
        hasName = true;
      } else if (str.includes('nisn')) {
        nisnColIdx = cIdx;
      } else if (str.includes('kelas') || str.includes('rombel')) {
        classColIdx = cIdx;
      } else if (str.includes('tanggal') || str.includes('date') || str.includes('tgl')) {
        dateColIdx = cIdx;
      } else if (str.includes('status') || str.includes('kehadiran') || str.includes('presensi') || str.includes('absen')) {
        statusColIdx = cIdx;
      } else if (str.includes('catatan') || str.includes('alasan') || str.includes('keterangan') || str.includes('note')) {
        noteColIdx = cIdx;
      }

      // Check if column is a Day/Date column in a matrix
      const parsedDate = normalizeExcelDate(cell, detectedYear, detectedMonth);
      if (parsedDate) {
        numDaysFound++;
      }
    });

    // Check if this row is a header
    if (hasName) {
      headerRowIndex = r;
      // If we also found day numbers or date columns, it's a matrix!
      if (numDaysFound >= 2) {
        isMatrixFormat = true;
        row.forEach((cell, cIdx) => {
          if (cIdx !== nameColIdx && cIdx !== nisnColIdx && cIdx !== classColIdx) {
            const dateStr = normalizeExcelDate(cell, detectedYear, detectedMonth);
            if (dateStr) {
              dateColumns.push({ colIdx: cIdx, dateStr });
            }
          }
        });
      }
      break;
    }
  }

  // Fallback if no header row found
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    nameColIdx = 1;
    nisnColIdx = 0;
  }

  // Determine format type
  const formatDetected: 'matrix' | 'list' = isMatrixFormat || dateColumns.length > 0 ? 'matrix' : 'list';

  // Fast Student Lookup Map (by NISN, NIS, or normalized Name)
  const studentMap = new Map<string, Student>();
  existingStudents.forEach((s) => {
    if (s.nisn) studentMap.set(s.nisn.toLowerCase().trim(), s);
    if (s.nis) studentMap.set(s.nis.toLowerCase().trim(), s);
    studentMap.set(s.nama.toLowerCase().trim(), s);
  });

  const parsedItems: ParsedAttendanceItem[] = [];
  const newlyDiscoveredStudents = new Map<string, Omit<Student, 'id' | 'created_at'>>();
  const errors: string[] = [];

  const startRow = headerRowIndex + 1;

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Check for skip lines
    const firstCell = String(row[0] || '').trim();
    if (
      firstCell.toLowerCase().startsWith('total') ||
      firstCell.toLowerCase().startsWith('rata') ||
      firstCell.toLowerCase().startsWith('mengetahui') ||
      firstCell.toLowerCase().startsWith('kepala') ||
      firstCell.toLowerCase().startsWith('guru')
    ) {
      continue;
    }

    // Extract student identity
    let rawName = nameColIdx >= 0 ? String(row[nameColIdx] || '').trim() : '';
    let rawNisn = nisnColIdx >= 0 ? String(row[nisnColIdx] || '').trim() : '';
    let rawClass = classColIdx >= 0 ? String(row[classColIdx] || '').trim() : detectedClass;

    // If name is blank, check first few columns
    if (!rawName) {
      for (let c = 0; c < Math.min(row.length, 3); c++) {
        const val = String(row[c] || '').trim();
        if (val && isNaN(Number(val)) && val.length > 2) {
          rawName = val;
          break;
        }
      }
    }

    rawName = rawName.replace(/^\d+[\.\)\-\s]+/, '').trim();
    if (!rawName || rawName.length < 2 || rawName.toLowerCase().startsWith('panduan')) {
      continue;
    }

    if (!rawClass) rawClass = detectedClass;

    // Match student
    let matchedStudent =
      (rawNisn && studentMap.get(rawNisn.toLowerCase())) ||
      studentMap.get(rawName.toLowerCase()) ||
      null;

    let isNewStudent = false;
    let studentId = matchedStudent?.id;

    if (!matchedStudent) {
      isNewStudent = true;
      const cleanNisn = rawNisn && rawNisn.length >= 4 ? rawNisn : `008${Math.floor(1000000 + Math.random() * 9000000)}`;
      
      if (!newlyDiscoveredStudents.has(rawName.toLowerCase())) {
        newlyDiscoveredStudents.set(rawName.toLowerCase(), {
          nisn: cleanNisn,
          nis: '',
          nama: rawName,
          kelas: rawClass,
          jenis_kelamin: 'L',
          status: 'Aktif',
          nama_ortu: '',
          no_hp_ortu: '',
          alamat: '',
        });
      }
    }

    // Parse according to format
    if (formatDetected === 'matrix') {
      // Each date column in matrix
      dateColumns.forEach(({ colIdx, dateStr }) => {
        const cellVal = row[colIdx];
        const status = normalizeAttendanceStatus(cellVal);
        if (status) {
          parsedItems.push({
            student_id: studentId,
            student_nama: matchedStudent?.nama || rawName,
            student_nisn: matchedStudent?.nisn || rawNisn,
            student_kelas: matchedStudent?.kelas || rawClass,
            isNewStudent,
            date: dateStr,
            status,
            note: '',
          });
        }
      });
    } else {
      // List format
      const rawDateVal = dateColIdx >= 0 ? row[dateColIdx] : null;
      const dateStr = normalizeExcelDate(rawDateVal, detectedYear, detectedMonth) || getTodayString();
      const rawStatusVal = statusColIdx >= 0 ? row[statusColIdx] : null;
      const status = normalizeAttendanceStatus(rawStatusVal) || 'hadir';
      const noteStr = noteColIdx >= 0 ? String(row[noteColIdx] || '').trim() : '';

      parsedItems.push({
        student_id: studentId,
        student_nama: matchedStudent?.nama || rawName,
        student_nisn: matchedStudent?.nisn || rawNisn,
        student_kelas: matchedStudent?.kelas || rawClass,
        isNewStudent,
        date: dateStr,
        status,
        note: noteStr,
      });
    }
  }

  // Calculate statistics
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alfa = 0;
  const uniqueStudents = new Set<string>();
  let minDate = '';
  let maxDate = '';

  parsedItems.forEach((item) => {
    uniqueStudents.add(item.student_nama.toLowerCase());
    if (item.status === 'hadir') hadir++;
    else if (item.status === 'sakit') sakit++;
    else if (item.status === 'izin') izin++;
    else if (item.status === 'alfa') alfa++;

    if (!minDate || item.date < minDate) minDate = item.date;
    if (!maxDate || item.date > maxDate) maxDate = item.date;
  });

  return {
    items: parsedItems,
    uniqueStudentsCount: uniqueStudents.size,
    newStudentsCount: newlyDiscoveredStudents.size,
    newStudentsList: Array.from(newlyDiscoveredStudents.values()),
    dateRange: {
      start: minDate || getTodayString(),
      end: maxDate || getTodayString(),
    },
    stats: {
      totalRecords: parsedItems.length,
      hadir,
      sakit,
      izin,
      alfa,
    },
    formatDetected,
    errors,
  };
}
