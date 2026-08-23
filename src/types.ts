export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alfa';

export type Gender = 'L' | 'P';

export type StudentStatus = 'Aktif' | 'Nonaktif' | 'Mutasi' | 'Lulus';

export interface Student {
  id: string;
  nisn: string;
  nis?: string;
  nama: string;
  kelas: string;
  jenis_kelamin: Gender;
  status: StudentStatus;
  nama_ortu?: string;
  no_hp_ortu?: string;
  alamat?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  attendance_date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface WarningThresholds {
  yellow: number; // e.g. 3
  red: number; // e.g. 5
  priority: number; // e.g. 10
}

export interface TeacherProfile {
  name: string;
  nip: string;
  schoolName: string;
  schoolAddress: string;
  headmasterName: string;
  headmasterNip: string;
  email: string;
}

export interface AppSettings {
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  classList: string[];
  warningThresholds: WarningThresholds;
  teacherProfile: TeacherProfile;
}

export interface BKNote {
  id: string;
  student_id: string;
  date: string;
  category: 'Panggilan Orang Tua' | 'Bimbingan Pribadi' | 'Home Visit' | 'Peringatan Lisan' | 'Surat Peringatan (SP)' | 'Konferensi Kasus';
  title: string;
  content: string;
  actionTaken: string;
  followUpDate?: string;
  created_at: string;
}

export interface StudentRecap {
  student: Student;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  totalDays: number;
  totalAbsen: number; // sakit + izin + alfa
  percentage: number;
  warningLevel: 'aman' | 'kuning' | 'merah' | 'prioritas';
}

export interface DailyClassSummary {
  date: string;
  kelas: string;
  totalStudents: number;
  recordedCount: number;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  percentage: number;
}
