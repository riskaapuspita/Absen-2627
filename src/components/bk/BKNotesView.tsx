import React, { useState, useMemo } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Trash2,
  Clock,
  Printer,
  ShieldAlert,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { Student, BKNote, AppSettings } from '../../types';
import { getBKNotes, saveBKNote, deleteBKNote } from '../../services/storageService';
import { formatIndonesianDate } from '../../utils/dateUtils';

interface BKNotesViewProps {
  students: Student[];
  settings: AppSettings;
  onOpenStudentDetail: (student: Student) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const BKNotesView: React.FC<BKNotesViewProps> = ({
  students,
  settings,
  onOpenStudentDetail,
  showToast,
}) => {
  const [notes, setNotes] = useState<BKNote[]>(getBKNotes());
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [formCategory, setFormCategory] = useState<BKNote['category']>('Bimbingan Pribadi');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formAction, setFormAction] = useState<string>('');
  const [formFollowUp, setFormFollowUp] = useState<string>('');

  const refreshNotes = () => {
    setNotes(getBKNotes());
  };

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (selectedCategory !== 'Semua' && n.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const student = studentMap.get(n.student_id);
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchContent = n.content.toLowerCase().includes(q);
        const matchStudent = student && student.nama.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchStudent) return false;
      }
      return true;
    });
  }, [notes, selectedCategory, searchQuery, studentMap]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim() || !selectedStudentId) {
      showToast('error', 'Validasi Gagal', 'Lengkapi seluruh data formulir kasus BK.');
      return;
    }

    saveBKNote({
      student_id: selectedStudentId,
      date: new Date().toISOString().split('T')[0],
      category: formCategory,
      title: formTitle,
      content: formContent,
      actionTaken: formAction,
      followUpDate: formFollowUp || undefined,
    });

    setIsModalOpen(false);
    setFormTitle('');
    setFormContent('');
    setFormAction('');
    setFormFollowUp('');
    refreshNotes();

    const student = studentMap.get(selectedStudentId);
    showToast('success', 'Catatan Kasus Disimpan', `Catatan konseling untuk ${student?.nama} berhasil disimpan.`);
  };

  const handleDelete = (id: string) => {
    deleteBKNote(id);
    refreshNotes();
    showToast('info', 'Catatan Dihapus', 'Data catatan konseling berhasil dihapus.');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-emerald-600" />
              Buku Jurnal Konseling & Kasus Absensi Guru BK
            </h2>
            <p className="text-xs text-slate-500">
              Dokumentasi bimbingan pribadi, panggilan wali murid, peringatan lisan/tertulis, dan tindak lanjut
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Jurnal</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Kasus Baru</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama siswa, judul masalah, atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-medium text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-hidden"
            >
              <option value="Semua">Semua Kategori Kasus</option>
              <option value="Panggilan Orang Tua">Panggilan Orang Tua</option>
              <option value="Bimbingan Pribadi">Bimbingan Pribadi</option>
              <option value="Surat Peringatan (SP)">Surat Peringatan (SP)</option>
              <option value="Peringatan Lisan">Peringatan Lisan</option>
              <option value="Home Visit">Home Visit</option>
              <option value="Konferensi Kasus">Konferensi Kasus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => {
            const student = studentMap.get(note.student_id);
            return (
              <div
                key={note.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        note.category === 'Panggilan Orang Tua'
                          ? 'bg-rose-100 text-rose-800'
                          : note.category === 'Surat Peringatan (SP)'
                          ? 'bg-red-100 text-red-800'
                          : note.category === 'Home Visit'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {note.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatIndonesianDate(note.date, false)}
                    </span>
                  </div>

                  {student && (
                    <div
                      onClick={() => onOpenStudentDetail(student)}
                      className="cursor-pointer hover:underline text-xs font-bold text-slate-800 flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{student.nama}</span>
                      <span className="text-slate-400 font-normal">({student.kelas})</span>
                    </div>
                  )}

                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{note.title}</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">{note.content}</p>

                  {note.actionTaken && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                      <p className="font-bold text-slate-800 text-[11px]">Tindakan / Solusi:</p>
                      <p className="text-slate-600 text-[11px] mt-0.5">{note.actionTaken}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  {note.followUpDate ? (
                    <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Evaluasi: {formatIndonesianDate(note.followUpDate, false)}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Selesai</span>
                  )}

                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <BookOpenCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            Tidak ada catatan konseling pada filter yang dipilih.
          </div>
        )}
      </div>

      {/* Modal Add Note */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Catat Kasus / Konseling Baru</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Pilih Siswa</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                >
                  {students
                    .filter((s) => s.status === 'Aktif')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kelas}) - NISN: {s.nisn}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Bimbingan Pribadi">Bimbingan Pribadi</option>
                    <option value="Panggilan Orang Tua">Panggilan Orang Tua</option>
                    <option value="Peringatan Lisan">Peringatan Lisan</option>
                    <option value="Surat Peringatan (SP)">Surat Peringatan (SP)</option>
                    <option value="Home Visit">Home Visit</option>
                    <option value="Konferensi Kasus">Konferensi Kasus</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Tanggal Follow-Up</label>
                  <input
                    type="date"
                    value={formFollowUp}
                    onChange={(e) => setFormFollowUp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Judul Kasus / Bimbingan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pemanggilan Ortu terkait 5x Alfa beruntun..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Uraian Masalah & Konseling</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Deskripsikan kronologi, pengakuan siswa, atau hasil koordinasi wali kelas..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Hasil & Tindakan yang Disepakati</label>
                <input
                  type="text"
                  placeholder="Tindakan yang diambil atau surat perjanjian..."
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
