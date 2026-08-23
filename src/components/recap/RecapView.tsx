import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Layers,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Student, AttendanceRecord, AppSettings, StudentRecap } from '../../types';
import { calculateStudentRecap } from '../../services/storageService';
import { exportRecapToExcel, exportRecapToCSV } from '../../utils/exportUtils';
import { triggerColorfulConfetti } from '../../utils/confetti';
import {
  formatIndonesianDate,
  getDateRangePresets,
  INDONESIAN_MONTHS,
} from '../../utils/dateUtils';

interface RecapViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: AppSettings;
  onOpenStudentDetail: (student: Student) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const RecapView: React.FC<RecapViewProps> = ({
  students,
  attendanceRecords,
  settings,
  onOpenStudentDetail,
  showToast,
}) => {
  const [filterMode, setFilterMode] = useState<string>('month');
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [searchName, setSearchName] = useState<string>('');

  const datePresets = useMemo(() => getDateRangePresets(), []);
  const [customStartDate, setCustomStartDate] = useState<string>(datePresets.thisMonth.start);
  const [customEndDate, setCustomEndDate] = useState<string>(datePresets.thisMonth.end);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // Determine active date range based on filterMode
  const activeDateRange = useMemo(() => {
    switch (filterMode) {
      case 'today':
        return {
          start: datePresets.today.start,
          end: datePresets.today.end,
          label: `Hari Ini (${formatIndonesianDate(datePresets.today.start, false)})`,
        };
      case 'week':
        return {
          start: datePresets.thisWeek.start,
          end: datePresets.thisWeek.end,
          label: `Minggu Ini (${formatIndonesianDate(datePresets.thisWeek.start, false)} s/d ${formatIndonesianDate(datePresets.thisWeek.end, false)})`,
        };
      case 'month': {
        const year = new Date().getFullYear();
        const firstDay = new Date(year, selectedMonth, 1);
        const lastDay = new Date(year, selectedMonth + 1, 0);
        const formatD = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return {
          start: formatD(firstDay),
          end: formatD(lastDay),
          label: `Bulan ${INDONESIAN_MONTHS[selectedMonth]} ${year}`,
        };
      }
      case 'semester':
        return {
          start: datePresets.thisSemester.start,
          end: datePresets.thisSemester.end,
          label: `Semester ${settings.semester} T.A. ${settings.academicYear}`,
        };
      case 'custom':
        return {
          start: customStartDate,
          end: customEndDate,
          label: `${formatIndonesianDate(customStartDate, false)} s/d ${formatIndonesianDate(customEndDate, false)}`,
        };
      default:
        return {
          start: '',
          end: '',
          label: 'Seluruh Periode Tercatat',
        };
    }
  }, [
    filterMode,
    datePresets,
    selectedMonth,
    settings.semester,
    settings.academicYear,
    customStartDate,
    customEndDate,
  ]);

  // Compute student recaps
  const studentRecaps: StudentRecap[] = useMemo(() => {
    let filteredRecs = attendanceRecords;
    if (activeDateRange.start && activeDateRange.end) {
      filteredRecs = filteredRecs.filter(
        (r) =>
          r.attendance_date >= activeDateRange.start && r.attendance_date <= activeDateRange.end
      );
    } else if (activeDateRange.start) {
      filteredRecs = filteredRecs.filter((r) => r.attendance_date >= activeDateRange.start);
    }

    const activeStudents = students.filter((s) => {
      if (s.status !== 'Aktif') return false;
      if (selectedClass !== 'Semua' && s.kelas !== selectedClass) return false;
      if (
        searchName.trim() &&
        !s.nama.toLowerCase().includes(searchName.toLowerCase()) &&
        !s.nisn.includes(searchName)
      ) {
        return false;
      }
      return true;
    });

    return activeStudents.map((s) =>
      calculateStudentRecap(s, filteredRecs, settings.warningThresholds)
    );
  }, [
    students,
    attendanceRecords,
    activeDateRange,
    selectedClass,
    searchName,
    settings.warningThresholds,
  ]);

  // Totals calculations
  const totals = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    let totalAbsen = 0;
    let totalPerc = 0;

    studentRecaps.forEach((r) => {
      hadir += r.hadir;
      sakit += r.sakit;
      izin += r.izin;
      alfa += r.alfa;
      totalAbsen += r.totalAbsen;
      totalPerc += r.percentage;
    });

    const count = studentRecaps.length;
    const avgPercentage = count > 0 ? Math.round(totalPerc / count) : 0;

    return { hadir, sakit, izin, alfa, totalAbsen, avgPercentage, count };
  }, [studentRecaps]);

  // Handle Export to Excel (.xlsx)
  const handleExportExcel = () => {
    exportRecapToExcel(studentRecaps, settings, {
      kelas: selectedClass,
      periodLabel: activeDateRange.label,
    });
    triggerColorfulConfetti();
    showToast(
      'success',
      'Ekspor Excel Berhasil',
      'Workbook Rekapitulasi Presensi (.xlsx) lengkap telah diunduh.'
    );
  };

  // Handle Export to CSV
  const handleExportCSV = () => {
    exportRecapToCSV(studentRecaps, settings, {
      kelas: selectedClass,
      periodLabel: activeDateRange.label,
    });
    triggerColorfulConfetti();
    showToast(
      'success',
      'Ekspor CSV Berhasil',
      'File Rekapitulasi Absensi (CSV) berhasil diunduh.'
    );
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Control Panel (Hidden during print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Rekapitulasi Kehadiran Siswa
              </h2>
              <p className="text-xs text-slate-500">
                Laporan komprehensif kehadiran, persentase absensi, dan peringatan dini Guru BK
              </p>
            </div>
          </div>

          {/* Action buttons: Export Excel (.xlsx), CSV, and Print */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="export-recap-excel-btn"
              onClick={handleExportExcel}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              id="export-recap-csv-btn"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>

            <button
              id="print-recap-btn"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Preset Periode */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Pilihan Rentang Waktu:
            </label>
            <select
              id="recap-filter-mode-select"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="today">Harian (Hari Ini)</option>
              <option value="week">Mingguan (Minggu Ini)</option>
              <option value="month">Bulanan</option>
              <option value="semester">Per Semester</option>
              <option value="custom">Rentang Tanggal Khusus</option>
              <option value="all">Seluruh Riwayat</option>
            </select>
          </div>

          {/* Bulan (if mode = month) */}
          {filterMode === 'month' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Bulan:</label>
              <select
                id="recap-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {INDONESIAN_MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>
                    Bulan {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Date Range */}
          {filterMode === 'custom' && (
            <div className="sm:col-span-2 flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Dari:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Sampai:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Filter Kelas */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Filter Kelas:</label>
            <select
              id="recap-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="Semua">Semua Kelas</option>
              {settings.classList.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Pencarian Nama */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Cari Siswa / NISN:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="recap-search-name-input"
                type="text"
                placeholder="Ketik nama atau NISN..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Official Print Header (Visible ONLY during print) */}
      <div className="print-only mb-6 text-center border-b-2 border-black pb-4">
        <h1 className="text-xl font-extrabold tracking-wide uppercase">
          PEMERINTAH PROVINSI / DINAS PENDIDIKAN
        </h1>
        <h2 className="text-2xl font-bold uppercase tracking-wider">
          {settings.teacherProfile.schoolName}
        </h2>
        <p className="text-xs text-gray-700">{settings.teacherProfile.schoolAddress}</p>
        <div className="mt-3 pt-2 border-t border-gray-400">
          <h3 className="text-base font-bold underline uppercase">
            LAPORAN REKAPITULASI PRESENSI & KEHADIRAN SISWA
          </h3>
          <p className="text-xs">
            Tahun Ajaran: {settings.academicYear} | Semester: {settings.semester} | Kelas:{' '}
            {selectedClass}
          </p>
          <p className="text-xs">Periode: {activeDateRange.label}</p>
        </div>
      </div>

      {/* Summary Stat Cards (Screen View) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        {/* Total Siswa */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Siswa</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totals.count}</span>
          <span className="text-[10px] text-slate-400">Siswa terfilter</span>
        </div>

        {/* Hadir */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 block">Hadir (H)</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{totals.hadir}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Kehadiran fisik</span>
        </div>

        {/* Sakit */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 block">Sakit (S)</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{totals.sakit}</span>
          <span className="text-[10px] text-amber-600 font-medium">Ket. Medis/Dokter</span>
        </div>

        {/* Izin */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50/50 border border-sky-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-sky-800 block">Izin (I)</span>
          <span className="text-2xl font-black text-sky-700 mt-1 block">{totals.izin}</span>
          <span className="text-[10px] text-sky-600 font-medium">Izin resmi ortu</span>
        </div>

        {/* Alfa */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50/50 border border-rose-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-rose-800 block">Alfa (A)</span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{totals.alfa}</span>
          <span className="text-[10px] text-rose-600 font-medium">Tanpa keterangan</span>
        </div>

        {/* Rata-rata Kehadiran */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md">
          <span className="text-[11px] font-medium text-slate-300 block">Rata-rata Presensi</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {totals.avgPercentage}%
          </span>
          <span className="text-[10px] text-slate-400">Tingkat kehadiran</span>
        </div>
      </div>

      {/* Recapitulation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border-0 print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse print-table">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-3 text-center">NISN</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-3 text-center bg-emerald-100/60 text-emerald-900">Hadir</th>
                <th className="py-3 px-3 text-center bg-amber-100/60 text-amber-900">Sakit</th>
                <th className="py-3 px-3 text-center bg-sky-100/60 text-sky-900">Izin</th>
                <th className="py-3 px-3 text-center bg-rose-100/60 text-rose-900">Alfa</th>
                <th className="py-3 px-3 text-center font-extrabold bg-slate-200/50">Total Absen</th>
                <th className="py-3 px-3 text-center font-extrabold">% Kehadiran</th>
                <th className="py-3 px-4 text-center no-print">Status Peringatan BK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {studentRecaps.length > 0 ? (
                studentRecaps.map((recap, idx) => {
                  let warningBadge = null;
                  if (recap.warningLevel === 'prioritas') {
                    warningBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse inline-flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3 text-rose-600" />
                        Prioritas BK
                      </span>
                    );
                  } else if (recap.warningLevel === 'merah') {
                    warningBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        Peringatan Merah
                      </span>
                    );
                  } else if (recap.warningLevel === 'kuning') {
                    warningBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Peringatan Kuning
                      </span>
                    );
                  } else {
                    warningBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Tertib
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={recap.student.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        recap.warningLevel === 'prioritas'
                          ? 'bg-rose-50/30 font-medium'
                          : recap.warningLevel === 'merah'
                          ? 'bg-red-50/20'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => onOpenStudentDetail(recap.student)}
                          className="hover:text-emerald-700 text-left"
                        >
                          {recap.student.nama}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                        {recap.student.nisn}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {recap.student.kelas}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/30">
                        {recap.hadir}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-amber-700 bg-amber-50/30">
                        {recap.sakit}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-sky-700 bg-sky-50/30">
                        {recap.izin}
                      </td>
                      <td
                        className={`py-3 px-3 text-center font-bold ${
                          recap.alfa > 0 ? 'text-rose-700 bg-rose-50/50' : 'text-slate-400'
                        }`}
                      >
                        {recap.alfa}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800 bg-slate-50/50">
                        {recap.totalAbsen}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-black ${
                            recap.percentage >= 90
                              ? 'text-emerald-700'
                              : recap.percentage >= 75
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {recap.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center no-print">{warningBadge}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Tidak ada data rekapitulasi untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={4} className="py-3.5 px-4 text-right uppercase">
                  Jumlah / Rata-rata:
                </td>
                <td className="py-3.5 px-3 text-center text-emerald-800">{totals.hadir}</td>
                <td className="py-3.5 px-3 text-center text-amber-800">{totals.sakit}</td>
                <td className="py-3.5 px-3 text-center text-sky-800">{totals.izin}</td>
                <td className="py-3.5 px-3 text-center text-rose-800">{totals.alfa}</td>
                <td className="py-3.5 px-3 text-center text-slate-900">{totals.totalAbsen}</td>
                <td className="py-3.5 px-3 text-center text-emerald-800 font-black">
                  {totals.avgPercentage}%
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Official Signature Section (Visible in Print Only) */}
      <div className="print-only mt-12 print-break-inside-avoid">
        <div className="grid grid-cols-2 text-center text-xs">
          <div>
            <p>Mengetahui,</p>
            <p className="font-semibold">Kepala {settings.teacherProfile.schoolName}</p>
            <div className="h-20"></div>
            <p className="font-bold underline uppercase">{settings.teacherProfile.headmasterName}</p>
            <p>NIP. {settings.teacherProfile.headmasterNip}</p>
          </div>
          <div>
            <p>Jakarta, {formatIndonesianDate(new Date(), false)}</p>
            <p className="font-semibold">Guru Bimbingan Konseling (BK)</p>
            <div className="h-20"></div>
            <p className="font-bold underline uppercase">{settings.teacherProfile.name}</p>
            <p>NIP. {settings.teacherProfile.nip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
