import * as XLSX from 'xlsx';
import { StudentRecap, AppSettings, Student, AttendanceRecord } from '../types';
import { formatIndonesianDate } from './dateUtils';

// ==========================================
// 1. EXCEL (.XLSX) EXPORT FOR RECAP
// ==========================================
export function exportRecapToExcel(
  recaps: StudentRecap[],
  settings: AppSettings,
  filterInfo: { kelas?: string; periodLabel?: string }
): void {
  // Title & Metadata Rows
  const schoolName = settings.teacherProfile?.schoolName || 'SMAN 1 LEUWILIANG by Riska Puspita';
  const academicYear = settings.academicYear || '2025/2026';
  const semester = settings.semester || 'Ganjil';
  const kelas = filterInfo.kelas || 'Semua Kelas';
  const periodLabel = filterInfo.periodLabel || 'Semua Periode';
  const printDate = formatIndonesianDate(new Date());

  const sheetData: any[][] = [
    [`REKAPITULASI KEHADIRAN SISWA - GURU BK`],
    [`Sekolah: ${schoolName}`],
    [`Tahun Ajaran: ${academicYear} | Semester: ${semester}`],
    [`Rombel Kelas: ${kelas} | Periode: ${periodLabel}`],
    [`Tanggal Cetak: ${printDate}`],
    [], // Blank separator row
    [
      'No',
      'NISN',
      'NIS',
      'Nama Lengkap Siswa',
      'Kelas',
      'L/P',
      'Hadir (H)',
      'Sakit (S)',
      'Izin (I)',
      'Alfa (A)',
      'Total Absen',
      '% Kehadiran',
      'Status Peringatan BK',
    ],
  ];

  // Data rows
  recaps.forEach((r, idx) => {
    let warningText = 'Aman / Normal';
    if (r.warningLevel === 'prioritas') warningText = 'PRIORITAS TINDAK LANJUT BK';
    else if (r.warningLevel === 'merah') warningText = 'Peringatan Merah (SP II / Panggilan Ortu)';
    else if (r.warningLevel === 'kuning') warningText = 'Peringatan Kuning (SP I / Pembinaan)';

    sheetData.push([
      idx + 1,
      r.student.nisn || '',
      r.student.nis || '',
      r.student.nama,
      r.student.kelas,
      r.student.jenis_kelamin,
      r.hadir,
      r.sakit,
      r.izin,
      r.alfa,
      r.totalAbsen,
      `${r.percentage}%`,
      warningText,
    ]);
  });

  // Summary Row at the bottom
  const totalHadir = recaps.reduce((acc, curr) => acc + curr.hadir, 0);
  const totalSakit = recaps.reduce((acc, curr) => acc + curr.sakit, 0);
  const totalIzin = recaps.reduce((acc, curr) => acc + curr.izin, 0);
  const totalAlfa = recaps.reduce((acc, curr) => acc + curr.alfa, 0);
  const avgPercentage =
    recaps.length > 0
      ? Math.round(recaps.reduce((acc, curr) => acc + curr.percentage, 0) / recaps.length)
      : 0;

  sheetData.push([]);
  sheetData.push([
    '',
    '',
    '',
    'TOTAL / RATA-RATA',
    '',
    '',
    totalHadir,
    totalSakit,
    totalIzin,
    totalAlfa,
    totalSakit + totalIzin + totalAlfa,
    `${avgPercentage}%`,
    '',
  ]);

  // Signatures
  sheetData.push([]);
  sheetData.push([]);
  sheetData.push([
    '',
    '',
    '',
    'Mengetahui,',
    '',
    '',
    '',
    '',
    '',
    `Kota Pendidikan, ${printDate}`,
  ]);
  sheetData.push([
    '',
    '',
    '',
    'Kepala Sekolah',
    '',
    '',
    '',
    '',
    '',
    'Guru Bimbingan Konseling (BK)',
  ]);
  sheetData.push([]);
  sheetData.push([]);
  sheetData.push([]);
  sheetData.push([
    '',
    '',
    '',
    settings.teacherProfile?.headmasterName || 'Drs. H. Hendra Wijaya, M.Pd.',
    '',
    '',
    '',
    '',
    '',
    settings.teacherProfile?.name || 'Riska Puspita, S.Pd., Kons.',
  ]);
  sheetData.push([
    '',
    '',
    '',
    `NIP. ${settings.teacherProfile?.headmasterNip || '197508122000031002'}`,
    '',
    '',
    '',
    '',
    '',
    `NIP. ${settings.teacherProfile?.nip || '198805202012012004'}`,
  ]);

  // Build workbook & worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NISN
    { wch: 10 }, // NIS
    { wch: 30 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 6 },  // L/P
    { wch: 10 }, // Hadir
    { wch: 10 }, // Sakit
    { wch: 10 }, // Izin
    { wch: 10 }, // Alfa
    { wch: 12 }, // Total Absen
    { wch: 14 }, // % Kehadiran
    { wch: 35 }, // Status BK
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi Kehadiran');

  // File Name
  const safeClass = (kelas || 'Semua').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Rekap_Absensi_BK_${safeClass}_${new Date().toISOString().split('T')[0]}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

// ==========================================
// 2. EXCEL (.XLSX) EXPORT FOR STUDENTS
// ==========================================
export function exportStudentsToExcel(students: Student[], classFilter: string = 'Semua'): void {
  const headers = [
    'No',
    'NISN',
    'NIS',
    'Nama Lengkap Siswa',
    'Kelas',
    'Jenis Kelamin (L/P)',
    'Status Siswa',
    'Nama Orang Tua / Wali',
    'No HP / WA Wali',
    'Alamat Domisili',
  ];

  const rows = students.map((s, idx) => [
    idx + 1,
    s.nisn,
    s.nis || '',
    s.nama,
    s.kelas,
    s.jenis_kelamin,
    s.status,
    s.nama_ortu || '',
    s.no_hp_ortu || '',
    s.alamat || '',
  ]);

  const sheetData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 12 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 25 },
    { wch: 18 },
    { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');

  const safeClass = classFilter.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Data_Master_Siswa_${safeClass}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ==========================================
// 3. EXCEL (.XLSX) EXPORT FOR DAILY ATTENDANCE
// ==========================================
export function exportDailyAttendanceToExcel(
  records: AttendanceRecord[],
  students: Student[],
  date: string,
  selectedClass: string
): void {
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  const headers = [
    'No',
    'NISN',
    'NIS',
    'Nama Siswa',
    'Kelas',
    'Jenis Kelamin',
    'Status Kehadiran',
    'Catatan / Alasan',
  ];

  const filteredStudents = students.filter((s) =>
    selectedClass === 'Semua' ? true : s.kelas === selectedClass
  );

  const rows = filteredStudents.map((student, idx) => {
    const rec = records.find((r) => r.student_id === student.id && r.attendance_date === date);
    const status = rec ? rec.status.toUpperCase() : 'BELUM DIISI';
    const note = rec?.note || '';

    return [
      idx + 1,
      student.nisn,
      student.nis || '',
      student.nama,
      student.kelas,
      student.jenis_kelamin,
      status,
      note,
    ];
  });

  const sheetData = [
    [`PRESENSI HARIAN SISWA SMA`],
    [`Tanggal: ${formatIndonesianDate(date, true)}`],
    [`Kelas: ${selectedClass}`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 12 },
    { wch: 30 },
    { wch: 10 },
    { wch: 8 },
    { wch: 18 },
    { wch: 35 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Presensi Harian');

  const fileName = `Presensi_${selectedClass}_${date}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ==========================================
// 4. DOWNLOAD EXCEL (.XLSX) TEMPLATE FOR IMPORT
// ==========================================
export function downloadStudentExcelTemplate(): void {
  const headers = [
    'NISN',
    'NIS',
    'Nama Siswa',
    'Kelas',
    'Jenis Kelamin (L/P)',
    'Status',
    'Nama Orang Tua',
    'No HP Orang Tua',
    'Alamat',
  ];

  const sampleData = [
    headers,
    [
      '0081234567',
      '24251001',
      'Ahmad Rizky Pratama',
      'X-1',
      'L',
      'Aktif',
      'Bambang Sutrisno',
      '081234567890',
      'Jl. Merdeka No. 12, Kel. Sukamaju',
    ],
    [
      '0081234568',
      '24251002',
      'Nadine Azzahra Putri',
      'X-1',
      'P',
      'Aktif',
      'Hendra Setiawan',
      '081298765432',
      'Jl. Melati Indah No. 4, RT 02/05',
    ],
    [
      '0081234569',
      '24251003',
      'Dimas Arya Saputra',
      'X-2',
      'L',
      'Aktif',
      'Suryanto',
      '081377889900',
      'Jl. Dahlia No. 18',
    ],
    [
      '0081234570',
      '24251004',
      'Siti Nurhaliza',
      'XI MIPA 1',
      'P',
      'Aktif',
      'Faisal Malik',
      '085611223344',
      'Komplek Asri Blok C-3',
    ],
  ];

  const instructions = [
    ['PANDUAN PENGISIAN TEMPLATE IMPORT SISWA'],
    [],
    ['1. Kolom NISN wajib diisi dengan angka unik.'],
    ['2. Kolom Nama Siswa dan Kelas wajib diisi.'],
    ['3. Kolom Jenis Kelamin diisi "L" untuk Laki-Laki atau "P" untuk Perempuan.'],
    ['4. Kolom Status diisi "Aktif", "Nonaktif", "Mutasi", atau "Lulus" (default: Aktif).'],
    ['5. Kolom No HP Orang Tua diisi format nomor WhatsApp (misal: 08123456789).'],
    ['6. Jangan mengubah atau menghapus baris judul kolom pada Sheet Data Siswa.'],
  ];

  const wb = XLSX.utils.book_new();

  const wsData = XLSX.utils.aoa_to_sheet(sampleData);
  wsData['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 28 },
    { wch: 12 },
    { wch: 18 },
    { wch: 12 },
    { wch: 22 },
    { wch: 18 },
    { wch: 35 },
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(instructions);
  wsGuide['!cols'] = [{ wch: 60 }];

  XLSX.utils.book_append_sheet(wb, wsData, 'Data Siswa');
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan');

  XLSX.writeFile(wb, 'Template_Import_Siswa_SMA.xlsx');
}

// ==========================================
// 5. DOWNLOAD CSV TEMPLATE FOR IMPORT
// ==========================================
export function downloadStudentCSVTemplate(): void {
  const sampleData = [
    'NISN,NIS,Nama Siswa,Kelas,Jenis Kelamin (L/P),Status,Nama Orang Tua,No HP Orang Tua,Alamat',
    '0081234567,24251050,"Muhammad Fadhil",X-1,L,Aktif,"Fauzan Hakim","081234567890","Jl. Kebon Jeruk No. 10"',
    '0081234568,24251051,"Nadine Azzahra",X-1,P,Aktif,"Agus Hendra","081298765432","Jl. Melati Raya No. 4"',
  ].join('\n');

  const blob = new Blob(['\uFEFF' + sampleData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Import_Siswa.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// 5B. DOWNLOAD EXCEL TEMPLATE FOR SINGLE CLASS ATTENDANCE (MAX 50 STUDENTS)
// ==========================================
export function downloadClassAttendanceExcelTemplate(targetClass: string = 'X-1'): void {
  const titleHeader = [
    [`DAFTAR NAMA ABSENSI SISWA KELAS ${targetClass.toUpperCase()}`],
    [`SMAN 1 LEUWILIANG by Riska Puspita`],
    [`Kapasitas Format: Maksimal 50 Siswa per Kelas`],
    [],
  ];

  const headers = [
    'No',
    'Nama Siswa (Wajib)',
    'NISN (10 Digit)',
    'NIS',
    'Jenis Kelamin (L/P)',
    'Kelas',
    'No HP Orang Tua / WhatsApp',
    'Nama Orang Tua',
  ];

  const sampleNames = [
    { nama: 'Aditia Pratama', jk: 'L', hp: '081234567801', ortu: 'Bambang Pratama' },
    { nama: 'Aisyah Putri Azzahra', jk: 'P', hp: '081234567802', ortu: 'Hendra Wijaya' },
    { nama: 'Alif Kurniawan', jk: 'L', hp: '081234567803', ortu: 'Kurnia Santoso' },
    { nama: 'Anisa Rahmawati', jk: 'P', hp: '081234567804', ortu: 'Rahmat Hidayat' },
    { nama: 'Bagas Sanjaya', jk: 'L', hp: '081234567805', ortu: 'Sanjaya Putra' },
    { nama: 'Cantika Dewi Lestari', jk: 'P', hp: '081234567806', ortu: 'Dewi Sartika' },
    { nama: 'Daffa Rizky Ramadhan', jk: 'L', hp: '081234567807', ortu: 'Ramadhan Syah' },
    { nama: 'Dinda Permata Sari', jk: 'P', hp: '081234567808', ortu: 'Permana Sidik' },
    { nama: 'Fajar Nugraha', jk: 'L', hp: '081234567809', ortu: 'Nugraha Budi' },
    { nama: 'Farhan Maulana', jk: 'L', hp: '081234567810', ortu: 'Maulana Malik' },
    { nama: 'Ghaida Nurul Izzah', jk: 'P', hp: '081234567811', ortu: 'Nurul Huda' },
    { nama: 'Gilang Ramadhan', jk: 'L', hp: '081234567812', ortu: 'Suharja' },
    { nama: 'Hana Khairunnisa', jk: 'P', hp: '081234567813', ortu: 'Khairul Anwar' },
    { nama: 'Irfan Hakim', jk: 'L', hp: '081234567814', ortu: 'Hakim Lukman' },
    { nama: 'Kaysha Nabila', jk: 'P', hp: '081234567815', ortu: 'Nabil Mansur' },
    { nama: 'Lutfi Fadilah', jk: 'L', hp: '081234567816', ortu: 'Fadilah Hasan' },
    { nama: 'Muhammad Fadhil', jk: 'L', hp: '081234567817', ortu: 'Fauzan Hakim' },
    { nama: 'Nadine Azzahra', jk: 'P', hp: '081234567818', ortu: 'Agus Hendra' },
    { nama: 'Rafi Ahmad Fauzi', jk: 'L', hp: '081234567819', ortu: 'Ahmad Fauzi' },
    { nama: 'Zahra Amelia', jk: 'P', hp: '081234567820', ortu: 'Amiruddin' },
  ];

  const rows: any[][] = [];
  sampleNames.forEach((s, idx) => {
    const num = idx + 1;
    const nisn = `008${String(1234500 + num).padStart(7, '0')}`;
    const nis = `2526${String(100 + num)}`;
    rows.push([
      num,
      s.nama,
      nisn,
      nis,
      s.jk,
      targetClass,
      s.hp,
      s.ortu,
    ]);
  });

  const fullData = [...titleHeader, headers, ...rows];

  const instructions = [
    ['PANDUAN PENGISIAN DAFTAR NAMA ABSENSI KELAS (MAKSIMAL 50 SISWA)'],
    [],
    ['1. File ini digunakan khusus untuk mengimpor data absensi siswa pada 1 rombongan belajar (kelas).'],
    ['2. Batas maksimal siswa per kelas yang diimpor adalah 50 siswa.'],
    ['3. Kolom "Nama Siswa" adalah kolom WAJIB diisi.'],
    ['4. Kolom NISN opsional (jika kosong, sistem akan menghasilkan NISN unik otomatis).'],
    ['5. Kolom Jenis Kelamin diisi "L" (Laki-laki) atau "P" (Perempuan).'],
    ['6. Kolom Kelas dapat disesuaikan (misal: X-1, X-2, XI-IPA-1, dll).'],
    ['7. Simpan file sebagai Excel (.xlsx/.xls) atau CSV, kemudian unggah pada aplikasi SMAN 1 Leuwiliang.'],
  ];

  const wb = XLSX.utils.book_new();

  const wsData = XLSX.utils.aoa_to_sheet(fullData);
  wsData['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 12 },
    { wch: 25 },
    { wch: 25 },
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(instructions);
  wsGuide['!cols'] = [{ wch: 70 }];

  XLSX.utils.book_append_sheet(wb, wsData, `Absen_${targetClass}`);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan Import');

  XLSX.writeFile(wb, `Template_Absen_${targetClass.replace(/\s+/g, '_')}_Maks50.xlsx`);
}

// ==========================================
// 6. PARSE FILE (XLSX, XLS, OR CSV) INTO STUDENTS
// ==========================================
export async function parseStudentsFromFile(
  file: File
): Promise<Array<Omit<Student, 'id' | 'created_at'>>> {
  const isCSV = file.name.endsWith('.csv');

  if (isCSV) {
    const text = await file.text();
    return parseStudentsCSV(text);
  }

  // Parse XLSX / XLS using SheetJS arrayBuffer
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (jsonData.length < 2) return [];

  // Find header row (either row 0 or row 1)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
    const row = jsonData[i] || [];
    const joined = row.map((c) => String(c).toLowerCase()).join(' ');
    if (joined.includes('nama') || joined.includes('nisn')) {
      headerRowIndex = i;
      break;
    }
  }

  const results: Array<Omit<Student, 'id' | 'created_at'>> = [];

  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    // Col mapping based on template or common order
    const col0 = row[0] !== undefined ? String(row[0]).trim() : '';
    const col1 = row[1] !== undefined ? String(row[1]).trim() : '';
    const col2 = row[2] !== undefined ? String(row[2]).trim() : '';
    const col3 = row[3] !== undefined ? String(row[3]).trim() : '';
    const col4 = row[4] !== undefined ? String(row[4]).trim() : '';
    const col5 = row[5] !== undefined ? String(row[5]).trim() : '';
    const col6 = row[6] !== undefined ? String(row[6]).trim() : '';
    const col7 = row[7] !== undefined ? String(row[7]).trim() : '';
    const col8 = row[8] !== undefined ? String(row[8]).trim() : '';

    // If first column is No (e.g. 1, 2, 3), shift right
    let nisn = col0;
    let nis = col1;
    let nama = col2;
    let kelas = col3;
    let jk = col4;
    let status = col5;
    let nama_ortu = col6;
    let no_hp = col7;
    let alamat = col8;

    // Check if col0 was an index number
    if (/^\d{1,3}$/.test(col0) && /^\d{5,12}$/.test(col1)) {
      nisn = col1;
      nis = col2;
      nama = col3;
      kelas = col4;
      jk = col5;
      status = col6;
      nama_ortu = col7;
      no_hp = col8;
      alamat = row[9] ? String(row[9]).trim() : '';
    }

    if (!nama && col1) {
      nama = col1;
      kelas = col2;
    }

    if (nama && nama.length > 1) {
      const cleanJk = (jk || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
      const cleanStatus =
        status === 'Nonaktif' || status === 'Mutasi' || status === 'Lulus' ? status : 'Aktif';

      results.push({
        nisn: nisn || `008${Math.floor(1000000 + Math.random() * 9000000)}`,
        nis: nis || '',
        nama: nama,
        kelas: kelas || 'X-1',
        jenis_kelamin: cleanJk,
        status: cleanStatus,
        nama_ortu: nama_ortu || '',
        no_hp_ortu: no_hp || '',
        alamat: alamat || '',
      });
    }
  }

  return results;
}

// Legacy / CSV Parser helper
export function parseStudentsCSV(csvText: string): Array<Omit<Student, 'id' | 'created_at'>> {
  const lines = csvText.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const results: Array<Omit<Student, 'id' | 'created_at'>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (matches.length > 10) break;
    }

    if (matches.length >= 3) {
      const nisn = matches[0] || `007${Math.floor(1000000 + Math.random() * 9000000)}`;
      const nis = matches[1] || '';
      const nama = matches[2];
      const kelas = matches[3] || 'X-1';
      const jk = (matches[4] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
      const status = (matches[5] as any) || 'Aktif';
      const nama_ortu = matches[6] || '';
      const no_hp_ortu = matches[7] || '';
      const alamat = matches[8] || '';

      if (nama) {
        results.push({
          nisn,
          nis,
          nama,
          kelas,
          jenis_kelamin: jk,
          status: status === 'Nonaktif' || status === 'Mutasi' || status === 'Lulus' ? status : 'Aktif',
          nama_ortu,
          no_hp_ortu,
          alamat,
        });
      }
    }
  }

  return results;
}

// ==========================================
// 6B. SPECIALIZED CLASS EXCEL PARSER (MAX 50 STUDENTS PER CLASS)
// ==========================================
export interface ClassExcelParseResult {
  students: Array<Omit<Student, 'id' | 'created_at'>>;
  totalFound: number;
  isExceededLimit: boolean;
  maxLimit: number;
  detectedClassName?: string;
}

export async function parseClassAttendanceExcel(
  file: File,
  targetClass: string
): Promise<ClassExcelParseResult> {
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

  if (rawRows.length === 0) {
    return {
      students: [],
      totalFound: 0,
      isExceededLimit: false,
      maxLimit: 50,
    };
  }

  // Detect header row or look for rows where name exists
  let headerRowIndex = -1;
  let nameColIdx = 1;
  let nisnColIdx = -1;
  let nisColIdx = -1;
  let jkColIdx = -1;
  let hpColIdx = -1;
  let ortuColIdx = -1;
  let detectedClass = targetClass;

  // Search first 8 rows for headers
  for (let i = 0; i < Math.min(rawRows.length, 8); i++) {
    const row = rawRows[i] || [];
    const joined = row.map((c) => String(c || '').toLowerCase()).join(' ');

    // Check if header row
    if (joined.includes('nama') || joined.includes('siswa') || joined.includes('student')) {
      headerRowIndex = i;
      row.forEach((cell, idx) => {
        const text = String(cell || '').toLowerCase().trim();
        if (text.includes('nama')) nameColIdx = idx;
        else if (text.includes('nisn')) nisnColIdx = idx;
        else if (text.includes('nis') && !text.includes('nisn')) nisColIdx = idx;
        else if (text.includes('jk') || text.includes('kelamin') || text.includes('l/p') || text.includes('gender')) jkColIdx = idx;
        else if (text.includes('hp') || text.includes('wa') || text.includes('telepon') || text.includes('kontak')) hpColIdx = idx;
        else if (text.includes('ortu') || text.includes('wali') || text.includes('ayah') || text.includes('ibu')) ortuColIdx = idx;
        else if (text.includes('kelas') || text.includes('rombel')) {
          // If header has a class value in subsequent data
        }
      });
      break;
    }
  }

  const parsedStudents: Array<Omit<Student, 'id' | 'created_at'>> = [];
  const startIdx = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

  for (let i = startIdx; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    // Check if this row is a metadata / note line
    const firstCell = String(row[0] || '').trim();
    if (firstCell.toLowerCase().startsWith('panduan') || firstCell.toLowerCase().startsWith('catatan') || firstCell.toLowerCase().startsWith('kapasitas') || firstCell.toLowerCase().startsWith('guru bk') || firstCell.toLowerCase().startsWith('daftar nama')) {
      continue;
    }

    let rawName = '';
    let rawNisn = '';
    let rawNis = '';
    let rawJk = '';
    let rawHp = '';
    let rawOrtu = '';

    if (nameColIdx >= 0 && row[nameColIdx]) {
      rawName = String(row[nameColIdx]).trim();
    } else {
      // Fallback: check columns for name-like string
      for (let c = 0; c < Math.min(row.length, 4); c++) {
        const val = String(row[c] || '').trim();
        if (val && isNaN(Number(val)) && val.length > 2 && !val.toLowerCase().startsWith('panduan') && !val.toLowerCase().startsWith('no')) {
          rawName = val;
          break;
        }
      }
    }

    // Clean up name if it has leading number like "1. Budi Santoso"
    rawName = rawName.replace(/^\d+[\.\)\-\s]+/, '').trim();

    // Skip empty or invalid name rows
    if (!rawName || rawName.length < 2 || rawName.toLowerCase() === 'nama siswa' || rawName.toLowerCase() === 'nama') {
      continue;
    }

    if (nisnColIdx >= 0 && row[nisnColIdx]) {
      rawNisn = String(row[nisnColIdx]).trim();
    }
    if (nisColIdx >= 0 && row[nisColIdx]) {
      rawNis = String(row[nisColIdx]).trim();
    }
    if (jkColIdx >= 0 && row[jkColIdx]) {
      rawJk = String(row[jkColIdx]).trim();
    }
    if (hpColIdx >= 0 && row[hpColIdx]) {
      rawHp = String(row[hpColIdx]).trim();
    }
    if (ortuColIdx >= 0 && row[ortuColIdx]) {
      rawOrtu = String(row[ortuColIdx]).trim();
    }

    // Generate valid NISN if empty
    const cleanNisn = rawNisn && rawNisn.length >= 4 ? rawNisn : `008${Math.floor(1000000 + Math.random() * 9000000)}`;
    const cleanJk = (rawJk || 'L').toUpperCase().startsWith('P') || rawJk.toUpperCase() === 'WANITA' || rawJk.toUpperCase() === 'PEREMPUAN' ? 'P' : 'L';

    parsedStudents.push({
      nisn: cleanNisn,
      nis: rawNis || '',
      nama: rawName,
      kelas: targetClass,
      jenis_kelamin: cleanJk,
      status: 'Aktif',
      nama_ortu: rawOrtu || '',
      no_hp_ortu: rawHp || '',
      alamat: '',
    });
  }

  const totalFound = parsedStudents.length;
  const isExceededLimit = totalFound > 50;
  // Apply hard limit of 50 students per class import
  const limitedStudents = parsedStudents.slice(0, 50);

  return {
    students: limitedStudents,
    totalFound,
    isExceededLimit,
    maxLimit: 50,
    detectedClassName: detectedClass,
  };
}

// ==========================================
// 7. CSV EXPORT FOR RECAP (COMPATIBILITY)
// ==========================================
export function exportRecapToCSV(
  recaps: StudentRecap[],
  settings: AppSettings,
  filterInfo: { kelas?: string; periodLabel?: string }
): void {
  const headers = [
    'No',
    'NISN',
    'NIS',
    'Nama Siswa',
    'Kelas',
    'Jenis Kelamin',
    'Hadir (H)',
    'Sakit (S)',
    'Izin (I)',
    'Alfa (A)',
    'Total Tidak Hadir',
    'Persentase Kehadiran (%)',
    'Status Peringatan BK',
  ];

  const rows = recaps.map((r, idx) => {
    let warningText = 'Normal';
    if (r.warningLevel === 'prioritas') warningText = 'Prioritas Tindak Lanjut BK';
    else if (r.warningLevel === 'merah') warningText = 'Peringatan Merah (SP II / Ortu)';
    else if (r.warningLevel === 'kuning') warningText = 'Peringatan Kuning (SP I)';

    return [
      idx + 1,
      `"${r.student.nisn || ''}"`,
      `"${r.student.nis || ''}"`,
      `"${r.student.nama.replace(/"/g, '""')}"`,
      `"${r.student.kelas}"`,
      r.student.jenis_kelamin,
      r.hadir,
      r.sakit,
      r.izin,
      r.alfa,
      r.totalAbsen,
      `${r.percentage}%`,
      `"${warningText}"`,
    ];
  });

  const metadataRows = [
    [`"REKAPITULASI ABSENSI SISWA - GURU BK"`],
    [`"Sekolah: ${settings.teacherProfile.schoolName}"`],
    [`"Tahun Ajaran: ${settings.academicYear} - Semester: ${settings.semester}"`],
    [`"Kelas: ${filterInfo.kelas || 'Semua Kelas'}"`],
    [`"Periode: ${filterInfo.periodLabel || 'Semua'}"`],
    [`"Dicetak pada: ${formatIndonesianDate(new Date())}"`],
    [],
  ];

  const csvContent =
    '\uFEFF' +
    metadataRows.map((e) => e.join(',')).join('\n') +
    headers.join(',') +
    '\n' +
    rows.map((e) => e.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const fileName = `Rekap_Absensi_${(filterInfo.kelas || 'Semua').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// CSV Export for Students
export function exportStudentsToCSV(students: Student[]): void {
  const headers = [
    'NISN',
    'NIS',
    'Nama Siswa',
    'Kelas',
    'Jenis Kelamin (L/P)',
    'Status',
    'Nama Orang Tua',
    'No HP Orang Tua',
    'Alamat',
  ];
  const rows = students.map((s) => [
    `"${s.nisn}"`,
    `"${s.nis || ''}"`,
    `"${s.nama.replace(/"/g, '""')}"`,
    `"${s.kelas}"`,
    s.jenis_kelamin,
    s.status,
    `"${(s.nama_ortu || '').replace(/"/g, '""')}"`,
    `"${s.no_hp_ortu || ''}"`,
    `"${(s.alamat || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.map((e) => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Data_Siswa_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
