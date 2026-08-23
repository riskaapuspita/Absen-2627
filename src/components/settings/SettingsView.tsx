import React, { useState } from 'react';
import {
  Settings,
  School,
  UserCheck,
  AlertTriangle,
  Database,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Download,
  Upload,
  Layers,
  CheckCircle2,
  Sparkles,
  Link,
} from 'lucide-react';
import { AppSettings } from '../../types';
import {
  saveSettings,
  resetDatabase,
  exportAllDataAsJSON,
  importAllDataFromJSON,
} from '../../services/storageService';

interface SettingsViewProps {
  settings: AppSettings;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, showToast }) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [newClassName, setNewClassName] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(
    localStorage.getItem('sia_bk_spreadsheet_url') || ''
  );
  const [supabaseUrl, setSupabaseUrl] = useState<string>(
    localStorage.getItem('sia_bk_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState<string>(
    localStorage.getItem('sia_bk_supabase_key') || ''
  );

  // Handle save core settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
    localStorage.setItem('sia_bk_spreadsheet_url', spreadsheetUrl);
    localStorage.setItem('sia_bk_supabase_url', supabaseUrl);
    localStorage.setItem('sia_bk_supabase_key', supabaseKey);

    showToast('success', 'Pengaturan Berhasil Disimpan', 'Konfigurasi sistem dan profil sekolah telah diperbarui.');
  };

  // Add Class
  const handleAddClass = () => {
    const trimmed = newClassName.trim().toUpperCase();
    if (!trimmed) return;
    if (formData.classList.includes(trimmed)) {
      showToast('warning', 'Kelas Sudah Ada', `Kelas ${trimmed} telah terdaftar.`);
      return;
    }
    setFormData({
      ...formData,
      classList: [...formData.classList, trimmed],
    });
    setNewClassName('');
  };

  // Remove Class
  const handleRemoveClass = (cls: string) => {
    if (formData.classList.length <= 1) {
      showToast('error', 'Tidak Dapat Dihapus', 'Minimal harus ada 1 rombel kelas dalam sistem.');
      return;
    }
    setFormData({
      ...formData,
      classList: formData.classList.filter((c) => c !== cls),
    });
  };

  // Reset Database to Demo
  const handleResetData = () => {
    const confirmReset = window.confirm(
      'Apakah Anda yakin ingin mengatur ulang data aplikasi ke data contoh awal? Seluruh data yang Anda buat akan digantikan dengan data contoh default.'
    );
    if (!confirmReset) return;

    resetDatabase();
    showToast('info', 'Database Direset', 'Data berhasil dikembalikan ke dataset default sekolah.');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Download Backup JSON
  const handleDownloadBackup = () => {
    const json = exportAllDataAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_SIA_BK_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Backup Diunduh', 'File cadangan JSON berhasil diunduh.');
  };

  // Import Backup JSON
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllDataFromJSON(content);
      if (success) {
        showToast('success', 'Restorasi Sukses', 'Data berhasil dipulihkan dari file backup.');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast('error', 'Restorasi Gagal', 'File backup tidak valid atau rusak.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl">
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Tahun Ajaran & Semester */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Periode Akademik</h3>
              <p className="text-xs text-slate-500">Pengaturan tahun pelajaran dan semester berjalan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Tahun Ajaran</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                placeholder="Contoh: 2025/2026"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Daftar Rombel Kelas */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Daftar Rombel Kelas</h3>
              <p className="text-xs text-slate-500">Kelola kelas yang aktif dalam presensi harian</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tambah kelas baru (e.g. X-4, XII IPS 2)..."
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddClass();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden uppercase"
              />
              <button
                type="button"
                onClick={handleAddClass}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.classList.map((cls) => (
                <div
                  key={cls}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold"
                >
                  <span>{cls}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveClass(cls)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Batas Peringatan Alfa (BK Warning Thresholds) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Batas Peringatan Alfa Guru BK</h3>
              <p className="text-xs text-slate-500">
                Ambang batas akumulasi ketidakhadiran alfa untuk memicu notifikasi peringatan bertingkat
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Kuning */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
              <span className="font-bold text-amber-900 block">Peringatan Kuning (SP I)</span>
              <p className="text-[11px] text-slate-600">
                Peringatan lisan / pembinaan awal wali kelas dan Guru BK.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={formData.warningThresholds.yellow}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warningThresholds: {
                        ...formData.warningThresholds,
                        yellow: parseInt(e.target.value, 10) || 3,
                      },
                    })
                  }
                  className="w-16 px-2.5 py-1.5 rounded-lg border border-amber-300 font-bold text-amber-900 bg-white"
                />
                <span className="text-amber-800 font-semibold">kali Alfa</span>
              </div>
            </div>

            {/* Merah */}
            <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-2">
              <span className="font-bold text-red-900 block">Peringatan Merah (SP II)</span>
              <p className="text-[11px] text-slate-600">
                Panggilan orang tua / surat peringatan resmi kedua.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.warningThresholds.red}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warningThresholds: {
                        ...formData.warningThresholds,
                        red: parseInt(e.target.value, 10) || 5,
                      },
                    })
                  }
                  className="w-16 px-2.5 py-1.5 rounded-lg border border-red-300 font-bold text-red-900 bg-white"
                />
                <span className="text-red-800 font-semibold">kali Alfa</span>
              </div>
            </div>

            {/* Prioritas BK */}
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-300 space-y-2">
              <span className="font-bold text-rose-950 block">Prioritas Tindak Lanjut</span>
              <p className="text-[11px] text-slate-600">
                Konferensi kasus, kunjungan rumah (home visit), & sidang dewan guru.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.warningThresholds.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warningThresholds: {
                        ...formData.warningThresholds,
                        priority: parseInt(e.target.value, 10) || 10,
                      },
                    })
                  }
                  className="w-16 px-2.5 py-1.5 rounded-lg border border-rose-300 font-bold text-rose-900 bg-white"
                />
                <span className="text-rose-900 font-semibold">kali Alfa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Data Profil Guru BK & Sekolah */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Profil Guru BK & Sekolah</h3>
              <p className="text-xs text-slate-500">
                Informasi ini digunakan dalam cetak laporan resmi, kop surat, dan lembar tanda tangan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Nama Guru BK</label>
              <input
                type="text"
                value={formData.teacherProfile.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    teacherProfile: { ...formData.teacherProfile, name: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">NIP Guru BK</label>
              <input
                type="text"
                value={formData.teacherProfile.nip}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    teacherProfile: { ...formData.teacherProfile, nip: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Nama Sekolah</label>
              <input
                type="text"
                value={formData.teacherProfile.schoolName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    teacherProfile: { ...formData.teacherProfile, schoolName: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={formData.teacherProfile.headmasterName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    teacherProfile: { ...formData.teacherProfile, headmasterName: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={formData.teacherProfile.headmasterNip}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    teacherProfile: { ...formData.teacherProfile, headmasterNip: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Alamat Sekolah</label>
              <input
                type="text"
                value={formData.teacherProfile.schoolAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    teacherProfile: { ...formData.teacherProfile, schoolAddress: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Integrasi Database & Google Spreadsheet */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Integrasi Database Cloud & Spreadsheet</h3>
              <p className="text-xs text-slate-500">
                Koneksikan dengan Google Spreadsheet (Google Apps Script Web App) atau Supabase untuk sinkronisasi cloud
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">
                URL Webhook Google Apps Script (Spreadsheet Sync):
              </label>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono text-slate-800"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Data absensi dan siswa tersimpan secara offline-first dan aman di browser storage, serta dapat disinkronkan ke Spreadsheet Anda.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Supabase Project URL (Opsional):</label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Supabase Anon Key (Opsional):</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            id="save-settings-btn"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Section 6: Data Backup, Restore & Reset */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Pemeliharaan & Cadangan Data</h3>
            <p className="text-xs text-slate-500">
              Unduh cadangan seluruh data sistem dalam format JSON atau pulihkan data
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Cadangan Lengkap (JSON)</span>
          </button>

          <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Pulihkan Cadangan (Restore)</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleUploadBackup}
            />
          </label>

          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset ke Data Contoh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
