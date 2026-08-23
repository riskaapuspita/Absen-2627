import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Percent,
  TrendingUp,
  Filter,
  Calendar,
  ChevronRight,
  AlertOctagon,
  Eye,
  ArrowUpRight,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { Student, AttendanceRecord, AppSettings, StudentRecap } from '../../types';
import { calculateStudentRecap } from '../../services/storageService';
import {
  formatIndonesianDate,
  formatShortDate,
  getTodayString,
  INDONESIAN_MONTHS,
} from '../../utils/dateUtils';

interface DashboardViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: AppSettings;
  onOpenStudentDetail: (student: Student) => void;
  onNavigate: (view: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  attendanceRecords,
  settings,
  onOpenStudentDetail,
  onNavigate,
}) => {
  // Filters state
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [selectedMonth, setSelectedMonth] = useState<string>('Semua');
  const [selectedSemester, setSelectedSemester] = useState<string>(settings.semester);

  // Active students based on class filter
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status !== 'Aktif') return false;
      if (selectedClass !== 'Semua' && s.kelas !== selectedClass) return false;
      return true;
    });
  }, [students, selectedClass]);

  // Today's attendance records (filtered by class & date)
  const dateRecords = useMemo(() => {
    const studentIds = new Set(filteredStudents.map((s) => s.id));
    return attendanceRecords.filter(
      (r) => r.attendance_date === selectedDate && studentIds.has(r.student_id)
    );
  }, [attendanceRecords, selectedDate, filteredStudents]);

  // Today's counts
  const todayStats = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;

    dateRecords.forEach((r) => {
      if (r.status === 'hadir') hadir++;
      else if (r.status === 'sakit') sakit++;
      else if (r.status === 'izin') izin++;
      else if (r.status === 'alfa') alfa++;
    });

    const totalRecorded = hadir + sakit + izin + alfa;
    const totalStudentsInFilter = filteredStudents.length;
    const percentage =
      totalRecorded > 0 ? Math.round((hadir / totalRecorded) * 100) : 0;

    return {
      totalStudents: totalStudentsInFilter,
      totalRecorded,
      hadir,
      sakit,
      izin,
      alfa,
      percentage,
    };
  }, [dateRecords, filteredStudents]);

  // Full recaps for BK monitoring lists (sorted by Alfa and Total Absent)
  const studentRecaps: StudentRecap[] = useMemo(() => {
    let records = attendanceRecords;
    if (selectedMonth !== 'Semua') {
      const mIndex = parseInt(selectedMonth, 10);
      records = records.filter((r) => {
        const d = new Date(r.attendance_date);
        return d.getMonth() === mIndex;
      });
    }

    return filteredStudents.map((s) =>
      calculateStudentRecap(s, records, settings.warningThresholds)
    );
  }, [filteredStudents, attendanceRecords, selectedMonth, settings.warningThresholds]);

  // Top Alfa Students
  const topAlfaStudents = useMemo(() => {
    return [...studentRecaps]
      .filter((r) => r.alfa > 0)
      .sort((a, b) => b.alfa - a.alfa || b.totalAbsen - a.totalAbsen)
      .slice(0, 5);
  }, [studentRecaps]);

  // Top Total Absent Students (Sakit + Izin + Alfa)
  const topAbsentStudents = useMemo(() => {
    return [...studentRecaps]
      .filter((r) => r.totalAbsen > 0)
      .sort((a, b) => b.totalAbsen - a.totalAbsen || b.alfa - a.alfa)
      .slice(0, 5);
  }, [studentRecaps]);

  // 14-day trend data for chart
  const trendData = useMemo(() => {
    const allDates = Array.from(new Set<string>(attendanceRecords.map((r) => r.attendance_date)))
      .sort()
      .slice(-14);

    const studentIds = new Set(filteredStudents.map((s) => s.id));

    return allDates.map((date) => {
      const dayRecords = attendanceRecords.filter(
        (r) => r.attendance_date === date && studentIds.has(r.student_id)
      );

      let h = 0,
        s = 0,
        i = 0,
        a = 0;
      dayRecords.forEach((r) => {
        if (r.status === 'hadir') h++;
        else if (r.status === 'sakit') s++;
        else if (r.status === 'izin') i++;
        else if (r.status === 'alfa') a++;
      });

      const total = h + s + i + a;
      const rate = total > 0 ? Math.round((h / total) * 100) : 0;

      return {
        date,
        displayDate: formatShortDate(date),
        hadir: h,
        sakit: s,
        izin: i,
        alfa: a,
        tingkatKehadiran: rate,
      };
    });
  }, [attendanceRecords, filteredStudents]);

  // Pie chart data for status distribution
  const pieData = [
    { name: 'Hadir', value: todayStats.hadir, color: '#10b981' },
    { name: 'Sakit', value: todayStats.sakit, color: '#f59e0b' },
    { name: 'Izin', value: todayStats.izin, color: '#0ea5e9' },
    { name: 'Alfa', value: todayStats.alfa, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Per-class attendance distribution for bar chart
  const classBreakdownData = useMemo(() => {
    return settings.classList.map((cls) => {
      const clsStudents = students.filter((s) => s.kelas === cls && s.status === 'Aktif');
      const clsStudentIds = new Set(clsStudents.map((s) => s.id));
      const clsRecords = attendanceRecords.filter(
        (r) => r.attendance_date === selectedDate && clsStudentIds.has(r.student_id)
      );

      let h = 0,
        s = 0,
        i = 0,
        a = 0;
      clsRecords.forEach((r) => {
        if (r.status === 'hadir') h++;
        else if (r.status === 'sakit') s++;
        else if (r.status === 'izin') i++;
        else if (r.status === 'alfa') a++;
      });

      return {
        kelas: cls,
        hadir: h,
        sakit: s,
        izin: i,
        alfa: a,
        total: clsStudents.length,
      };
    });
  }, [settings.classList, students, attendanceRecords, selectedDate]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Filter Analisis Presensi</h2>
              <p className="text-xs text-slate-500">Sesuaikan tanggal, kelas, dan periode rekapitulasi</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <input
                id="filter-dashboard-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-hidden cursor-pointer"
              />
            </div>

            {/* Class filter */}
            <select
              id="filter-dashboard-class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
            >
              <option value="Semua">Semua Kelas</option>
              {settings.classList.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>

            {/* Month filter */}
            <select
              id="filter-dashboard-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
            >
              <option value="Semua">Semua Bulan</option>
              {INDONESIAN_MONTHS.map((m, idx) => (
                <option key={m} value={idx.toString()}>
                  Bulan {m}
                </option>
              ))}
            </select>

            {/* Semester filter */}
            <select
              id="filter-dashboard-semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as any)}
              className="text-xs font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>
        </div>
      </div>

      {/* Colorful Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Siswa */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Total Siswa</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {todayStats.totalStudents}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {selectedClass === 'Semua' ? 'Seluruh rombel' : selectedClass}
          </p>
        </div>

        {/* Hadir (Vibrant Emerald) */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 p-4 rounded-2xl border border-emerald-300/80 shadow-xs relative overflow-hidden group hover:shadow-emerald-500/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-emerald-800">Hadir</span>
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
            {todayStats.hadir}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-1 font-bold">
            <span>
              {todayStats.totalRecorded > 0
                ? Math.round((todayStats.hadir / todayStats.totalRecorded) * 100)
                : 0}
              %
            </span>
            <span className="text-emerald-600 font-normal">dari diabsen</span>
          </div>
        </div>

        {/* Sakit (Warm Amber) */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 p-4 rounded-2xl border border-amber-300/80 shadow-xs relative overflow-hidden group hover:shadow-amber-500/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-amber-800">Sakit</span>
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
            {todayStats.sakit}
          </p>
          <p className="text-[11px] text-amber-700 mt-1 font-medium">Surat/Ket. Medis</p>
        </div>

        {/* Izin (Sky Blue) */}
        <div className="bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-cyan-500/10 p-4 rounded-2xl border border-sky-300/80 shadow-xs relative overflow-hidden group hover:shadow-sky-500/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-sky-800">Izin</span>
            <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
              <Info className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-sky-700 tracking-tight">
            {todayStats.izin}
          </p>
          <p className="text-[11px] text-sky-700 mt-1 font-medium">Izin Resmi Ortu</p>
        </div>

        {/* Alfa (Vibrant Crimson) */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-red-500/10 p-4 rounded-2xl border border-rose-300/80 shadow-xs relative overflow-hidden group hover:shadow-rose-500/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-rose-800">Alfa</span>
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
            {todayStats.alfa}
          </p>
          <p className="text-[11px] text-rose-700 mt-1 font-medium">Tanpa Keterangan</p>
        </div>

        {/* Persentase Kehadiran */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">% Kehadiran</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
            {todayStats.percentage}%
          </p>
          <p className="text-[11px] text-slate-300 mt-1">
            {todayStats.totalRecorded}/{todayStats.totalStudents} Diabsen
          </p>
        </div>
      </div>

      {/* Quick Action CTA Banner if attendance not yet filled */}
      {todayStats.totalRecorded === 0 && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xs">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Presensi Belum Diinput untuk Tanggal {formatIndonesianDate(selectedDate, true)}
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Catat kehadiran siswa hari ini untuk memperbarui statistik dan rekapitulasi BK secara otomatis.
              </p>
            </div>
          </div>
          <button
            id="cta-input-attendance-btn"
            onClick={() => onNavigate('daily-attendance')}
            className="shrink-0 px-5 py-2.5 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-md hover:bg-emerald-50 transition-all flex items-center gap-2 active:scale-95"
          >
            <span>Mulai Absensi Sekarang</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Grafik Tren Kehadiran Siswa (14 Hari Terakhir)
                </h3>
                <p className="text-xs text-slate-500">
                  Memantau fluktuasi Hadir, Sakit, Izin, dan Alfa secara berkelanjutan
                </p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAlfa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                            <p className="font-bold border-b border-slate-700 pb-1">
                              {formatIndonesianDate(data.date, true)}
                            </p>
                            <p className="text-emerald-400">Hadir: {data.hadir} siswa</p>
                            <p className="text-amber-400">Sakit: {data.sakit} siswa</p>
                            <p className="text-sky-400">Izin: {data.izin} siswa</p>
                            <p className="text-rose-400 font-semibold">Alfa: {data.alfa} siswa</p>
                            <p className="text-slate-300 pt-1 border-t border-slate-800">
                              Tingkat Kehadiran: {data.tingkatKehadiran}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hadir"
                    name="Hadir"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHadir)"
                  />
                  <Area
                    type="monotone"
                    dataKey="alfa"
                    name="Alfa"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAlfa)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada data riwayat absensi
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie / Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Komposisi Presensi Hari Ini</h3>
            </div>
            <p className="text-xs text-slate-500 pl-8">
              {formatIndonesianDate(selectedDate, false)}
            </p>
          </div>

          <div className="h-56 w-full my-2">
            {todayStats.totalRecorded > 0 && pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} Siswa`, `${name}`]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 text-center p-4">
                <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                <span>Belum ada data tersimpan pada tanggal ini</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-100">
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-slate-500 text-[10px]">Tercatat</span>
              <p className="font-bold text-slate-800">
                {todayStats.totalRecorded} / {todayStats.totalStudents}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
              <span className="text-rose-700 text-[10px] font-semibold">Total Alfa</span>
              <p className="font-bold text-rose-700">{todayStats.alfa} Siswa</p>
            </div>
          </div>
        </div>
      </div>

      {/* BK Attention & Early Warning Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Siswa dengan Alfa Terbanyak (BK Warning Thresholds) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Siswa dengan Akumulasi Alfa Terbanyak
                </h3>
                <p className="text-xs text-slate-500">
                  Deteksi dini siswa dengan potensi drop-out atau pelanggaran disiplin
                </p>
              </div>
            </div>
            <button
              id="view-all-recap-alfa-btn"
              onClick={() => onNavigate('recap')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Lihat Rekap
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topAlfaStudents.length > 0 ? (
              topAlfaStudents.map((recap) => {
                let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                let badgeLabel = 'Aman';

                if (recap.warningLevel === 'prioritas') {
                  badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
                  badgeLabel = 'Prioritas Tindak Lanjut BK';
                } else if (recap.warningLevel === 'merah') {
                  badgeStyle = 'bg-red-100 text-red-700 border-red-200';
                  badgeLabel = 'Peringatan Merah (SP II / Panggilan Ortu)';
                } else if (recap.warningLevel === 'kuning') {
                  badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200';
                  badgeLabel = 'Peringatan Kuning (SP I)';
                }

                return (
                  <div
                    key={recap.student.id}
                    onClick={() => onOpenStudentDetail(recap.student)}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200">
                        {recap.student.jenis_kelamin}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-snug hover:text-emerald-700">
                          {recap.student.nama}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Kelas {recap.student.kelas}</span>
                          <span>&bull;</span>
                          <span>NISN: {recap.student.nisn}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-base font-black text-rose-600">
                          {recap.alfa}x Alfa
                        </span>
                      </div>
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-bold mt-1 ${badgeStyle}`}
                      >
                        {badgeLabel}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Tidak ada siswa dengan catatan alfa pada periode ini. Kondisi tertib!
              </div>
            )}
          </div>
        </div>

        {/* Siswa dengan Total Ketidakhadiran Terbanyak (Sakit + Izin + Alfa) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Siswa dengan Ketidakhadiran Tertinggi (S + I + A)
                </h3>
                <p className="text-xs text-slate-500">
                  Total akumulasi hari tidak hadir yang memerlukan pemantauan akademik
                </p>
              </div>
            </div>
            <button
              id="view-all-recap-absent-btn"
              onClick={() => onNavigate('recap')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Lihat Rekap
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topAbsentStudents.length > 0 ? (
              topAbsentStudents.map((recap) => {
                return (
                  <div
                    key={recap.student.id}
                    onClick={() => onOpenStudentDetail(recap.student)}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 font-black text-xs flex items-center justify-center border border-amber-200">
                        {recap.percentage}%
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-snug hover:text-emerald-700">
                          {recap.student.nama}
                        </p>
                        <p className="text-xs text-slate-500">Kelas {recap.student.kelas}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800">
                        {recap.totalAbsen} Hari Absen
                      </p>
                      <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span className="text-amber-600 font-semibold">{recap.sakit}S</span>
                        <span>&bull;</span>
                        <span className="text-sky-600 font-semibold">{recap.izin}I</span>
                        <span>&bull;</span>
                        <span className="text-rose-600 font-black">{recap.alfa}A</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Seluruh siswa memiliki tingkat kehadiran 100% pada periode ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart Breakdown Per Class */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Perbandingan Kehadiran Per Rombel Kelas
              </h3>
              <p className="text-xs text-slate-500">
                Distribusi status absensi tanggal {formatIndonesianDate(selectedDate, false)} antar kelas
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={classBreakdownData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="kelas" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="hadir" name="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sakit" name="Sakit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="izin" name="Izin" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="alfa" name="Alfa" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
