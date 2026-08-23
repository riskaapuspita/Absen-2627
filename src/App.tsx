/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar, ViewType } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { DailyAttendanceView } from './components/attendance/DailyAttendanceView';
import { RecapView } from './components/recap/RecapView';
import { StudentsView } from './components/students/StudentsView';
import { BKNotesView } from './components/bk/BKNotesView';
import { SettingsView } from './components/settings/SettingsView';
import { StudentDetailModal } from './components/students/StudentDetailModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import {
  initStorage,
  getStudents,
  getAttendanceRecords,
  getSettings,
  subscribeToData,
  calculateStudentRecap,
} from './services/storageService';
import { Student, AttendanceRecord, AppSettings, StudentRecap } from './types';
import { ShieldAlert, X, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function App() {
  // Initialize storage
  useEffect(() => {
    initStorage();
  }, []);

  // Data states
  const [students, setStudents] = useState<Student[]>(getStudents());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(getAttendanceRecords());
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  // UI states
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [isUrgentModalOpen, setIsUrgentModalOpen] = useState<boolean>(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, type, title, message }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Subscribe to storage changes for reactive updates across tabs/components
  useEffect(() => {
    const unsubscribe = subscribeToData(() => {
      setStudents(getStudents());
      setAttendanceRecords(getAttendanceRecords());
      setSettings(getSettings());
    });
    return unsubscribe;
  }, []);

  // Calculate urgent cases for BK (students exceeding yellow/red/priority Alfa thresholds)
  const urgentRecaps = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === 'Aktif');
    return activeStudents
      .map((s) => calculateStudentRecap(s, attendanceRecords, settings.warningThresholds))
      .filter((r) => r.warningLevel !== 'aman')
      .sort((a, b) => b.alfa - a.alfa);
  }, [students, attendanceRecords, settings.warningThresholds]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Main Layout Container */}
      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          urgentCount={urgentRecaps.length}
          totalStudents={students.filter((s) => s.status === 'Aktif').length}
        />

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
          {/* Top Application Header */}
          <Header
            settings={settings}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
            activeView={activeView}
            urgentCasesCount={urgentRecaps.length}
            onOpenUrgentModal={() => setIsUrgentModalOpen(true)}
          />

          {/* Main View Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activeView === 'dashboard' && (
              <DashboardView
                students={students}
                attendanceRecords={attendanceRecords}
                settings={settings}
                onOpenStudentDetail={(student) => setSelectedStudentForDetail(student)}
                onNavigate={(view) => setActiveView(view)}
              />
            )}

            {activeView === 'daily-attendance' && (
              <DailyAttendanceView
                students={students}
                attendanceRecords={attendanceRecords}
                settings={settings}
                onOpenStudentDetail={(student) => setSelectedStudentForDetail(student)}
                showToast={showToast}
              />
            )}

            {activeView === 'recap' && (
              <RecapView
                students={students}
                attendanceRecords={attendanceRecords}
                settings={settings}
                onOpenStudentDetail={(student) => setSelectedStudentForDetail(student)}
                showToast={showToast}
              />
            )}

            {activeView === 'students' && (
              <StudentsView
                students={students}
                settings={settings}
                onOpenStudentDetail={(student) => setSelectedStudentForDetail(student)}
                showToast={showToast}
              />
            )}

            {activeView === 'bk-notes' && (
              <BKNotesView
                students={students}
                settings={settings}
                onOpenStudentDetail={(student) => setSelectedStudentForDetail(student)}
                showToast={showToast}
              />
            )}

            {activeView === 'settings' && (
              <SettingsView settings={settings} showToast={showToast} />
            )}
          </main>
        </div>
      </div>

      {/* Student Detail & History Modal */}
      {selectedStudentForDetail && (
        <StudentDetailModal
          student={selectedStudentForDetail}
          attendanceRecords={attendanceRecords}
          settings={settings}
          onClose={() => setSelectedStudentForDetail(null)}
          showToast={showToast}
        />
      )}

      {/* Urgent BK Cases Quick Modal */}
      {isUrgentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-rose-100 bg-rose-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base">
                  Daftar Kasus Perhatian Khusus Guru BK ({urgentRecaps.length} Siswa)
                </h3>
              </div>
              <button
                onClick={() => setIsUrgentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 divide-y divide-slate-100">
              {urgentRecaps.length > 0 ? (
                urgentRecaps.map((recap) => (
                  <div
                    key={recap.student.id}
                    onClick={() => {
                      setIsUrgentModalOpen(false);
                      setSelectedStudentForDetail(recap.student);
                    }}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer rounded-xl px-2 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 hover:text-emerald-700">
                        {recap.student.nama}
                      </p>
                      <p className="text-xs text-slate-500">
                        Kelas {recap.student.kelas} &bull; NISN: {recap.student.nisn}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-rose-600">{recap.alfa}x Alfa</p>
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          recap.warningLevel === 'prioritas'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : recap.warningLevel === 'merah'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {recap.warningLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada siswa dalam daftar perhatian khusus.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Klik nama siswa untuk membuka riwayat dan konseling</span>
              <button
                onClick={() => setIsUrgentModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
