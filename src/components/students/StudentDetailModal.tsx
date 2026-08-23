import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Calendar,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Phone,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Info,
  XCircle,
  Clock,
  Send,
} from 'lucide-react';
import { Student, AttendanceRecord, AppSettings, BKNote } from '../../types';
import {
  calculateStudentRecap,
  getBKNotesByStudent,
  saveBKNote,
  deleteBKNote,
} from '../../services/storageService';
import { formatIndonesianDate } from '../../utils/dateUtils';

interface StudentDetailModalProps {
  student: Student | null;
  attendanceRecords: AttendanceRecord[];
  settings: AppSettings;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  attendanceRecords,
  settings,
  onClose,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'riwayat' | 'bk-log'>('riwayat');
  const [isAddingBKNote, setIsAddingBKNote] = useState<boolean>(false);

  // New BK Note Form State
  const [newNote, setNewNote] = useState<{
    category: BKNote['category'];
    title: string;
    content: string;
    actionTaken: string;
    followUpDate: string;
  }>({
    category: 'Bimbingan Pribadi',
    title: '',
    content: '',
    actionTaken: '',
    followUpDate: '',
  });

  if (!student) return null;

  // Compute student recap
  const recap = calculateStudentRecap(student, attendanceRecords, settings.warningThresholds);

  // Student's date-by-date attendance records
  const studentHistory = useMemo(() => {
    return attendanceRecords
      .filter((r) => r.student_id === student.id)
      .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  }, [attendanceRecords, student.id]);

  // Student BK Notes
  const bkNotes = getBKNotesByStudent(student.id);

  // Submit BK Note
  const handleSaveBKNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) {
      showToast('error', 'Validasi Gagal', 'Judul dan isi catatan konseling wajib diisi.');
      return;
    }

    saveBKNote({
      student_id: student.id,
      date: new Date().toISOString().split('T')[0],
      category: newNote.category,
      title: newNote.title,
      content: newNote.content,
      actionTaken: newNote.actionTaken,
      followUpDate: newNote.followUpDate || undefined,
    });

    setIsAddingBKNote(false);
    setNewNote({
      category: 'Bimbingan Pribadi',
      title: '',
      content: '',
      actionTaken: '',
      followUpDate: '',
    });

    showToast('success', 'Catatan BK Tersimpan', 'Catatan bimbingan siswa berhasil ditambahkan.');
  };

  // Delete BK Note
  const handleDeleteNote = (noteId: string) => {
    deleteBKNote(noteId);
    showToast('info', 'Catatan BK Dihapus', 'Entri catatan konseling telah dihapus.');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header Profile Banner */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="flex items-start gap-4 z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center font-extrabold text-xl shadow-inner shrink-0">
              {student.nama.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">{student.nama}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                  Kelas {student.kelas}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  {student.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                NISN: {student.nisn} {student.nis ? `\u2022 NIS: ${student.nis}` : ''}
              </p>
              {student.no_hp_ortu && (
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>Wali: {student.nama_ortu || '-'} ({student.no_hp_ortu})</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 z-10">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cetak Riwayat Siswa"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Warning Indicator Banner if Alfa >= Warning Level */}
        {recap.warningLevel !== 'aman' && (
          <div
            className={`px-6 py-3.5 border-b text-xs flex items-center justify-between gap-3 ${
              recap.warningLevel === 'prioritas'
                ? 'bg-rose-100/90 text-rose-900 border-rose-300 font-medium animate-pulse'
                : recap.warningLevel === 'merah'
                ? 'bg-red-100 text-red-900 border-red-200 font-medium'
                : 'bg-amber-100 text-amber-900 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {recap.warningLevel === 'prioritas' ? (
                <AlertOctagon className="w-5 h-5 text-rose-700 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              )}
              <div>
                <p className="font-bold">
                  {recap.warningLevel === 'prioritas'
                    ? 'PRIORITAS TINDAK LANJUT GURU BK'
                    : recap.warningLevel === 'merah'
                    ? 'PERINGATAN MERAH (PANGGILAN ORANG TUA / SP II)'
                    : 'PERINGATAN KUNING (SURAT PEMBINAAN / SP I)'}
                </p>
                <p className="text-[11px] opacity-90">
                  Akumulasi {recap.alfa} kali Alfa melebihi batas batas toleransi kedisiplinan ({settings.warningThresholds[recap.warningLevel === 'prioritas' ? 'priority' : recap.warningLevel === 'merah' ? 'red' : 'yellow']}x).
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('bk-log');
                setIsAddingBKNote(true);
              }}
              className="shrink-0 px-3 py-1.5 bg-white text-slate-900 rounded-xl font-bold shadow-xs text-xs hover:bg-slate-50 transition-colors"
            >
              Catat Tindakan BK
            </button>
          </div>
        )}

        {/* Attendance Statistics Grid */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200/80">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Hadir */}
            <div className="p-3 bg-white rounded-xl border border-emerald-200 text-center shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Hadir (H)</span>
              <span className="text-xl font-extrabold text-emerald-600">{recap.hadir}</span>
              <span className="text-[10px] text-slate-400 block">pertemuan</span>
            </div>

            {/* Sakit */}
            <div className="p-3 bg-white rounded-xl border border-amber-200 text-center shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Sakit (S)</span>
              <span className="text-xl font-extrabold text-amber-600">{recap.sakit}</span>
              <span className="text-[10px] text-slate-400 block">hari</span>
            </div>

            {/* Izin */}
            <div className="p-3 bg-white rounded-xl border border-sky-200 text-center shadow-xs">
              <span className="text-[10px] uppercase font-bold text-sky-800 block">Izin (I)</span>
              <span className="text-xl font-extrabold text-sky-600">{recap.izin}</span>
              <span className="text-[10px] text-slate-400 block">hari</span>
            </div>

            {/* Alfa */}
            <div className="p-3 bg-white rounded-xl border border-rose-200 text-center shadow-xs">
              <span className="text-[10px] uppercase font-bold text-rose-800 block">Alfa (A)</span>
              <span className="text-xl font-extrabold text-rose-600">{recap.alfa}</span>
              <span className="text-[10px] text-slate-400 block">tanpa ket.</span>
            </div>

            {/* Persentase */}
            <div className="p-3 bg-slate-900 text-white rounded-xl text-center shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-medium text-slate-300 block">% Kehadiran</span>
              <span className="text-xl font-extrabold text-emerald-400">{recap.percentage}%</span>
              <span className="text-[10px] text-slate-400 block">{recap.totalDays} hari efektif</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('riwayat')}
              className={`py-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'riwayat'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Riwayat Absensi Harian ({studentHistory.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('bk-log')}
              className={`py-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'bk-log'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Buku Catatan & Konseling BK ({bkNotes.length})</span>
            </button>
          </div>

          {activeTab === 'bk-log' && !isAddingBKNote && (
            <button
              onClick={() => setIsAddingBKNote(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Catatan Kasus</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'riwayat' ? (
            /* Riwayat Absensi Table */
            studentHistory.length > 0 ? (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[11px] text-slate-600">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">No</th>
                      <th className="py-2.5 px-4">Tanggal Absensi</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4">Catatan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {studentHistory.map((rec, idx) => (
                      <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {formatIndonesianDate(rec.attendance_date, true)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              rec.status === 'hadir'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'sakit'
                                ? 'bg-amber-100 text-amber-800'
                                : rec.status === 'izin'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rec.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {rec.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Belum ada rekaman absensi untuk siswa ini.
              </div>
            )
          ) : (
            /* BK Notes & Counseling Log */
            <div className="space-y-4">
              {/* Form Input BK Note */}
              {isAddingBKNote && (
                <form
                  onSubmit={handleSaveBKNote}
                  className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                    <h4 className="font-bold text-emerald-950 text-sm">
                      Tambah Tindak Lanjut / Catatan Konseling BK
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingBKNote(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 mb-1 block">Kategori Tindakan</label>
                      <select
                        value={newNote.category}
                        onChange={(e) =>
                          setNewNote({ ...newNote, category: e.target.value as any })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="Bimbingan Pribadi">Bimbingan Pribadi</option>
                        <option value="Panggilan Orang Tua">Panggilan Orang Tua</option>
                        <option value="Peringatan Lisan">Peringatan Lisan</option>
                        <option value="Surat Peringatan (SP)">Surat Peringatan (SP)</option>
                        <option value="Home Visit">Home Visit (Kunjungan Rumah)</option>
                        <option value="Konferensi Kasus">Konferensi Kasus</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 mb-1 block">Rencana Tindak Lanjut (Follow-Up)</label>
                      <input
                        type="date"
                        value={newNote.followUpDate}
                        onChange={(e) =>
                          setNewNote({ ...newNote, followUpDate: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">Judul Kasus / Bimbingan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Konseling Pembinaan Kedisiplinan Kehadiran..."
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">Uraian Masalah / Temuan Konseling</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Uraikan kendala siswa, alasan sering tidak masuk, latar belakang keluarga, dll..."
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">Hasil & Kesepakatan Tindakan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Orang tua berkomitmen mengawasi jam bangun pagi dan membuat surat komitmen."
                      value={newNote.actionTaken}
                      onChange={(e) => setNewNote({ ...newNote, actionTaken: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingBKNote(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                    >
                      Simpan Catatan BK
                    </button>
                  </div>
                </form>
              )}

              {/* Notes List */}
              {bkNotes.length > 0 ? (
                bkNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white">
                          {note.category}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatIndonesianDate(note.date, false)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h5 className="font-bold text-slate-900 text-sm">{note.title}</h5>
                    <p className="text-slate-700 leading-relaxed text-xs">{note.content}</p>

                    {note.actionTaken && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                        <span className="font-bold text-slate-800">Tindakan / Solusi: </span>
                        <span className="text-slate-600">{note.actionTaken}</span>
                      </div>
                    )}

                    {note.followUpDate && (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Evaluasi Tindak Lanjut: {formatIndonesianDate(note.followUpDate, true)}</span>
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Belum ada catatan konseling untuk siswa ini.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Sistem Informasi Presensi & Konseling BK SMA Negeri 1 Nusantara
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
