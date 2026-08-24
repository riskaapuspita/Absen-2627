import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  X,
  Check,
  Sparkles,
  ClipboardList,
  User,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Student, AppSettings, Gender, StudentStatus } from '../../types';
import { saveStudent, importStudentsBulk } from '../../services/storageService';
import { triggerColorfulConfetti } from '../../utils/confetti';

interface ManualAddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClass?: string;
  settings: AppSettings;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onStudentAdded?: (newStudent: Student) => void;
}

export const ManualAddStudentModal: React.FC<ManualAddStudentModalProps> = ({
  isOpen,
  onClose,
  defaultClass,
  settings,
  showToast,
  onStudentAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');

  // Single Student State
  const [singleForm, setSingleForm] = useState<{
    nama: string;
    kelas: string;
    jenis_kelamin: Gender;
    nisn: string;
    nis: string;
    status: StudentStatus;
    nama_ortu: string;
    no_hp_ortu: string;
    alamat: string;
  }>({
    nama: '',
    kelas: defaultClass || settings.classList[0] || 'X-1',
    jenis_kelamin: 'L',
    nisn: `008${Math.floor(1000000 + Math.random() * 9000000)}`,
    nis: '',
    status: 'Aktif',
    nama_ortu: '',
    no_hp_ortu: '',
    alamat: '',
  });

  // Batch Multi-Name Paste State
  const [batchClass, setBatchClass] = useState<string>(
    defaultClass || settings.classList[0] || 'X-1'
  );
  const [batchNamesText, setBatchNamesText] = useState<string>('');
  const [batchDefaultGender, setBatchDefaultGender] = useState<Gender>('L');

  if (!isOpen) return null;

  // Single Student Submission
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!singleForm.nama.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama siswa wajib diisi.');
      return;
    }

    try {
      const newStudent = saveStudent({
        nama: singleForm.nama.trim(),
        kelas: singleForm.kelas,
        jenis_kelamin: singleForm.jenis_kelamin,
        nisn: singleForm.nisn.trim() || `008${Math.floor(1000000 + Math.random() * 9000000)}`,
        nis: singleForm.nis.trim() || undefined,
        status: singleForm.status,
        nama_ortu: singleForm.nama_ortu.trim() || undefined,
        no_hp_ortu: singleForm.no_hp_ortu.trim() || undefined,
        alamat: singleForm.alamat.trim() || undefined,
      });

      triggerColorfulConfetti();
      showToast(
        'success',
        'Siswa Berhasil Ditambahkan',
        `${newStudent.nama} (${newStudent.kelas}) berhasil ditambahkan secara manual.`
      );

      if (onStudentAdded) {
        onStudentAdded(newStudent);
      }

      // Reset form
      setSingleForm({
        nama: '',
        kelas: singleForm.kelas,
        jenis_kelamin: 'L',
        nisn: `008${Math.floor(1000000 + Math.random() * 9000000)}`,
        nis: '',
        status: 'Aktif',
        nama_ortu: '',
        no_hp_ortu: '',
        alamat: '',
      });

      onClose();
    } catch (err) {
      showToast('error', 'Gagal Menambah Siswa', 'Terjadi kesalahan sistem.');
    }
  };

  // Parse batch names from textarea
  const parsedBatchNames = batchNamesText
    .split('\n')
    .map((line) => {
      // Remove leading numbers, dots, dashes: "1. Ahmad" -> "Ahmad"
      return line.replace(/^\d+[\.\)\-\s]+/, '').trim();
    })
    .filter((name) => name.length >= 2);

  const batchCount = parsedBatchNames.length;
  const isBatchOverLimit = batchCount > 50;
  const finalBatchNames = parsedBatchNames.slice(0, 50);

  // Batch Submit
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (finalBatchNames.length === 0) {
      showToast('error', 'Validasi Gagal', 'Silakan ketik atau tempel setidaknya satu nama siswa.');
      return;
    }

    try {
      const studentsToInsert = finalBatchNames.map((name, idx) => ({
        nama: name,
        kelas: batchClass,
        jenis_kelamin: batchDefaultGender,
        nisn: `008${Math.floor(1000000 + idx * 1000 + Math.random() * 999)}`,
        status: 'Aktif' as StudentStatus,
      }));

      const count = importStudentsBulk(studentsToInsert);
      triggerColorfulConfetti();
      showToast(
        'success',
        'Tambah Banyak Siswa Berhasil',
        `Sebanyak ${count} siswa berhasil ditambahkan ke Kelas ${batchClass}.`
      );

      setBatchNamesText('');
      onClose();
    } catch (err) {
      showToast('error', 'Gagal Menambahkan Siswa', 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 text-white shadow-inner">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Tambah Manual Nama Siswa
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                SMAN 1 LEUWILIANG by Riska Puspita
              </p>
            </div>
          </div>
          <button
            id="close-manual-add-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switching */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-5 pt-3 gap-2">
          <button
            type="button"
            id="tab-single-student"
            onClick={() => setActiveTab('single')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'single'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Tambah 1 Siswa</span>
          </button>

          <button
            type="button"
            id="tab-batch-students"
            onClick={() => setActiveTab('batch')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'batch'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Ketik / Tempel Banyak Nama Sekaligus</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700">
          {activeTab === 'single' ? (
            /* Tab 1: Single Student */
            <form id="single-student-form" onSubmit={handleSingleSubmit} className="space-y-4">
              {/* Nama Siswa (Primary) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  id="manual-student-name-input"
                  type="text"
                  required
                  autoFocus
                  value={singleForm.nama}
                  onChange={(e) => setSingleForm({ ...singleForm, nama: e.target.value })}
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Kelas & Jenis Kelamin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Kelas / Rombel <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="manual-student-class-select"
                    value={singleForm.kelas}
                    onChange={(e) => setSingleForm({ ...singleForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {settings.classList.map((cls) => (
                      <option key={cls} value={cls}>
                        Kelas {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleForm({ ...singleForm, jenis_kelamin: 'L' })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        singleForm.jenis_kelamin === 'L'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>L (Laki-laki)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleForm({ ...singleForm, jenis_kelamin: 'P' })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        singleForm.jenis_kelamin === 'P'
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>P (Perempuan)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* NISN & NIS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      NISN (10 Digit)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSingleForm({
                          ...singleForm,
                          nisn: `008${Math.floor(1000000 + Math.random() * 9000000)}`,
                        })
                      }
                      className="text-[10px] text-emerald-600 hover:underline font-semibold"
                    >
                      Generate Acak
                    </button>
                  </div>
                  <input
                    type="text"
                    value={singleForm.nisn}
                    onChange={(e) => setSingleForm({ ...singleForm, nisn: e.target.value })}
                    placeholder="008xxxxxxx"
                    className="w-full px-3 py-2 text-xs font-mono text-slate-800 bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    NIS Sekolah (Opsional)
                  </label>
                  <input
                    type="text"
                    value={singleForm.nis}
                    onChange={(e) => setSingleForm({ ...singleForm, nis: e.target.value })}
                    placeholder="2425xxxx"
                    className="w-full px-3 py-2 text-xs font-mono text-slate-800 bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Kontak Orang Tua (Opsional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={singleForm.nama_ortu}
                    onChange={(e) => setSingleForm({ ...singleForm, nama_ortu: e.target.value })}
                    placeholder="Nama bapak/ibu"
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    No. HP / WhatsApp Orang Tua
                  </label>
                  <input
                    type="text"
                    value={singleForm.no_hp_ortu}
                    onChange={(e) => setSingleForm({ ...singleForm, no_hp_ortu: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-manual-single-student-btn"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all text-xs active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Nama Siswa</span>
                </button>
              </div>
            </form>
          ) : (
            /* Tab 2: Batch Multi-Name Paste */
            <form id="batch-student-form" onSubmit={handleBatchSubmit} className="space-y-4">
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1">
                <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Tempel atau Ketik Daftar Nama Siswa Sekaligus</span>
                </p>
                <p className="text-[11px] text-emerald-800">
                  Tulis 1 nama per baris (maksimal 50 siswa). Nomor urut (misal: 1., 2.) akan dibersihkan secara otomatis.
                </p>
              </div>

              {/* Class & Default Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Pilih Kelas Tujuan:
                  </label>
                  <select
                    id="batch-target-class-select"
                    value={batchClass}
                    onChange={(e) => setBatchClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {settings.classList.map((cls) => (
                      <option key={cls} value={cls}>
                        Kelas {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Jenis Kelamin Bawaan:
                  </label>
                  <select
                    value={batchDefaultGender}
                    onChange={(e) => setBatchDefaultGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              {/* Textarea for names */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Daftar Nama Siswa (1 Nama per Baris):
                  </label>
                  <span
                    className={`text-[11px] font-bold ${
                      isBatchOverLimit ? 'text-amber-600' : 'text-slate-500'
                    }`}
                  >
                    {batchCount} / Maks. 50 Siswa
                  </span>
                </div>
                <textarea
                  id="batch-names-textarea"
                  rows={6}
                  value={batchNamesText}
                  onChange={(e) => setBatchNamesText(e.target.value)}
                  placeholder={`Contoh:\n1. Aditia Pratama\n2. Aisyah Putri Azzahra\n3. Alif Kurniawan\n4. Anisa Rahmawati\n5. Bagas Sanjaya`}
                  className="w-full p-3 text-xs font-mono bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Exceed Limit Notice */}
              {isBatchOverLimit && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Perhatian: Terdapat {batchCount} nama. Sesuai batas kapasitas maksimal 50 siswa per kelas, hanya 50 siswa pertama yang akan disimpan.
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="submit-manual-batch-students-btn"
                  disabled={finalBatchNames.length === 0}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all text-xs disabled:opacity-40 active:scale-95 flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  <span>
                    Simpan {finalBatchNames.length > 0 ? `${finalBatchNames.length} Siswa` : ''} ke Kelas {batchClass}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
