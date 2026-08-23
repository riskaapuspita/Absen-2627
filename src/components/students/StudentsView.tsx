import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  Eye,
  FileText,
  X,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import { Student, AppSettings, Gender, StudentStatus } from '../../types';
import {
  saveStudent,
  deleteStudent,
  importStudentsBulk,
} from '../../services/storageService';
import {
  exportStudentsToExcel,
  exportStudentsToCSV,
  downloadStudentExcelTemplate,
  downloadStudentCSVTemplate,
  parseStudentsFromFile,
} from '../../utils/exportUtils';
import { triggerColorfulConfetti } from '../../utils/confetti';

interface StudentsViewProps {
  students: Student[];
  settings: AppSettings;
  onOpenStudentDetail: (student: Student) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  settings,
  onOpenStudentDetail,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [selectedGender, setSelectedGender] = useState<string>('Semua');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);

  // Student Form state
  const [formData, setFormData] = useState<{
    nisn: string;
    nis: string;
    nama: string;
    kelas: string;
    jenis_kelamin: Gender;
    status: StudentStatus;
    nama_ortu: string;
    no_hp_ortu: string;
    alamat: string;
  }>({
    nisn: '',
    nis: '',
    nama: '',
    kelas: settings.classList[0] || 'X-1',
    jenis_kelamin: 'L',
    status: 'Aktif',
    nama_ortu: '',
    no_hp_ortu: '',
    alamat: '',
  });

  // Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Array<Omit<Student, 'id' | 'created_at'>>>([]);
  const [importError, setImportError] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClass !== 'Semua' && s.kelas !== selectedClass) return false;
      if (selectedGender !== 'Semua' && s.jenis_kelamin !== selectedGender) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.nama.toLowerCase().includes(q);
        const matchNisn = s.nisn.includes(q);
        const matchNis = s.nis && s.nis.includes(q);
        if (!matchName && !matchNisn && !matchNis) return false;
      }
      return true;
    });
  }, [students, selectedClass, selectedGender, searchQuery]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingStudent(null);
    setFormData({
      nisn: `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      nis: '',
      nama: '',
      kelas: selectedClass !== 'Semua' ? selectedClass : settings.classList[0] || 'X-1',
      jenis_kelamin: 'L',
      status: 'Aktif',
      nama_ortu: '',
      no_hp_ortu: '',
      alamat: '',
    });
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nisn: student.nisn,
      nis: student.nis || '',
      nama: student.nama,
      kelas: student.kelas,
      jenis_kelamin: student.jenis_kelamin,
      status: student.status,
      nama_ortu: student.nama_ortu || '',
      no_hp_ortu: student.no_hp_ortu || '',
      alamat: student.alamat || '',
    });
    setIsFormOpen(true);
  };

  // Submit Student Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama.trim() || !formData.nisn.trim() || !formData.kelas.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama, NISN, dan Kelas wajib diisi lengkap.');
      return;
    }

    try {
      saveStudent({
        ...formData,
        id: editingStudent ? editingStudent.id : undefined,
      });

      setIsFormOpen(false);
      triggerColorfulConfetti();
      showToast(
        'success',
        editingStudent ? 'Data Siswa Diperbarui' : 'Siswa Berhasil Ditambahkan',
        `${formData.nama} (${formData.kelas}) berhasil disimpan ke database.`
      );
    } catch (err) {
      showToast('error', 'Gagal Menyimpan', 'Terjadi kesalahan sistem.');
    }
  };

  // Confirm Delete Student
  const handleDeleteStudent = () => {
    if (!deleteConfirmStudent) return;
    const name = deleteConfirmStudent.nama;
    deleteStudent(deleteConfirmStudent.id);
    setDeleteConfirmStudent(null);
    showToast('success', 'Data Siswa Dihapus', `Data ${name} berhasil dihapus dari sistem.`);
  };

  // File Upload Handler for Excel (.xlsx/.xls) or CSV
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportError('');
    setIsParsing(true);

    try {
      const parsed = await parseStudentsFromFile(file);
      setIsParsing(false);

      if (parsed.length === 0) {
        setImportError(
          'Tidak ada data siswa yang valid ditemukan dalam file. Pastikan struktur kolom sesuai template.'
        );
        setParsedPreview([]);
      } else {
        setParsedPreview(parsed);
      }
    } catch (err) {
      setIsParsing(false);
      setImportError(
        'Gagal membaca file Excel/CSV. Pastikan file tidak terkunci password atau rusak.'
      );
    }
  };

  // Execute Import
  const handleExecuteImport = () => {
    if (parsedPreview.length === 0) return;

    const count = importStudentsBulk(parsedPreview);
    setIsImportModalOpen(false);
    setSelectedFile(null);
    setParsedPreview([]);
    triggerColorfulConfetti();
    showToast(
      'success',
      'Import Siswa Berhasil',
      `Sebanyak ${count} data siswa berhasil diimpor ke sistem.`
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Kelola Data Master Siswa</h2>
              <p className="text-xs text-slate-500">
                Daftar master siswa SMA, administrasi kelas, kontak orang tua, dan ekspor/impor Excel
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Import Excel / CSV */}
            <button
              id="import-students-btn"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Import Excel / CSV</span>
            </button>

            {/* Export to Excel (.xlsx) */}
            <button
              id="export-students-excel-btn"
              onClick={() => {
                exportStudentsToExcel(filteredStudents, selectedClass);
                triggerColorfulConfetti();
                showToast(
                  'success',
                  'Ekspor Siswa Berhasil',
                  'File Excel (.xlsx) data siswa berhasil diunduh.'
                );
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            {/* Tambah Siswa */}
            <button
              id="add-student-btn"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-students-input"
              type="text"
              placeholder="Cari berdasarkan nama, NISN, atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="students-filter-class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-xs font-medium text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-hidden"
            >
              <option value="Semua">Semua Kelas</option>
              {settings.classList.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <select
              id="students-filter-gender"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="text-xs font-medium text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-hidden"
            >
              <option value="Semua">Semua JK</option>
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">NISN / NIS</th>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-3 text-center">Kelas</th>
                <th className="py-3.5 px-3 text-center">L/P</th>
                <th className="py-3.5 px-4">Kontak Orang Tua / Wali</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* No */}
                    <td className="py-3 px-4 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>

                    {/* NISN / NIS */}
                    <td className="py-3 px-4">
                      <p className="font-mono text-slate-900 font-bold">{student.nisn}</p>
                      {student.nis && (
                        <p className="text-[10px] text-slate-400 font-mono">NIS: {student.nis}</p>
                      )}
                    </td>

                    {/* Nama Siswa */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onOpenStudentDetail(student)}
                        className="font-bold text-slate-900 hover:text-emerald-700 text-left block"
                      >
                        {student.nama}
                      </button>
                      {student.alamat && (
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">
                          {student.alamat}
                        </p>
                      )}
                    </td>

                    {/* Kelas */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                        {student.kelas}
                      </span>
                    </td>

                    {/* L/P */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          student.jenis_kelamin === 'L'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-pink-50 text-pink-700 border border-pink-200'
                        }`}
                      >
                        {student.jenis_kelamin === 'L' ? 'L' : 'P'}
                      </span>
                    </td>

                    {/* Info Ortu */}
                    <td className="py-3 px-4">
                      <p className="text-xs font-semibold text-slate-800">
                        {student.nama_ortu || '-'}
                      </p>
                      {student.no_hp_ortu && (
                        <p className="text-[11px] text-emerald-600 font-medium">
                          {student.no_hp_ortu}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          student.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : student.status === 'Mutasi'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          id={`view-student-detail-btn-${student.id}`}
                          onClick={() => onOpenStudentDetail(student)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Lihat Riwayat & Kasus BK"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          id={`edit-student-btn-${student.id}`}
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Data Siswa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-student-btn-${student.id}`}
                          onClick={() => setDeleteConfirmStudent(student)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada siswa yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Student */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* NISN */}
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    NISN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    placeholder="Contoh: 0078291001"
                  />
                </div>

                {/* NIS */}
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">NIS (Opsional)</label>
                  <input
                    type="text"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    placeholder="Contoh: 24251001"
                  />
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold text-slate-900"
                  placeholder="Nama lengkap siswa..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Kelas */}
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold"
                  >
                    {settings.classList.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.jenis_kelamin}
                    onChange={(e) =>
                      setFormData({ ...formData, jenis_kelamin: e.target.value as Gender })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                {/* Status Siswa */}
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as StudentStatus })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                    <option value="Mutasi">Mutasi</option>
                    <option value="Lulus">Lulus</option>
                  </select>
                </div>
              </div>

              {/* Data Orang Tua */}
              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-800 mb-2">Informasi Wali & Kontak</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">
                      Nama Orang Tua / Wali
                    </label>
                    <input
                      type="text"
                      value={formData.nama_ortu}
                      onChange={(e) => setFormData({ ...formData, nama_ortu: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      placeholder="Nama orang tua wali"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 mb-1 block">
                      No. HP / WhatsApp Wali
                    </label>
                    <input
                      type="text"
                      value={formData.no_hp_ortu}
                      onChange={(e) => setFormData({ ...formData, no_hp_ortu: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      placeholder="0812xxxxxxxx"
                    />
                  </div>
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="font-semibold text-slate-600 mb-1 block">Alamat Domisili</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="Jl. ... RT/RW, Kelurahan"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel / CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Import Data Siswa dari Excel / CSV
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    Mendukung file .xlsx, .xls, dan .csv
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setSelectedFile(null);
                  setParsedPreview([]);
                  setImportError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Unggah berkas spreadsheet yang memuat master siswa. Gunakan format template resmi untuk hasil import yang presisi.
              </p>

              {/* Template Download Choices */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800">Unduh Format Template Siswa:</p>
                  <p className="text-slate-500 text-[11px]">
                    Berisi contoh data & petunjuk pengisian
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadStudentExcelTemplate}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Template Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadStudentCSVTemplate}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Upload Input Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-emerald-50/20 hover:bg-emerald-50/40"
              >
                <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">
                  {selectedFile ? selectedFile.name : 'Pilih File Excel (.xlsx / .xls) atau CSV'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {selectedFile
                    ? `Ukuran: ${Math.round(selectedFile.size / 1024)} KB`
                    : 'Klik atau seret file ke area ini'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Parsing Indicator */}
              {isParsing && (
                <p className="text-xs text-emerald-600 font-medium text-center animate-pulse">
                  Membaca dan memvalidasi file Excel...
                </p>
              )}

              {/* Error Message */}
              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview Table */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800">
                      Preview Data ({parsedPreview.length} siswa valid siap diimport):
                    </p>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Format Valid
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700">
                        <tr>
                          <th className="p-2 text-left">NISN</th>
                          <th className="p-2 text-left">Nama Siswa</th>
                          <th className="p-2 text-left">Kelas</th>
                          <th className="p-2 text-left">JK</th>
                          <th className="p-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreview.slice(0, 10).map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono">{p.nisn}</td>
                            <td className="p-2 font-semibold text-slate-900">{p.nama}</td>
                            <td className="p-2">{p.kelas}</td>
                            <td className="p-2">{p.jenis_kelamin}</td>
                            <td className="p-2">{p.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedPreview.length > 10 && (
                    <p className="text-[10px] text-slate-400 text-right">
                      ...dan {parsedPreview.length - 10} siswa lainnya
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setSelectedFile(null);
                    setParsedPreview([]);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedPreview.length === 0}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-40 transition-all shadow-md active:scale-95"
                >
                  Import {parsedPreview.length > 0 ? `${parsedPreview.length} Siswa` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Hapus Data Siswa</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Apakah Anda yakin ingin menghapus data siswa{' '}
              <strong>{deleteConfirmStudent.nama}</strong> (Kelas {deleteConfirmStudent.kelas},
              NISN {deleteConfirmStudent.nisn})? Seluruh riwayat presensi dan catatan BK siswa ini
              akan turut dibersihkan.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
