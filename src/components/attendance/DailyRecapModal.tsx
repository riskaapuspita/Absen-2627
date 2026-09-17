import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Copy,
  Check,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Calendar,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  Info,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { Student, AppSettings, AttendanceStatus, AttendanceRecord } from '../../types';
import { calculateStudentRecap } from '../../services/storageService';
import { formatIndonesianDate } from '../../utils/dateUtils';
import { exportDailyAttendanceToExcel } from '../../utils/exportUtils';
import { triggerColorfulConfetti } from '../../utils/confetti';

interface DailyAttendanceRow {
  student: Student;
  status: AttendanceStatus | null;
  note: string;
  isExisting?: boolean;
}

interface DailyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  selectedClass: string;
  attendanceRows: DailyAttendanceRow[];
  settings: AppSettings;
  students?: Student[];
  attendanceRecords?: AttendanceRecord[];
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const DailyRecapModal: React.FC<DailyRecapModalProps> = ({
  isOpen,
  onClose,
  date,
  selectedClass,
  attendanceRows,
  settings,
  students = [],
  attendanceRecords = [],
  showToast,
}) => {
  const [viewSection, setViewSection] = useState<'daily' | 'accumulation'>('daily');
  const [activeTab, setActiveTab] = useState<'all' | 'absent' | 'alfa'>('all');
  const [copiedWA, setCopiedWA] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [includeCumulativeWarnings, setIncludeCumulativeWarnings] = useState<boolean>(true);

  if (!isOpen) return null;

  // Compute daily stats
  const stats = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    let belum = 0;

    const listHadir: DailyAttendanceRow[] = [];
    const listSakit: DailyAttendanceRow[] = [];
    const listIzin: DailyAttendanceRow[] = [];
    const listAlfa: DailyAttendanceRow[] = [];

    attendanceRows.forEach((r) => {
      if (r.status === 'hadir') {
        hadir++;
        listHadir.push(r);
      } else if (r.status === 'sakit') {
        sakit++;
        listSakit.push(r);
      } else if (r.status === 'izin') {
        izin++;
        listIzin.push(r);
      } else if (r.status === 'alfa') {
        alfa++;
        listAlfa.push(r);
      } else {
        belum++;
      }
    });

    const total = attendanceRows.length;
    const totalTidakHadir = sakit + izin + alfa;
    const percentHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return {
      total,
      hadir,
      sakit,
      izin,
      alfa,
      belum,
      totalTidakHadir,
      percentHadir,
      listHadir,
      listSakit,
      listIzin,
      listAlfa,
    };
  }, [attendanceRows]);

  // Compute automatic class accumulation from all attendance records
  const classCumulativeStats = useMemo(() => {
    const classStudents = students.filter(
      (s) => s.kelas === selectedClass && s.status === 'Aktif'
    );

    const studentRecaps = classStudents.map((s) =>
      calculateStudentRecap(s, attendanceRecords, settings.warningThresholds)
    );

    const classStudentIds = new Set(classStudents.map((s) => s.id));
    const classRecords = attendanceRecords.filter((r) => classStudentIds.has(r.student_id));
    const uniqueDates = Array.from(new Set(classRecords.map((r) => r.attendance_date))).sort();

    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlfa = 0;

    studentRecaps.forEach((sr) => {
      totalHadir += sr.hadir;
      totalSakit += sr.sakit;
      totalIzin += sr.izin;
      totalAlfa += sr.alfa;
    });

    const totalAttendanceDays = uniqueDates.length;
    const totalEntries = totalHadir + totalSakit + totalIzin + totalAlfa;
    const avgPercentage =
      totalEntries > 0 ? Math.round((totalHadir / totalEntries) * 100) : 100;

    const warningStudents = studentRecaps
      .filter((sr) => sr.warningLevel !== 'aman')
      .sort((a, b) => b.alfa - a.alfa);

    return {
      totalAttendanceDays,
      uniqueDates,
      totalHadir,
      totalSakit,
      totalIzin,
      totalAlfa,
      avgPercentage,
      studentRecaps,
      warningStudents,
    };
  }, [students, selectedClass, attendanceRecords, settings.warningThresholds]);

  // Generate WhatsApp Report Text with optional cumulative warning breakdown
  const generateWhatsAppReport = () => {
    const formattedDate = formatIndonesianDate(date, true);
    const school = settings.teacherProfile?.schoolName || 'SMAN 1 LEUWILIANG by Riska Puspita';
    const teacherName = settings.teacherProfile?.name || 'Riska Puspita, S.Pd., Kons.';

    let text = `*📊 REKAPITULASI PRESENSI HARIAN SISWA*\n`;
    text += `*${school.toUpperCase()}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📅 *Hari / Tanggal:* ${formattedDate}\n`;
    text += `🏫 *Kelas / Rombel:* ${selectedClass}\n`;
    text += `👥 *Total Siswa:* ${stats.total} Orang\n\n`;
    text += `*RINGKASAN KEHADIRAN HARI INI:*\n`;
    text += `✅ Hadir: ${stats.hadir} siswa (${stats.percentHadir}%)\n`;
    text += `🤒 Sakit: ${stats.sakit} siswa\n`;
    text += `📝 Izin: ${stats.izin} siswa\n`;
    text += `❌ Alfa / Tanpa Keterangan: ${stats.alfa} siswa\n`;
    if (stats.belum > 0) {
      text += `⚠️ Belum Terdata: ${stats.belum} siswa\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;

    if (stats.listAlfa.length > 0) {
      text += `\n*DAFTAR SISWA ALFA (HARI INI):*\n`;
      stats.listAlfa.forEach((r, idx) => {
        const cumulRecap = classCumulativeStats.studentRecaps.find((sr) => sr.student.id === r.student.id);
        const cumulNote = cumulRecap ? ` [Total Akumulasi: ${cumulRecap.alfa}x Alfa]` : '';
        text += `${idx + 1}. ${r.student.nama} (NISN: ${r.student.nisn})${cumulNote}${r.note ? ` - Catatan: ${r.note}` : ''}\n`;
      });
    }

    if (stats.listSakit.length > 0) {
      text += `\n*DAFTAR SISWA SAKIT:*\n`;
      stats.listSakit.forEach((r, idx) => {
        text += `${idx + 1}. ${r.student.nama}${r.note ? ` (${r.note})` : ''}\n`;
      });
    }

    if (stats.listIzin.length > 0) {
      text += `\n*DAFTAR SISWA IZIN:*\n`;
      stats.listIzin.forEach((r, idx) => {
        text += `${idx + 1}. ${r.student.nama}${r.note ? ` (${r.note})` : ''}\n`;
      });
    }

    if (stats.totalTidakHadir === 0 && stats.total > 0) {
      text += `\n🌟 *ALHAMDULILLAH, KEHADIRAN KELAS 100% LENGKAP HARI INI!*\n`;
    }

    // Cumulative stats summary
    if (classCumulativeStats.totalAttendanceDays > 0) {
      text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `*📈 STATUS AKUMULASI KELAS (OTOMATIS):*\n`;
      text += `• Total Hari Belajar Terdata: ${classCumulativeStats.totalAttendanceDays} Hari\n`;
      text += `• Rata-rata Kehadiran Kumulatif: ${classCumulativeStats.avgPercentage}%\n`;
      text += `• Total Akumulasi Alfa Kelas: ${classCumulativeStats.totalAlfa} kali\n`;

      if (includeCumulativeWarnings && classCumulativeStats.warningStudents.length > 0) {
        text += `\n*⚠️ SISWA PERLU PERHATIAN BK (AKUMULASI ALFA):*\n`;
        classCumulativeStats.warningStudents.forEach((ws, idx) => {
          const statusLabel =
            ws.warningLevel === 'prioritas'
              ? 'Prioritas BK / Konferensi Kasus'
              : ws.warningLevel === 'merah'
              ? 'Peringatan Merah / SP 1'
              : 'Peringatan Kuning / Pembinaan';
          text += `${idx + 1}. ${ws.student.nama} (${ws.alfa}x Alfa) - ${statusLabel}\n`;
        });
      }
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Laporan otomatis Sistem Informasi Presensi & Rekapitulasi Guru BK_\n`;
    text += `_Guru BK: ${teacherName}_\n`;

    return text;
  };

  // Copy WA text to clipboard
  const handleCopyWhatsApp = async () => {
    const text = generateWhatsAppReport();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWA(true);
      showToast('success', 'Laporan Disalin ke Clipboard', 'Format pesan siap dikirim ke WhatsApp Grup / Wali Kelas.');
      setTimeout(() => setCopiedWA(false), 3000);
    } catch {
      showToast('error', 'Gagal Menyalin', 'Silakan salin teks secara manual.');
    }
  };

  // WhatsApp individual parent notice for Alfa
  const handleSendWAParent = (student: Student, note?: string) => {
    const cleanPhone = (student.no_hp_ortu || '').replace(/[^0-9]/g, '');
    const phone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const formattedDate = formatIndonesianDate(date, true);
    const schoolName = settings.teacherProfile?.schoolName || 'SMAN 1 LEUWILIANG by Riska Puspita';

    const cumulRecap = classCumulativeStats.studentRecaps.find((sr) => sr.student.id === student.id);
    const cumulText = cumulRecap && cumulRecap.alfa > 1 ? ` Sebagai catatan, ananda telah tercatat tidak hadir tanpa keterangan sebanyak ${cumulRecap.alfa} kali pada semester ini.` : '';

    const msg = `Yth. Bapak/Ibu Orang Tua/Wali dari ananda *${student.nama}* (Kelas ${selectedClass}),\n\nKami dari pihak sekolah *${schoolName}* menginformasikan bahwa pada hari ini, *${formattedDate}*, ananda tercatat *TIDAK HADIR (Tanpa Keterangan / Alfa)* di sekolah.${cumulText}\n\nMohon konfirmasi dan informasi dari Bapak/Ibu terkait ketidakhadiran ananda. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.\n\nSalam hormat,\n*Guru BK ${settings.teacherProfile?.name || 'Riska Puspita, S.Pd., Kons.'}*`;

    if (phone) {
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    } else {
      navigator.clipboard.writeText(msg);
      showToast('info', 'Format Pesan Disalin', 'Nomor HP Orang Tua belum tercatat. Pesan telah disalin ke clipboard.');
    }
  };

  // Export Daily to Excel
  const handleExportDailyExcel = () => {
    exportDailyAttendanceToExcel(attendanceRecords, students, date, selectedClass);
    triggerColorfulConfetti();
    showToast('success', 'Ekspor Excel Berhasil', `File presensi tanggal ${formatIndonesianDate(date, false)} berhasil diunduh.`);
  };

  // Filtered daily list
  const filteredList = useMemo(() => {
    let list = attendanceRows;
    if (activeTab === 'absent') {
      list = list.filter((r) => r.status === 'sakit' || r.status === 'izin' || r.status === 'alfa');
    } else if (activeTab === 'alfa') {
      list = list.filter((r) => r.status === 'alfa');
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (r) =>
          r.student.nama.toLowerCase().includes(q) ||
          r.student.nisn.includes(q) ||
          (r.student.nis && r.student.nis.includes(q))
      );
    }
    return list;
  }, [attendanceRows, activeTab, searchFilter]);

  // Filtered cumulative list
  const filteredCumulativeList = useMemo(() => {
    let list = classCumulativeStats.studentRecaps;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (sr) =>
          sr.student.nama.toLowerCase().includes(q) ||
          sr.student.nisn.includes(q) ||
          (sr.student.nis && sr.student.nis.includes(q))
      );
    }
    return list;
  }, [classCumulativeStats.studentRecaps, searchFilter]);

  // Handle Print Single Day Official Report
  const handlePrintDailyRecap = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 text-white shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Rekapitulasi Presensi & Akumulasi Otomatis
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/30 border border-emerald-300/40 text-emerald-100">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                {settings.teacherProfile?.schoolName || 'SMAN 1 LEUWILIANG by Riska Puspita'} &bull; Kelas {selectedClass} &bull; {formatIndonesianDate(date, true)}
              </p>
            </div>
          </div>
          <button
            id="close-daily-recap-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Section Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2.5 gap-3">
          <button
            type="button"
            onClick={() => setViewSection('daily')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              viewSection === 'daily'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Presensi Harian ({formatIndonesianDate(date, false)})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewSection('accumulation')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              viewSection === 'accumulation'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Akumulasi Otomatis Semester ({classCumulativeStats.totalAttendanceDays} Hari Belajar)</span>
            {classCumulativeStats.warningStudents.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-extrabold">
                {classCumulativeStats.warningStudents.length} Perlu BK
              </span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto text-xs text-slate-700">
          {viewSection === 'daily' ? (
            <>
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {/* Total Siswa */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Total Siswa</span>
                  <span className="text-xl font-extrabold text-slate-900 mt-1">{stats.total}</span>
                  <span className="text-[10px] text-slate-400">Kelas {selectedClass}</span>
                </div>

                {/* Hadir */}
                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Hadir
                  </span>
                  <span className="text-xl font-extrabold text-emerald-700 mt-1">{stats.hadir}</span>
                  <span className="text-[10px] font-semibold text-emerald-600">
                    {stats.percentHadir}% Kehadiran
                  </span>
                </div>

                {/* Sakit */}
                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Sakit (S)
                  </span>
                  <span className="text-xl font-extrabold text-amber-700 mt-1">{stats.sakit}</span>
                  <span className="text-[10px] text-amber-600">Surat/Izin Sakit</span>
                </div>

                {/* Izin */}
                <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Izin (I)
                  </span>
                  <span className="text-xl font-extrabold text-blue-700 mt-1">{stats.izin}</span>
                  <span className="text-[10px] text-blue-600">Izin Keperluan</span>
                </div>

                {/* Alfa */}
                <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Alfa (A)
                  </span>
                  <span className="text-xl font-extrabold text-rose-700 mt-1">{stats.alfa}</span>
                  <span className="text-[10px] font-bold text-rose-600">Perhatian BK</span>
                </div>

                {/* % Kehadiran */}
                <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 text-white p-3 rounded-xl shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-emerald-100">Tingkat Hadir</span>
                  <span className="text-xl font-extrabold text-white mt-1">{stats.percentHadir}%</span>
                  <span className="text-[10px] text-emerald-100">
                    {stats.percentHadir >= 90 ? 'Sangat Baik' : stats.percentHadir >= 75 ? 'Cukup' : 'Perlu Evaluasi'}
                  </span>
                </div>
              </div>

              {/* Progress Distribution Bar */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Distribusi Kehadiran Hari Ini</span>
                  <span className="font-bold text-emerald-700">{stats.percentHadir}% Hadir</span>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  {stats.hadir > 0 && (
                    <div
                      style={{ width: `${(stats.hadir / stats.total) * 100}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Hadir: ${stats.hadir}`}
                    />
                  )}
                  {stats.sakit > 0 && (
                    <div
                      style={{ width: `${(stats.sakit / stats.total) * 100}%` }}
                      className="bg-amber-500 h-full transition-all"
                      title={`Sakit: ${stats.sakit}`}
                    />
                  )}
                  {stats.izin > 0 && (
                    <div
                      style={{ width: `${(stats.izin / stats.total) * 100}%` }}
                      className="bg-blue-500 h-full transition-all"
                      title={`Izin: ${stats.izin}`}
                    />
                  )}
                  {stats.alfa > 0 && (
                    <div
                      style={{ width: `${(stats.alfa / stats.total) * 100}%` }}
                      className="bg-rose-500 h-full transition-all"
                      title={`Alfa: ${stats.alfa}`}
                    />
                  )}
                </div>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({attendanceRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('absent')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      activeTab === 'absent'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    Tidak Hadir ({stats.totalTidakHadir})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('alfa')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      activeTab === 'alfa'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    Alfa Saja ({stats.alfa})
                  </button>
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari nama atau NISN..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Table of Daily Attendance */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                      <th className="p-2.5 text-center w-12">No</th>
                      <th className="p-2.5">Nama Siswa</th>
                      <th className="p-2.5 text-center w-24">Status Hari Ini</th>
                      <th className="p-2.5">Keterangan</th>
                      <th className="p-2.5 text-center w-36">Akumulasi Total</th>
                      <th className="p-2.5 text-center w-28">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.length > 0 ? (
                      filteredList.map((row, idx) => {
                        const cumulRecap = classCumulativeStats.studentRecaps.find(
                          (sr) => sr.student.id === row.student.id
                        );

                        return (
                          <tr key={row.student.id} className="hover:bg-slate-50/70">
                            <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2.5">
                              <span className="font-bold text-slate-800">{row.student.nama}</span>
                              <span className="block text-[10px] text-slate-400 font-mono">
                                NISN: {row.student.nisn}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  row.status === 'hadir'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : row.status === 'sakit'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : row.status === 'izin'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : row.status === 'alfa'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {row.status || 'Belum'}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-600 text-[11px]">
                              {row.note || <span className="text-slate-300 italic">-</span>}
                            </td>
                            <td className="p-2.5 text-center text-[10px]">
                              {cumulRecap ? (
                                <div className="space-y-0.5">
                                  <span>
                                    <strong className="text-emerald-700">{cumulRecap.hadir}H</strong> &bull;{' '}
                                    <strong className="text-amber-700">{cumulRecap.sakit}S</strong> &bull;{' '}
                                    <strong className="text-sky-700">{cumulRecap.izin}I</strong> &bull;{' '}
                                    <strong className="text-rose-700">{cumulRecap.alfa}A</strong>
                                  </span>
                                  {cumulRecap.warningLevel !== 'aman' && (
                                    <span
                                      className={`block px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                        cumulRecap.warningLevel === 'prioritas'
                                          ? 'bg-purple-100 text-purple-800'
                                          : cumulRecap.warningLevel === 'merah'
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {cumulRecap.warningLevel} ({cumulRecap.alfa}A)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              {row.status === 'alfa' ? (
                                <button
                                  type="button"
                                  onClick={() => handleSendWAParent(row.student, row.note)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                                  title="Kirim pesan WhatsApp pemberitahuan ke Orang Tua"
                                >
                                  <Phone className="w-3 h-3 text-rose-600" />
                                  <span>Hubungi Ortu</span>
                                </button>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                          Tidak ada siswa dalam kategori ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* Accumulation Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800">Total Hari Belajar</span>
                  <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                    {classCumulativeStats.totalAttendanceDays} <span className="text-xs font-normal">Hari</span>
                  </p>
                  <span className="text-[10px] text-emerald-700">Tercatat di Sistem</span>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-3.5 rounded-xl border border-teal-200">
                  <span className="text-[11px] font-bold text-teal-800">Rata-rata Kehadiran</span>
                  <p className="text-2xl font-extrabold text-teal-900 mt-1">
                    {classCumulativeStats.avgPercentage}%
                  </p>
                  <span className="text-[10px] text-teal-700">Persentase Kumulatif</span>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 rounded-xl border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800">Akumulasi Sakit / Izin</span>
                  <p className="text-2xl font-extrabold text-amber-900 mt-1">
                    {classCumulativeStats.totalSakit + classCumulativeStats.totalIzin}{' '}
                    <span className="text-xs font-normal">Kali</span>
                  </p>
                  <span className="text-[10px] text-amber-700">
                    {classCumulativeStats.totalSakit} Sakit &bull; {classCumulativeStats.totalIzin} Izin
                  </span>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-red-50 p-3.5 rounded-xl border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-800">Total Akumulasi Alfa</span>
                  <p className="text-2xl font-extrabold text-rose-900 mt-1">
                    {classCumulativeStats.totalAlfa} <span className="text-xs font-normal">Kali</span>
                  </p>
                  <span className="text-[10px] text-rose-700">
                    {classCumulativeStats.warningStudents.length} Siswa Perlu BK
                  </span>
                </div>
              </div>

              {/* Warning Students Box */}
              {classCumulativeStats.warningStudents.length > 0 && (
                <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Perhatian Khusus Guru BK & Wali Kelas ({classCumulativeStats.warningStudents.length} Siswa)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {classCumulativeStats.warningStudents.map((ws) => (
                      <div
                        key={ws.student.id}
                        className="p-2.5 bg-white rounded-lg border border-amber-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{ws.student.nama}</p>
                          <span className="text-[10px] text-slate-500">
                            Total Alfa: <strong className="text-rose-700">{ws.alfa}x</strong> &bull; Total Hadir: {ws.hadir}x ({ws.percentage}%)
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            ws.warningLevel === 'prioritas'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : ws.warningLevel === 'merah'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {ws.warningLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cumulative Student Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                      <th className="p-2.5 text-center w-12">No</th>
                      <th className="p-2.5">Nama Siswa</th>
                      <th className="p-2.5 text-center w-16">Hadir</th>
                      <th className="p-2.5 text-center w-16">Sakit</th>
                      <th className="p-2.5 text-center w-16">Izin</th>
                      <th className="p-2.5 text-center w-16">Alfa</th>
                      <th className="p-2.5 text-center w-24">% Hadir</th>
                      <th className="p-2.5 text-center w-28">Status BK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCumulativeList.map((sr, idx) => (
                      <tr key={sr.student.id} className="hover:bg-slate-50/70">
                        <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5">
                          <span className="font-bold text-slate-800">{sr.student.nama}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            NISN: {sr.student.nisn}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-semibold text-emerald-700">{sr.hadir}</td>
                        <td className="p-2.5 text-center font-semibold text-amber-700">{sr.sakit}</td>
                        <td className="p-2.5 text-center font-semibold text-sky-700">{sr.izin}</td>
                        <td className="p-2.5 text-center font-extrabold text-rose-700">{sr.alfa}</td>
                        <td className="p-2.5 text-center font-bold text-slate-700">{sr.percentage}%</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              sr.warningLevel === 'prioritas'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : sr.warningLevel === 'merah'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : sr.warningLevel === 'kuning'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {sr.warningLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer & Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Salin Format WhatsApp */}
            <button
              type="button"
              id="copy-recap-wa-btn"
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-xs transition-all text-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              {copiedWA ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedWA ? 'Tersalin!' : 'Salin Laporan WhatsApp'}</span>
            </button>

            {/* Opsi Sertakan Akumulasi Alfa */}
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={includeCumulativeWarnings}
                onChange={(e) => setIncludeCumulativeWarnings(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Sertakan Peringatan Akumulasi Alfa</span>
            </label>

            {/* Cetak Rekap */}
            <button
              type="button"
              id="print-daily-recap-btn"
              onClick={handlePrintDailyRecap}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Laporan</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
