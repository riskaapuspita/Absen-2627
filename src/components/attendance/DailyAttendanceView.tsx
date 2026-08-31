import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Users,
  CheckCheck,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Search,
  Check,
  FileSpreadsheet,
  Sparkles,
  HelpCircle,
  UserPlus,
  Upload,
  BarChart3,
  Share2,
} from 'lucide-react';
import { Student, AttendanceRecord, AppSettings, AttendanceStatus } from '../../types';
import { saveDailyAttendance, getAttendanceByDateAndClass } from '../../services/storageService';
import { formatIndonesianDate, getTodayString } from '../../utils/dateUtils';
import { exportDailyAttendanceToExcel } from '../../utils/exportUtils';
import { triggerColorfulConfetti } from '../../utils/confetti';
import { ImportClassExcelModal } from '../common/ImportClassExcelModal';
import { ManualAddStudentModal } from '../common/ManualAddStudentModal';
import { DailyRecapModal } from './DailyRecapModal';

interface DailyAttendanceViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: AppSettings;
  onOpenStudentDetail: (student: Student) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

interface StudentAttendanceRow {
  student: Student;
  status: AttendanceStatus | null;
  note: string;
  isModified: boolean;
  isExisting: boolean;
}

export const DailyAttendanceView: React.FC<DailyAttendanceViewProps> = ({
  students,
  attendanceRecords,
  settings,
  onOpenStudentDetail,
  showToast,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedClass, setSelectedClass] = useState<string>(settings.classList[0] || 'X-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [attendanceRows, setAttendanceRows] = useState<StudentAttendanceRow[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasExistingData, setHasExistingData] = useState<boolean>(false);

  // Modals for Import & Manual Add
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState<boolean>(false);
  const [isDailyRecapModalOpen, setIsDailyRecapModalOpen] = useState<boolean>(false);

  // Load students for chosen date and class
  const loadClassStudents = () => {
    const activeStudents = students.filter(
      (s) => s.kelas === selectedClass && s.status === 'Aktif'
    );

    const existingForClass = getAttendanceByDateAndClass(selectedDate, selectedClass);
    const existingCount = existingForClass.filter((item) => item.record !== undefined).length;
    setHasExistingData(existingCount > 0);

    const rows: StudentAttendanceRow[] = activeStudents.map((student) => {
      const existing = existingForClass.find((item) => item.student.id === student.id)?.record;
      return {
        student,
        status: existing ? existing.status : null,
        note: existing?.note || '',
        isModified: false,
        isExisting: !!existing,
      };
    });

    setAttendanceRows(rows);
  };

  // Re-sync when selectedDate, selectedClass, or students change
  useEffect(() => {
    loadClassStudents();
  }, [selectedDate, selectedClass, students, attendanceRecords]);

  // Bulk action: Hadir Semua
  const handleMarkAllHadir = () => {
    setAttendanceRows((prev) =>
      prev.map((row) => ({
        ...row,
        status: 'hadir',
        isModified: true,
      }))
    );

    triggerColorfulConfetti();
    showToast(
      'success',
      'Semua Siswa Hadir',
      `Status ${attendanceRows.length} siswa di Kelas ${selectedClass} berhasil diset Hadir.`
    );
  };

  // Reset to previous or blank
  const handleResetAttendance = () => {
    loadClassStudents();
    showToast('info', 'Form Absensi Direset', 'Mengembalikan formulir ke data awal tersimpan.');
  };

  // Update status for single student
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setAttendanceRows((prev) =>
      prev.map((row) => {
        if (row.student.id === studentId) {
          return {
            ...row,
            status: newStatus,
            isModified: true,
          };
        }
        return row;
      })
    );
  };

  // Update note for single student
  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceRows((prev) =>
      prev.map((row) => (row.student.id === studentId ? { ...row, note, isModified: true } : row))
    );
  };

  // Export Today's Class Attendance to Excel
  const handleExportTodayExcel = () => {
    exportDailyAttendanceToExcel(attendanceRecords, students, selectedDate, selectedClass);
    triggerColorfulConfetti();
    showToast(
      'success',
      'Ekspor Absensi Harian Berhasil',
      `File Excel presensi Kelas ${selectedClass} tanggal ${formatIndonesianDate(selectedDate, true)} telah diunduh.`
    );
  };

  // Save Attendance
  const handleSave = () => {
    if (!selectedClass) {
      showToast('error', 'Validasi Gagal', 'Silakan pilih kelas terlebih dahulu.');
      return;
    }

    if (!selectedDate) {
      showToast('error', 'Validasi Gagal', 'Silakan pilih tanggal absensi terlebih dahulu.');
      return;
    }

    // Check unfilled students
    const unfilled = attendanceRows.filter((r) => r.status === null);
    if (unfilled.length > 0) {
      const confirmSave = window.confirm(
        `Ada ${unfilled.length} siswa yang belum dipilih statusnya. Siswa tersebut akan otomatis ditandai 'Alfa' jika disimpan. Lanjutkan?`
      );
      if (!confirmSave) return;
    }

    setIsSaving(true);

    try {
      const recordsToSave = attendanceRows.map((row) => ({
        student_id: row.student.id,
        status: (row.status || 'alfa') as AttendanceStatus,
        note: row.note.trim() || undefined,
      }));

      const result = saveDailyAttendance(selectedDate, recordsToSave);

      setIsSaving(false);
      setHasExistingData(true);
      triggerColorfulConfetti();
      showToast(
        'success',
        'Presensi Berhasil Disimpan',
        `Data presensi Kelas ${selectedClass} (${result.created} baru, ${result.updated} diperbarui) tanggal ${formatIndonesianDate(selectedDate, true)} berhasil tersimpan.`
      );

      // Open automatic daily recap modal right after save!
      setIsDailyRecapModalOpen(true);
    } catch (e) {
      setIsSaving(false);
      showToast('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan data absensi.');
    }
  };

  // Filtered rows by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return attendanceRows;
    const q = searchQuery.toLowerCase();
    return attendanceRows.filter(
      (r) =>
        r.student.nama.toLowerCase().includes(q) ||
        r.student.nisn.includes(q) ||
        (r.student.nis && r.student.nis.includes(q))
    );
  }, [attendanceRows, searchQuery]);

  // Statistics of current active form
  const stats = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    let belum = 0;

    attendanceRows.forEach((r) => {
      if (r.status === 'hadir') hadir++;
      else if (r.status === 'sakit') sakit++;
      else if (r.status === 'izin') izin++;
      else if (r.status === 'alfa') alfa++;
      else belum++;
    });

    const total = attendanceRows.length;
    const filled = total - belum;
    const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

    return { total, filled, hadir, sakit, izin, alfa, belum, percentage };
  }, [attendanceRows]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Filter & Control Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pencatatan Presensi Harian Siswa
              </h2>
              <p className="text-xs text-slate-500">
                Pilih tanggal dan rombel kelas, lalu tentukan status kehadiran Hadir, Sakit, Izin, atau Alfa
              </p>
            </div>
          </div>

          {/* Date & Class pickers and Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tanggal */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <label htmlFor="daily-date-input" className="text-xs font-semibold text-slate-600">
                Tanggal:
              </label>
              <input
                id="daily-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-hidden cursor-pointer"
              />
            </div>

            {/* Kelas */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <label htmlFor="daily-class-select" className="text-xs font-semibold text-slate-600">
                Kelas:
              </label>
              <select
                id="daily-class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-hidden cursor-pointer"
              >
                {settings.classList.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Impor Excel Absen 1 Kelas (Maks. 50 Siswa) */}
            <button
              id="import-daily-class-excel-btn"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
              title="Impor data absen siswa untuk kelas ini dari file Excel (Maksimal 50 siswa)"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Impor Excel Absen (Maks. 50)</span>
            </button>

            {/* Tambah Manual Nama Siswa */}
            <button
              id="add-manual-daily-student-btn"
              onClick={() => setIsManualAddModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              title="Tambah nama siswa secara manual ke kelas ini"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Manual Siswa</span>
            </button>

            {/* Tombol Lihat Rekap Harian Otomatis */}
            <button
              id="view-daily-recap-btn"
              onClick={() => setIsDailyRecapModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              title="Lihat rekapitulasi kehadiran otomatis dan format laporan hari ini"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Lihat Rekap Harian</span>
            </button>

            {/* Ekspor Excel Hari Ini */}
            <button
              id="export-daily-excel-btn"
              onClick={handleExportTodayExcel}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              title="Unduh format spreadsheet harian"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* Existing Data Notification Indicator */}
        {hasExistingData ? (
          <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border border-emerald-200 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Data Presensi Tersimpan:</strong> Absensi Kelas {selectedClass} pada tanggal{' '}
                {formatIndonesianDate(selectedDate, true)} sudah tersimpan ({stats.hadir} Hadir, {stats.sakit} Sakit, {stats.izin} Izin, {stats.alfa} Alfa).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDailyRecapModalOpen(true)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Buka Rekap Harian & Format WA</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border border-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Presensi Belum Tercatat:</strong> Belum ada rekaman kehadiran untuk Kelas {selectedClass} pada tanggal{' '}
                {formatIndonesianDate(selectedDate, true)}.
              </span>
            </div>
            {stats.filled > 0 && (
              <button
                type="button"
                onClick={() => setIsDailyRecapModalOpen(true)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Pratinjau Rekap Harian</span>
              </button>
            )}
          </div>
        )}

        {/* Quick Action Toolbar & Live Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Hadir Semua */}
            <button
              id="mark-all-hadir-btn"
              onClick={handleMarkAllHadir}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Hadirkan Semua</span>
            </button>

            {/* Tombol Reset Absensi */}
            <button
              id="reset-attendance-btn"
              onClick={handleResetAttendance}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              title="Kembalikan formulir ke data awal"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            {/* Tombol Simpan Absensi */}
            <button
              id="save-daily-attendance-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-slate-900 hover:bg-black active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Presensi'}</span>
            </button>
          </div>

          {/* Status Counter Pills with Live % */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Hadir: {stats.hadir}
            </span>
            <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Sakit: {stats.sakit}
            </span>
            <span className="px-3 py-1 rounded-xl bg-sky-50 text-sky-800 font-bold border border-sky-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Izin: {stats.izin}
            </span>
            <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-800 font-bold border border-rose-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Alfa: {stats.alfa}
            </span>
            <button
              type="button"
              onClick={() => setIsDailyRecapModalOpen(true)}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-2xs hover:opacity-90 transition-all flex items-center gap-1"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Rekap Harian</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search within class list */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-daily-student-input"
            type="text"
            placeholder="Cari siswa dalam kelas ini..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-slate-200/80 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
        <p className="text-xs text-slate-500">
          Menampilkan <strong>{filteredRows.length}</strong> siswa di Kelas {selectedClass}
        </p>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-3 w-24 text-center">NISN</th>
                <th className="py-3.5 px-3 w-16 text-center">L/P</th>
                <th className="py-3.5 px-4 text-center min-w-[320px]">Status Kehadiran</th>
                <th className="py-3.5 px-4 min-w-[200px]">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length > 0 ? (
                filteredRows.map((row, idx) => {
                  return (
                    <tr
                      key={row.student.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        row.status === 'alfa'
                          ? 'bg-rose-50/40'
                          : row.status === 'sakit'
                          ? 'bg-amber-50/30'
                          : row.status === 'izin'
                          ? 'bg-sky-50/30'
                          : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Nama Siswa */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onOpenStudentDetail(row.student)}
                          className="font-bold text-slate-900 hover:text-emerald-700 text-left block"
                        >
                          {row.student.nama}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {row.student.nis ? `NIS: ${row.student.nis}` : ''}
                        </span>
                      </td>

                      {/* NISN */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {row.student.nisn}
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.student.jenis_kelamin === 'L'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {row.student.jenis_kelamin}
                        </span>
                      </td>

                      {/* Status Selector Button Group */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-sm mx-auto shadow-inner">
                          {/* Hadir */}
                          <button
                            type="button"
                            id={`status-hadir-${row.student.id}`}
                            onClick={() => handleStatusChange(row.student.id, 'hadir')}
                            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                              row.status === 'hadir'
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                                : 'text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Hadir</span>
                          </button>

                          {/* Sakit */}
                          <button
                            type="button"
                            id={`status-sakit-${row.student.id}`}
                            onClick={() => handleStatusChange(row.student.id, 'sakit')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                              row.status === 'sakit'
                                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20'
                                : 'text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Sakit</span>
                          </button>

                          {/* Izin */}
                          <button
                            type="button"
                            id={`status-izin-${row.student.id}`}
                            onClick={() => handleStatusChange(row.student.id, 'izin')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                              row.status === 'izin'
                                ? 'bg-sky-500 text-white shadow-sm ring-2 ring-sky-500/20'
                                : 'text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Izin</span>
                          </button>

                          {/* Alfa */}
                          <button
                            type="button"
                            id={`status-alfa-${row.student.id}`}
                            onClick={() => handleStatusChange(row.student.id, 'alfa')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                              row.status === 'alfa'
                                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/20'
                                : 'text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Alfa</span>
                          </button>
                        </div>
                      </td>

                      {/* Catatan / Keterangan Input */}
                      <td className="py-3 px-4">
                        <input
                          id={`note-input-${row.student.id}`}
                          type="text"
                          placeholder={
                            row.status === 'sakit'
                              ? 'Contoh: Surat dokter / flu demam'
                              : row.status === 'izin'
                              ? 'Contoh: Izin acara keluarga'
                              : row.status === 'alfa'
                              ? 'Contoh: Tanpa keterangan / bolos'
                              : 'Keterangan tambahan...'
                          }
                          value={row.note}
                          onChange={(e) => handleNoteChange(row.student.id, e.target.value)}
                          className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          Belum Ada Siswa di Kelas {selectedClass}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Silakan tambahkan nama siswa secara manual atau impor dari berkas Excel daftar absen (maksimal 50 siswa per kelas).
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsManualAddModalOpen(true)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-1.5 active:scale-95"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>+ Tambah Manual Nama Siswa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsImportModalOpen(true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-1.5 active:scale-95"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Impor Excel Absen (Maks. 50)</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            Progress Pengisian: <strong>{stats.filled}</strong> dari <strong>{stats.total}</strong> siswa ({stats.percentage}%)
          </div>

          <div className="flex items-center gap-3">
            <button
              id="bottom-mark-all-btn"
              onClick={handleMarkAllHadir}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors"
            >
              Hadirkan Semua
            </button>
            <button
              id="bottom-save-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Presensi Kelas {selectedClass}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Import Excel 1 Kelas (Maks. 50 Siswa) */}
      <ImportClassExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultClass={selectedClass}
        settings={settings}
        showToast={showToast}
        onImportSuccess={() => loadClassStudents()}
      />

      {/* Modal Tambah Manual Nama Siswa */}
      <ManualAddStudentModal
        isOpen={isManualAddModalOpen}
        onClose={() => setIsManualAddModalOpen(false)}
        defaultClass={selectedClass}
        settings={settings}
        showToast={showToast}
        onStudentAdded={() => loadClassStudents()}
      />

      {/* Modal Rekapitulasi Presensi Harian Otomatis */}
      <DailyRecapModal
        isOpen={isDailyRecapModalOpen}
        onClose={() => setIsDailyRecapModalOpen(false)}
        date={selectedDate}
        selectedClass={selectedClass}
        attendanceRows={attendanceRows}
        settings={settings}
        showToast={showToast}
      />
    </div>
  );
};
