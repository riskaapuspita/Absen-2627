import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, Menu, Bell, ShieldAlert, Cloud, CloudCheck, RefreshCw, Smartphone, Laptop } from 'lucide-react';
import { formatIndonesianDate, getTodayString } from '../../utils/dateUtils';
import { AppSettings } from '../../types';
import { subscribeToSyncStatus, CloudSyncStatus } from '../../services/firebase';
import { syncAllLocalToCloud } from '../../services/storageService';

interface HeaderProps {
  settings: AppSettings;
  onToggleMobileSidebar: () => void;
  activeView: string;
  urgentCasesCount?: number;
  onOpenUrgentModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onToggleMobileSidebar,
  activeView,
  urgentCasesCount = 0,
  onOpenUrgentModal,
}) => {
  const todayFormatted = formatIndonesianDate(getTodayString(), true);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('connected');
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToSyncStatus((state) => {
      setSyncStatus(state.status);
      if (state.lastSyncedAt) {
        setLastSynced(state.lastSyncedAt);
      }
    });
    return unsub;
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await syncAllLocalToCloud();
    setTimeout(() => {
      setIsManualSyncing(false);
    }, 800);
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Dashboard & Ringkasan Presensi';
      case 'students':
        return 'Data Induk Siswa';
      case 'daily-attendance':
        return 'Pencatatan Absensi Harian';
      case 'recap':
        return 'Rekapitulasi & Laporan Kehadiran';
      case 'bk-notes':
        return 'Buku Catatan & Konseling BK';
      case 'settings':
        return 'Pengaturan Sistem & Profil';
      default:
        return 'Sistem Absensi Siswa';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs no-print">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu toggle + View title */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {getViewTitle()}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {settings.teacherProfile.schoolName} &bull; T.A. {settings.academicYear} ({settings.semester})
            </p>
          </div>
        </div>

        {/* Right Side: Cloud Sync, Date indicator, urgent alert badge, and Teacher Profile */}
        <div className="flex items-center gap-2.5">
          {/* Cloud Sync Status Badge */}
          <button
            id="cloud-sync-status-btn"
            onClick={() => setIsSyncModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              syncStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : syncStatus === 'syncing'
                ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
            title="Klik untuk melihat detail sinkronisasi cloud multi-perangkat"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : syncStatus === 'syncing'
                  ? 'bg-blue-500 animate-spin'
                  : 'bg-amber-500'
              }`}
            />
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {syncStatus === 'connected'
                ? 'Cloud Online'
                : syncStatus === 'syncing'
                ? 'Sinkronisasi...'
                : 'Offline'}
            </span>
          </button>

          {/* Urgent BK Alert Pill */}
          {urgentCasesCount > 0 && (
            <button
              id="header-urgent-alert-btn"
              onClick={onOpenUrgentModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors animate-pulse"
              title={`${urgentCasesCount} siswa membutuhkan perhatian khusus Guru BK`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Perhatian BK:</span>
              <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                {urgentCasesCount}
              </span>
            </button>
          )}

          {/* Indonesian Date Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>{todayFormatted}</span>
          </div>

          {/* User Profile avatar */}
          <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-200">
            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-emerald-500/20">
              {settings.teacherProfile.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {settings.teacherProfile.name}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">Guru Bimbingan Konseling</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Sync Details Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Sinkronisasi Cloud Multi-Perangkat</h3>
                  <p className="text-xs text-emerald-100">Database Online Firebase Firestore</p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              {/* Status banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <p className="font-bold text-emerald-900">Status: Terhubung & Real-Time</p>
                  <p className="text-[11px] text-emerald-700">
                    Input absensi di laptop, ponsel, atau tablet otomatis tersimpan dan terupdate di seluruh perangkat secara online.
                  </p>
                </div>
              </div>

              {/* Multi device illustration */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-around py-2 text-slate-600 font-bold">
                  <div className="flex flex-col items-center gap-1">
                    <Laptop className="w-6 h-6 text-emerald-600" />
                    <span className="text-[10px]">Laptop Guru</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                    &harr; Cloud Firestore &harr;
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Smartphone className="w-6 h-6 text-emerald-600" />
                    <span className="text-[10px]">HP / Tablet</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Buka tautan website aplikasi ini di perangkat mana saja, data dan rekapitulasi akan langsung sinkron secara otomatis.
                </p>
              </div>

              {/* Sync details */}
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Waktu Terakhir Sinkron:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {lastSynced ? lastSynced.toLocaleTimeString('id-ID') : 'Baru saja'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Mode Sinkronisasi:</span>
                  <span className="font-semibold text-emerald-700">Otomatis / Real-Time (Live)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Penyimpanan Offline:</span>
                  <span className="font-semibold text-slate-700">Didukung (IndexedDB + Cache)</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isManualSyncing}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>{isManualSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>

              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

