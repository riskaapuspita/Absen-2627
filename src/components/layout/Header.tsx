import React from 'react';
import { Calendar, UserCheck, Menu, Bell, ShieldAlert } from 'lucide-react';
import { formatIndonesianDate, getTodayString } from '../../utils/dateUtils';
import { AppSettings } from '../../types';

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

        {/* Right Side: Date indicator, urgent alert badge, and Teacher Profile */}
        <div className="flex items-center gap-3">
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
    </header>
  );
};
