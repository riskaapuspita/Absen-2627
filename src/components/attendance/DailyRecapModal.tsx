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
} from 'lucide-react';
import { Student, AppSettings, AttendanceStatus } from '../../types';
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
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const DailyRecapModal: React.FC<DailyRecapModalProps> = ({
  isOpen,
  onClose,
  date,
  selectedClass,
  attendanceRows,
  settings,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'absent' | 'alfa'>('all');
  const [copiedWA, setCopiedWA] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  if (!isOpen) return null;

  // Compute stats
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

  // Generate WhatsApp Report Text
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
    text += `*RINGKASAN KEHADIRAN:*\n`;
    text += `✅ Hadir: ${stats.hadir} siswa (${stats.percentHadir}%)\n`;
    text += `🤒 Sakit: ${stats.sakit} siswa\n`;
    text += `📝 Izin: ${stats.izin} siswa\n`;
    text += `❌ Alfa / Tanpa Keterangan: ${stats.alfa} siswa\n`;
    if (stats.belum > 0) {
      text += `⚠️ Belum Terdata: ${stats.belum} siswa\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;

    if (stats.listAlfa.length > 0) {
      text += `\n*DAFTAR SISWA ALFA (TANPA KETERANGAN):*\n`;
      stats.listAlfa.forEach((r, idx) => {
        text += `${idx + 1}. ${r.student.nama} (NISN: ${r.student.nisn})${r.note ? ` - Catatan: ${r.note}` : ''}\n`;
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

    const msg = `Yth. Bapak/Ibu Orang Tua/Wali dari ananda *${student.nama}* (Kelas ${selectedClass}),\n\nKami dari pihak sekolah *${schoolName}* menginformasikan bahwa pada hari ini, *${formattedDate}*, ananda tercatat *TIDAK HADIR (Tanpa Keterangan / Alfa)* di sekolah.\n\nMohon konfirmasi dan informasi dari Bapak/Ibu terkait ketidakhadiran ananda. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.\n\nSalam hormat,\n*Guru BK ${settings.teacherProfile?.name || 'Riska Puspita, S.Pd., Kons.'}*`;

    if (phone) {
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    } else {
      navigator.clipboard.writeText(msg);
      showToast('info', 'Format Pesan Disalin', 'Nomor HP Orang Tua belum tercatat. Pesan telah disalin ke clipboard.');
    }
  };

  // Filtered list
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
                  Rekapitulasi Presensi Harian Selesai
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/30 border border-emerald-300/40 text-emerald-100">
                  Otomatis
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
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto text-xs text-slate-700">
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

          {/* Attention Box for Alfa / Non-attending */}
          {stats.alfa > 0 ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold text-xs">
                    Perhatian Guru BK: Terdapat {stats.alfa} Siswa Alfa (Tanpa Keterangan)
                  </span>
                </div>
                <span className="text-[10px] font-semibold bg-rose-200/80 px-2 py-0.5 rounded-md text-rose-800">
                  Tindak Lanjut Cepat
                </span>
              </div>
              <p className="text-[11px] text-rose-800">
                Klik tombol WhatsApp pada tabel di bawah untuk mengirimkan notifikasi resmi kepada orang tua siswa.
              </p>
            </div>
          ) : stats.totalTidakHadir === 0 && stats.total > 0 ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-xs">
                  Apresiasi: Seluruh Siswa ({stats.total} Siswa) Hadir Lengkap 100%!
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Sempurna
              </span>
            </div>
          ) : null}

          {/* Navigation Tabs & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Siswa ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('absent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'absent'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Tidak Hadir ({stats.totalTidakHadir})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('alfa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'alfa'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                Khusus Alfa ({stats.alfa})
              </button>
            </div>

            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden w-48"
            />
          </div>

          {/* Student Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700">
                <tr>
                  <th className="p-2 w-10 text-center">No</th>
                  <th className="p-2">Nama Siswa</th>
                  <th className="p-2 text-center">L/P</th>
                  <th className="p-2 text-center">Status</th>
                  <th className="p-2">Keterangan / Alasan</th>
                  <th className="p-2 text-right">Aksi BK / Ortu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length > 0 ? (
                  filteredList.map((row, idx) => {
                    const st = row.status;
                    let badgeClass = 'bg-slate-100 text-slate-600';
                    let label = 'Belum Diisi';

                    if (st === 'hadir') {
                      badgeClass = 'bg-emerald-100 text-emerald-800';
                      label = 'Hadir';
                    } else if (st === 'sakit') {
                      badgeClass = 'bg-amber-100 text-amber-800';
                      label = 'Sakit';
                    } else if (st === 'izin') {
                      badgeClass = 'bg-blue-100 text-blue-800';
                      label = 'Izin';
                    } else if (st === 'alfa') {
                      badgeClass = 'bg-rose-100 text-rose-800 font-bold';
                      label = 'Alfa';
                    }

                    return (
                      <tr key={row.student.id} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2">
                          <p className="font-bold text-slate-900">{row.student.nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono">NISN: {row.student.nisn}</p>
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.student.jenis_kelamin === 'L'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-pink-50 text-pink-700'
                            }`}
                          >
                            {row.student.jenis_kelamin}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${badgeClass}`}>
                            {label}
                          </span>
                        </td>
                        <td className="p-2 text-slate-600">
                          {row.note ? row.note : <span className="text-slate-300 italic">-</span>}
                        </td>
                        <td className="p-2 text-right">
                          {st === 'alfa' ? (
                            <button
                              type="button"
                              onClick={() => handleSendWAParent(row.student, row.note)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 shadow-2xs active:scale-95"
                              title="Kirim notifikasi Alfa ke WhatsApp Orang Tua"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Hubungi Ortu</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Tercatat</span>
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
        </div>

        {/* Modal Footer & Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Salin Format WhatsApp */}
            <button
              type="button"
              id="copy-recap-wa-btn"
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-xs transition-all text-xs flex items-center gap-1.5 active:scale-95"
            >
              {copiedWA ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedWA ? 'Tersalin!' : 'Salin Laporan WhatsApp'}</span>
            </button>

            {/* Cetak Rekap */}
            <button
              type="button"
              id="print-daily-recap-btn"
              onClick={handlePrintDailyRecap}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition-colors text-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Rekap Harian</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
