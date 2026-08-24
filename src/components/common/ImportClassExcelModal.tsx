import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
  Users,
  Info,
} from 'lucide-react';
import { Student, AppSettings } from '../../types';
import {
  downloadClassAttendanceExcelTemplate,
  parseClassAttendanceExcel,
  ClassExcelParseResult,
} from '../../utils/exportUtils';
import { importStudentsBulk, getStudents, saveStudent } from '../../services/storageService';
import { triggerColorfulConfetti } from '../../utils/confetti';

interface ImportClassExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClass: string;
  settings: AppSettings;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onImportSuccess?: (count: number, className: string) => void;
}

export const ImportClassExcelModal: React.FC<ImportClassExcelModalProps> = ({
  isOpen,
  onClose,
  defaultClass,
  settings,
  showToast,
  onImportSuccess,
}) => {
  const [targetClass, setTargetClass] = useState<string>(defaultClass || settings.classList[0] || 'X-1');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ClassExcelParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage('');
    setIsParsing(true);

    try {
      const result = await parseClassAttendanceExcel(file, targetClass);
      setIsParsing(false);

      if (result.students.length === 0) {
        setErrorMessage(
          'Tidak ditemukan data nama siswa yang valid dalam file Excel/CSV. Pastikan kolom "Nama Siswa" terisi dengan benar.'
        );
        setParseResult(null);
      } else {
        setParseResult(result);
      }
    } catch (err) {
      setIsParsing(false);
      setErrorMessage(
        'Gagal memproses file Excel. Pastikan file berformat .xlsx, .xls, atau .csv dan tidak rusak.'
      );
      setParseResult(null);
    }
  };

  const handleClassChange = async (newClass: string) => {
    setTargetClass(newClass);
    if (selectedFile) {
      setIsParsing(true);
      try {
        const result = await parseClassAttendanceExcel(selectedFile, newClass);
        setIsParsing(false);
        setParseResult(result);
      } catch {
        setIsParsing(false);
      }
    }
  };

  const handleExecuteImport = () => {
    if (!parseResult || parseResult.students.length === 0) return;

    try {
      const studentsToImport = parseResult.students.map((s) => ({
        ...s,
        kelas: targetClass,
      }));

      if (importMode === 'replace') {
        // Find existing students in target class and update or remove them
        const allExisting = getStudents();
        const otherStudents = allExisting.filter((s) => s.kelas !== targetClass);
        localStorage.setItem('sia_bk_students', JSON.stringify(otherStudents));
      }

      const count = importStudentsBulk(studentsToImport);
      triggerColorfulConfetti();
      showToast(
        'success',
        'Impor Data Absen Berhasil',
        `Sebanyak ${count} siswa berhasil diimpor ke Kelas ${targetClass} (Maks. 50 siswa per kelas).`
      );

      if (onImportSuccess) {
        onImportSuccess(count, targetClass);
      }
      onClose();
    } catch (err) {
      showToast('error', 'Gagal Mengimpor Data', 'Terjadi kesalahan sistem saat menyimpan ke database.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 text-white shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                Impor Data Excel Absen Siswa 1 Kelas
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                SMAN 1 LEUWILIANG &bull; Kapasitas Maksimal 50 Siswa per Kelas
              </p>
            </div>
          </div>
          <button
            id="close-import-class-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700">
          {/* Target Class Selection & Download Template */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Target Rombel / Kelas Tujuan:
              </label>
              <select
                id="target-import-class-select"
                value={targetClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {settings.classList.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Semua siswa dalam file akan dimasukkan ke rombel ini.
              </p>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Format Template Excel (.xlsx):
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Format resmi daftar absen 1 kelas (maks 50 siswa)
                </p>
              </div>
              <button
                type="button"
                id="download-class-template-btn"
                onClick={() => downloadClassAttendanceExcelTemplate(targetClass)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Template Kelas {targetClass}</span>
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div
            id="import-class-file-dropzone"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-emerald-50/25 hover:bg-emerald-50/50 group"
          >
            <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-bold text-slate-800 text-sm">
              {selectedFile ? selectedFile.name : 'Pilih / Seret Berkas Excel (.xlsx, .xls) atau CSV'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {selectedFile
                ? `Ukuran: ${Math.round(selectedFile.size / 1024)} KB`
                : 'Mendukung kolom No, Nama Siswa, NISN/NIS, dan L/P (Maks. 50 Siswa)'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Parsing State */}
          {isParsing && (
            <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold animate-pulse py-2">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Membaca dan memvalidasi data siswa kelas...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Limit Notification / Warning */}
          {parseResult && (
            <div className="space-y-3">
              {parseResult.isExceededLimit ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs">
                      Peringatan Batas Maksimal: Terdeteksi {parseResult.totalFound} Siswa
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Sesuai ketentuan, kapasitas rombel dibatasi <strong>maksimal 50 siswa</strong> per kelas.
                      Sistem hanya akan mengimpor <strong>50 siswa pertama</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">
                      {parseResult.students.length} Siswa Terdeteksi untuk Kelas {targetClass}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800">
                    Memenuhi Batas (Maks 50)
                  </span>
                </div>
              )}

              {/* Import Options (Merge vs Replace) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-700">Metode Penggabungan:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Gabungkan / Update yang Ada</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Ganti Daftar Siswa Kelas {targetClass}</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-1.5">
                <p className="font-bold text-slate-800 text-xs">
                  Pratinjau Data Siswa ({parseResult.students.length} dari maks. 50 siswa):
                </p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700">
                      <tr>
                        <th className="p-2 w-10 text-center">No</th>
                        <th className="p-2">Nama Siswa</th>
                        <th className="p-2">NISN</th>
                        <th className="p-2">NIS</th>
                        <th className="p-2 text-center">L/P</th>
                        <th className="p-2">Kelas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.students.map((st, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900">{st.nama}</td>
                          <td className="p-2 font-mono text-slate-500">{st.nisn}</td>
                          <td className="p-2 font-mono text-slate-500">{st.nis || '-'}</td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                st.jenis_kelamin === 'L'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-pink-50 text-pink-700'
                              }`}
                            >
                              {st.jenis_kelamin}
                            </span>
                          </td>
                          <td className="p-2 font-semibold text-emerald-700">{targetClass}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Tips: Gunakan NISN unik untuk sinkronisasi riwayat absensi.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              id="confirm-import-class-btn"
              disabled={!parseResult || parseResult.students.length === 0}
              onClick={handleExecuteImport}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all text-xs disabled:opacity-40 active:scale-95 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                Impor {parseResult ? `${parseResult.students.length} Siswa` : ''} ke Kelas {targetClass}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
