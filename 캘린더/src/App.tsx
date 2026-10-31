/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CalendarNav } from './components/CalendarNav';
import { CalendarGrid } from './components/CalendarGrid';
import { EventDetailModal } from './components/EventDetailModal';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { EventFormModal } from './components/EventFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CalendarQnaBot } from './components/CalendarQnaBot';
import { TodayNoticeBanner } from './components/TodayNoticeBanner';
import { NoticeEditModal } from './components/NoticeEditModal';
import { NoticeBoardView } from './components/NoticeBoardView';
import { CalendarEvent, DayCell, DailyNotice, GradeType } from './types/calendar';
import { generateMonthGrid, formatDateString } from './utils/dateUtils';
import { api, authStorage } from './services/api';
import { Info, AlertCircle, RefreshCw, CheckCircle2, CalendarOff } from 'lucide-react';

export default function App() {
  // Today's reference date
  const today = useMemo(() => new Date(), []);

  // Currently viewed year & month (0-indexed month)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));

  // Active top-level Tab: 'calendar' | 'notices'
  const [activeTab, setActiveTab] = useState<'calendar' | 'notices'>('calendar');

  // Registered calendar events
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected date cell for detail popup
  const [selectedCell, setSelectedCell] = useState<DayCell | null>(null);

  // Teacher Authentication state
  const [teacherToken, setTeacherToken] = useState<string | null>(() => authStorage.getToken());
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Event Form Modal state (Create / Edit)
  const [formModalState, setFormModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialDate?: string;
    event?: CalendarEvent | null;
  }>({
    isOpen: false,
    mode: 'create',
  });

  // Delete Confirm Modal state
  const [deleteEventTarget, setDeleteEventTarget] = useState<CalendarEvent | null>(null);

  // Daily Notices state
  const [notices, setNotices] = useState<DailyNotice[]>([]);
  const [noticeModalState, setNoticeModalState] = useState<{
    isOpen: boolean;
    notice?: DailyNotice | null;
    defaultGrade?: GradeType;
  }>({
    isOpen: false,
  });

  // Feedback Toast state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Fetch events and notices from server
  const loadNotices = useCallback(async () => {
    try {
      const data = await api.getNotices();
      setNotices(data);
    } catch (err) {
      console.error('Failed to load notices', err);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err: any) {
      setLoadError(err.message || '일정 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load & Auth verification on mount
  useEffect(() => {
    loadEvents();
    loadNotices();

    const storedToken = authStorage.getToken();
    if (storedToken) {
      api.checkAuthStatus(storedToken).then((isValid) => {
        if (isValid) {
          setIsTeacherAuthenticated(true);
          setTeacherToken(storedToken);
        } else {
          authStorage.clearSession();
          setIsTeacherAuthenticated(false);
          setTeacherToken(null);
        }
      });
    }
  }, [loadEvents]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Generate 7-column calendar grid for current view
  const cells = useMemo(() => {
    return generateMonthGrid(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      events,
      today
    );
  }, [currentDate, events, today]);

  // Keep selected cell updated when events change
  useEffect(() => {
    if (selectedCell) {
      const updated = cells.find((c) => c.dateString === selectedCell.dateString);
      if (updated) {
        setSelectedCell(updated);
      }
    }
  }, [cells, selectedCell]);

  // Teacher login success
  const handleTeacherAuthSuccess = (token: string) => {
    setTeacherToken(token);
    setIsTeacherAuthenticated(true);
    showToast('교사 일정 및 알림장 관리 권한이 인증되었습니다.', 'success');
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Teacher logout
  const handleTeacherLogout = async () => {
    if (teacherToken) {
      await api.logoutTeacher(teacherToken);
    }
    setTeacherToken(null);
    setIsTeacherAuthenticated(false);
    showToast('교사 편집 모드가 종료되었습니다.', 'success');
  };

  // Open Create Event Modal
  const handleOpenCreateEvent = (dateString?: string) => {
    setFormModalState({
      isOpen: true,
      mode: 'create',
      initialDate: dateString || new Date().toISOString().split('T')[0],
      event: null,
    });
  };

  // Open Edit Event Modal
  const handleOpenEditEvent = (event: CalendarEvent) => {
    setFormModalState({
      isOpen: true,
      mode: 'edit',
      initialDate: event.date,
      event,
    });
  };

  // Save Event (Create or Update)
  const handleFormSubmit = async (
    eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!teacherToken) {
      setShowAuthModal(true);
      throw new Error('교사 권한 인증이 만료되었습니다. 다시 로그인해주세요.');
    }

    if (formModalState.mode === 'create') {
      const created = await api.createEvent(eventData, teacherToken);
      setEvents((prev) => [...prev, created]);
      showToast('새 일정이 등록되었습니다.', 'success');
    } else if (formModalState.mode === 'edit' && formModalState.event) {
      const updated = await api.updateEvent(formModalState.event.id, eventData, teacherToken);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      showToast('일정이 수정되었습니다.', 'success');
    }
  };

  // Delete Event
  const handleDeleteConfirm = async (id: string) => {
    if (!teacherToken) {
      setShowAuthModal(true);
      throw new Error('교사 권한 인증이 만료되었습니다.');
    }

    await api.deleteEvent(id, teacherToken);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast('일정이 삭제되었습니다.', 'success');
  };

  // Daily Notice Handlers
  const handleOpenCreateNotice = (defaultGrade?: GradeType) => {
    if (!teacherToken) {
      setPendingAction(() => () => {
        setNoticeModalState({
          isOpen: true,
          notice: null,
          defaultGrade: defaultGrade || '3',
        });
      });
      setShowAuthModal(true);
      return;
    }
    setNoticeModalState({
      isOpen: true,
      notice: null,
      defaultGrade: defaultGrade || '3',
    });
  };

  const handleOpenEditNotice = (notice: DailyNotice) => {
    if (!teacherToken) {
      setPendingAction(() => () => {
        setNoticeModalState({
          isOpen: true,
          notice,
          defaultGrade: notice.grade,
        });
      });
      setShowAuthModal(true);
      return;
    }
    setNoticeModalState({
      isOpen: true,
      notice,
      defaultGrade: notice.grade,
    });
  };

  const handleSaveNotice = async (noticeData: {
    id?: string;
    date: string;
    grade: GradeType;
    title: string;
    items: string[];
    supplies?: string;
    author?: string;
  }) => {
    if (!teacherToken) {
      setShowAuthModal(true);
      throw new Error('교사 권한 인증이 필요합니다.');
    }

    const saved = await api.saveNotice(noticeData, teacherToken);
    setNotices((prev) => {
      const idx = prev.findIndex((n) => n.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    showToast('알림장이 성공적으로 저장되었습니다.', 'success');
  };

  const handleDeleteNotice = async (id: string) => {
    if (!teacherToken) {
      setShowAuthModal(true);
      return;
    }
    try {
      await api.deleteNotice(id, teacherToken);
      setNotices((prev) => prev.filter((n) => n.id !== id));
      showToast('알림장이 삭제되었습니다.', 'success');
    } catch (err: any) {
      showToast(err.message || '알림장 삭제 실패', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-60 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-800 text-white border-emerald-700'
                : 'bg-rose-800 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-300" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 1. Header with View Tabs, Legend, and Teacher Controls */}
      <Header
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isTeacherAuthenticated={isTeacherAuthenticated}
        onOpenTeacherAuth={() => setShowAuthModal(true)}
        onOpenCreateEvent={() => handleOpenCreateEvent()}
        onOpenCreateNotice={() => handleOpenCreateNotice()}
        onLogoutTeacher={handleTeacherLogout}
      />

      {/* Main Calendar Container - Fills screen height gracefully on desktop */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 lg:p-6 flex flex-col">
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-stone-200/90 overflow-hidden">
          {activeTab === 'notices' ? (
            /* Dedicated Notice Board Tab View */
            <NoticeBoardView
              todayStr={formatDateString(today)}
              notices={notices}
              isTeacherAuthenticated={isTeacherAuthenticated}
              onOpenCreateNotice={handleOpenCreateNotice}
              onOpenEditNotice={handleOpenEditNotice}
              onDeleteNotice={handleDeleteNotice}
            />
          ) : (
            /* Monthly Calendar Tab View */
            <>
              {/* Top Bar: Month Navigation Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200">
                <div className="flex-1">
                  <CalendarNav
                    currentDate={currentDate}
                    today={today}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onToday={handleGoToToday}
                  />
                </div>
              </div>

              {/* Teacher Mode Alert Banner */}
              {isTeacherAuthenticated && (
                <div className="bg-amber-50 px-4 py-2 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span>교사 편집 모드: 일정 및 오늘 알림장을 직접 추가, 수정, 삭제할 수 있습니다.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateNotice()}
                      className="font-bold text-amber-800 hover:text-amber-900 underline cursor-pointer"
                    >
                      + 알림장 작성
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCreateEvent()}
                      className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                    >
                      + 새 일정 등록
                    </button>
                  </div>
                </div>
              )}

              {/* Today's School Notice Board (오늘 알림장) - Placed at the top of the calendar */}
              <TodayNoticeBanner
                today={today}
                notices={notices}
                isTeacherAuthenticated={isTeacherAuthenticated}
                onOpenCreateNotice={handleOpenCreateNotice}
                onOpenEditNotice={handleOpenEditNotice}
                onDeleteNotice={handleDeleteNotice}
              />

              {/* 2. Interactive Month Grid or Status states (Plan.md Section 2, 3, 4) */}
              <div className="flex-1 flex flex-col overflow-x-auto relative min-h-[500px]">
                {isLoading ? (
                  /* Loading State */
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-stone-500">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
                    <p className="text-sm font-semibold text-stone-700">3·4학년 학사일정을 불러오는 중입니다...</p>
                  </div>
                ) : loadError ? (
                  /* Error State */
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-stone-800">일정을 불러오지 못했습니다</h3>
                    <p className="mt-1 text-xs text-stone-500 max-w-sm">{loadError}</p>
                    <button
                      type="button"
                      onClick={loadEvents}
                      className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : events.length === 0 ? (
                  /* Completely Empty State */
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <CalendarOff className="w-10 h-10 text-stone-300 mb-3" />
                    <h3 className="text-base font-bold text-stone-700">등록된 학사 일정이 없습니다</h3>
                    <p className="mt-1 text-xs text-stone-500">교사 일정 관리를 통해 새로운 학사 일정을 등록할 수 있습니다.</p>
                  </div>
                ) : (
                  /* Active Calendar Grid */
                  <CalendarGrid
                    cells={cells}
                    isTeacherAuthenticated={isTeacherAuthenticated}
                    onSelectDate={(cell) => setSelectedCell(cell)}
                    onAddEventToDate={(dateStr) => handleOpenCreateEvent(dateStr)}
                  />
                )}
              </div>

              {/* Bottom Info Bar */}
              <div className="bg-stone-50 px-4 py-2.5 border-t border-stone-200 text-xs text-stone-500 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    달력의 날짜를 누르면 해당 날짜의 시작 시간, 장소, 설명 등 상세 일정을 확인할 수 있습니다.
                  </span>
                </div>
                <div className="text-stone-400 text-[11px]">
                  서버 보관 공유 캘린더 · 교사 공용 비밀번호 검증 적용
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* 3. Event Detail Popup Modal (Plan.md Section 3 & 4) */}
      <EventDetailModal
        selectedCell={selectedCell}
        isTeacherAuthenticated={isTeacherAuthenticated}
        onClose={() => setSelectedCell(null)}
        onEditEvent={(event) => handleOpenEditEvent(event)}
        onDeleteEvent={(event) => setDeleteEventTarget(event)}
        onAddEventToDate={(dateStr) => handleOpenCreateEvent(dateStr)}
      />

      {/* 4. Teacher Authentication Modal (Plan.md Section 11) */}
      <TeacherAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleTeacherAuthSuccess}
      />

      {/* 5. Create / Edit Event Form Modal (Plan.md Section 4 & 5) */}
      <EventFormModal
        isOpen={formModalState.isOpen}
        mode={formModalState.mode}
        initialDate={formModalState.initialDate}
        initialEvent={formModalState.event}
        onClose={() => setFormModalState((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleFormSubmit}
      />

      {/* 6. Delete Confirmation Modal (Plan.md Section 4) */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteEventTarget)}
        event={deleteEventTarget}
        onClose={() => setDeleteEventTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* 7. Teacher Notice Edit Modal */}
      <NoticeEditModal
        isOpen={noticeModalState.isOpen}
        initialNotice={noticeModalState.notice}
        defaultGrade={noticeModalState.defaultGrade}
        todayDateStr={formatDateString(today)}
        onClose={() => setNoticeModalState((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleSaveNotice}
      />

      {/* 8. Gemini AI Q&A Assistant Bot */}
      <CalendarQnaBot />
    </div>
  );
}
