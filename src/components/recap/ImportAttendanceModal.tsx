import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  UserPlus,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  Search,
} from 'lucide-react';
import { Student, AppSettings } from '../../types';
import {
  parseAttendanceFromExcel,
  downloadAttendanceMatrixTemplate,
  downloadAttendanceListTemplate,
  AttendanceImportResult,
  ParsedAttendanceItem,
} from '../../utils/attendanceImportUtils';
import { importAttendanceBulk } from '../../services/storageService';
import { formatIndonesianDate } from '../../utils/dateUtils';

interface ImportAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  settings: AppSettings;
  defaultClass?: string;
  onSuccess: (summary: { recordsCreated: number; recordsUpdated: number; studentsCreated: number }) => void;
}

export const ImportAttendanceModal: React.FC<ImportAttendanceModalProps> = ({
  isOpen,
  onClose,
  students,
  settings,
  defaultClass = 'X-1',
  onSuccess,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass === 'Semua' ? 'X-1' : defaultClass);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [autoCreateStudents, setAutoCreateStudents] = useState<boolean>(true);

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<AttendanceImportResult | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [importSummary, setImportSummary] = useState<{ recordsCreated: number; recordsUpdated: number; studentsCreated: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const monthsList = [
    { num: 1, name: 'Januari' },
    { num: 2, name: 'Februari' },
    { num: 3, name: 'Maret' },
    { num: 4, name: 'April' },
    { num: 5, name: 'Mei' },
    { num: 6, name: 'Juni' },
    { num: 7, name: 'Juli' },
    { num: 8, name: 'Agustus' },
    { num: 9, name: 'September' },
    { num: 10, name: 'Oktober' },
    { num: 11, name: 'November' },
    { num: 12, name: 'Desember' },
  ];

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);

    try {
      const result = await parseAttendanceFromExcel(selectedFile, students, {
        defaultClass: selectedClass,
        defaultMonth: selectedMonth,
        defaultYear: selectedYear,
      });
      setParseResult(result);
      setStep('preview');
    } catch (err) {
      console.error('Error parsing attendance file:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.items.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await importAttendanceBulk({
        items: parseResult.items,
        autoCreateNewStudents: autoCreateStudents,
      });

      setImportSummary(res);
      setStep('success');
      onSuccess(res);
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPreviewItems = (parseResult?.items || []).filter((item) => {
    const matchesSearch =
      item.student_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.student_nisn.includes(searchQuery) ||
      item.student_kelas.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' ? true : item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">Impor Rekap Presensi dari Excel</h2>
              <p className="text-xs text-emerald-100/90">
                Format Matrix Bulanan (1-31) & Log Harian (.xlsx, .xls, .csv)
              </p>
            </div>
          </div>
          <button
            id="close-import-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on step */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Context Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Kelas Rombel</label>
                  <select
                    id="import-target-class"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {settings.targetClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        Kelas {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bulan Presensi (Matrix)</label>
                  <select
                    id="import-target-month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {monthsList.map((m) => (
                      <option key={m.num} value={m.num}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Presensi</label>
                  <select
                    id="import-target-year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                    : 'border-slate-300 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    {isParsing ? (
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>

                  <div>
                    <p className="font-extrabold text-slate-800 text-sm sm:text-base">
                      {isParsing ? 'Membaca data Excel...' : 'Tarik & Letakkan File Excel di Sini'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      atau <span className="text-emerald-700 font-bold underline">klik untuk memilih file</span> dari komputer/HP (.xlsx, .xls, .csv)
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 text-[11px] font-semibold text-slate-700">
                    Otomatis mengenali Format Matriks 1-31 & Format Tabel Baris
                  </span>
                </div>
              </div>

              {/* Checkbox auto-register students */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <input
                  id="auto-create-students-check"
                  type="checkbox"
                  checked={autoCreateStudents}
                  onChange={(e) => setAutoCreateStudents(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="auto-create-students-check" className="text-xs text-slate-700 cursor-pointer">
                  <span className="font-bold text-emerald-950 block">
                    Otomatis Daftarkan Siswa Baru ke Database
                  </span>
                  Jika terdapat nama siswa di dalam file Excel yang belum ada di aplikasi, sistem akan langsung menambahkannya ke rombel {selectedClass}.
                </label>
              </div>

              {/* Template Download Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600" />
                    Unduh Format Template Excel Resmi:
                  </span>
                  <span className="text-[11px] text-slate-500">Pilih format yang sesuai</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    id="download-matrix-template-btn"
                    type="button"
                    onClick={() => downloadAttendanceMatrixTemplate(selectedClass, selectedMonth, selectedYear)}
                    className="p-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all group flex items-start gap-2.5"
                  >
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800 group-hover:text-emerald-900">
                        Template Matriks Bulanan (.xlsx)
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Format kolom tanggal 1 s.d. 31 (Kode H, S, I, A)
                      </p>
                    </div>
                  </button>

                  <button
                    id="download-list-template-btn"
                    type="button"
                    onClick={() => downloadAttendanceListTemplate(selectedClass)}
                    className="p-3 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition-all group flex items-start gap-2.5"
                  >
                    <div className="p-2 rounded-lg bg-teal-100 text-teal-800 group-hover:bg-teal-600 group-hover:text-white transition-colors shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800 group-hover:text-teal-900">
                        Template Log Baris Harian (.xlsx)
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Format baris per tanggal + catatan izin/sakit
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && parseResult && (
            <div className="space-y-4">
              {/* Analysis Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[11px] text-slate-500 block">Total Record Absen</span>
                  <span className="text-lg font-black text-slate-800">
                    {parseResult.stats.totalRecords.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-[11px] text-emerald-700 block">Hadir (H)</span>
                  <span className="text-lg font-black text-emerald-800">
                    {parseResult.stats.hadir}
                  </span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <span className="text-[11px] text-amber-700 block">Sakit / Izin</span>
                  <span className="text-lg font-black text-amber-800">
                    {parseResult.stats.sakit + parseResult.stats.izin}
                  </span>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                  <span className="text-[11px] text-rose-700 block">Alfa (A)</span>
                  <span className="text-lg font-black text-rose-800">
                    {parseResult.stats.alfa}
                  </span>
                </div>
              </div>

              {/* Secondary info bar */}
              <div className="p-3 bg-slate-100 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Format Terdeteksi:</span>
                  <span className="px-2 py-0.5 rounded-md bg-white font-semibold text-emerald-800 border border-slate-200">
                    {parseResult.formatDetected === 'matrix' ? 'Matriks Bulanan (Tanggal)' : 'Log Baris Harian'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold">Rentang Tanggal:</span>
                  <span className="font-mono text-slate-800">
                    {parseResult.dateRange.start} s.d. {parseResult.dateRange.end}
                  </span>
                </div>

                {parseResult.newStudentsCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                    <UserPlus className="w-3 h-3" />
                    +{parseResult.newStudentsCount} Siswa Baru Terdeteksi
                  </span>
                )}
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama atau NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-xs text-slate-500 hidden sm:inline">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                  >
                    <option value="all">Semua Status ({parseResult.items.length})</option>
                    <option value="hadir">Hadir ({parseResult.stats.hadir})</option>
                    <option value="sakit">Sakit ({parseResult.stats.sakit})</option>
                    <option value="izin">Izin ({parseResult.stats.izin})</option>
                    <option value="alfa">Alfa ({parseResult.stats.alfa})</option>
                  </select>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">Nama Siswa</th>
                      <th className="py-2 px-3">Kelas</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPreviewItems.slice(0, 100).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-600">{item.date}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {item.student_nama}
                          {item.isNewStudent && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 font-bold">
                              Baru
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{item.student_kelas}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'hadir'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'sakit'
                                ? 'bg-blue-100 text-blue-800'
                                : item.status === 'izin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 italic truncate max-w-[150px]">
                          {item.note || '-'}
                        </td>
                      </tr>
                    ))}
                    {filteredPreviewItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Tidak ada data yang cocok dengan filter pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredPreviewItems.length > 100 && (
                <p className="text-[11px] text-slate-500 text-center">
                  Menampilkan 100 dari {filteredPreviewItems.length} total baris preview.
                </p>
              )}
            </div>
          )}

          {step === 'success' && importSummary && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">Impor Rekap Berhasil Dilakukan!</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Seluruh data presensi telah diperbarui di database lokal dan tersinkronisasi ke Cloud.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Presensi Baru</span>
                  <span className="font-black text-base text-emerald-800">
                    +{importSummary.recordsCreated}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Presensi Diupdate</span>
                  <span className="font-black text-base text-teal-800">
                    {importSummary.recordsUpdated}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Siswa Baru</span>
                  <span className="font-black text-base text-blue-800">
                    +{importSummary.studentsCreated}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step === 'upload' && (
            <>
              <span className="text-xs text-slate-500">Mendukung format .xlsx, .xls, .csv</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setParseResult(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Pilih Ulang File
              </button>

              <button
                id="confirm-import-attendance-btn"
                type="button"
                disabled={isSubmitting || !parseResult || parseResult.items.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan & Impor {parseResult?.items.length} Data Absensi</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 'success' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Selesai & Lihat Rekapitulasi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
