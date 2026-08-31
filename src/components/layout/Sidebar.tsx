import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileSpreadsheet,
  Settings,
  BookOpenCheck,
  GraduationCap,
  Sparkles,
  X,
} from 'lucide-react';

export type ViewType = 'dashboard' | 'students' | 'daily-attendance' | 'recap' | 'bk-notes' | 'settings';

interface SidebarProps {
  activeView: ViewType;
  onSelectView: (view: ViewType) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  urgentCount: number;
  totalStudents: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isMobileOpen,
  onCloseMobile,
  urgentCount,
  totalStudents,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ViewType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'daily-attendance' as ViewType,
      label: 'Absensi Harian',
      icon: CalendarCheck,
      badge: 'Input',
    },
    {
      id: 'recap' as ViewType,
      label: 'Rekapitulasi',
      icon: FileSpreadsheet,
      badge: undefined,
    },
    {
      id: 'students' as ViewType,
      label: 'Data Siswa',
      icon: Users,
      badge: totalStudents > 0 ? String(totalStudents) : undefined,
    },
    {
      id: 'bk-notes' as ViewType,
      label: 'Catatan & Kasus BK',
      icon: BookOpenCheck,
      badge: urgentCount > 0 ? `${urgentCount} Kasus` : undefined,
      badgeColor: urgentCount > 0 ? 'bg-rose-500 text-white' : undefined,
    },
    {
      id: 'settings' as ViewType,
      label: 'Pengaturan',
      icon: Settings,
      badge: undefined,
    },
  ];

  const handleItemClick = (id: ViewType) => {
    onSelectView(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 truncate">
                SMAN 1 LEUWILIANG
              </h2>
              <p className="text-[10px] text-emerald-400 font-semibold truncate">by Riska Puspita &bull; BK</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick BK Status Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Database Cloud</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Online Multi-Device
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Data absensi & rekapitulasi tersinkronisasi otomatis di semua HP dan Laptop secara online.
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      item.badgeColor
                        ? item.badgeColor
                        : isActive
                        ? 'bg-emerald-700 text-emerald-100'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span className="text-[11px]">SIA-BK Versi 2.4</span>
            <span className="text-[10px] text-slate-400">Guru BK Portal</span>
          </div>
        </div>
      </aside>
    </>
  );
};
