import React, { useEffect, useRef } from 'react';
import { DayCell, CalendarEvent, GradeType } from '../types/calendar';
import { formatFullKoreanDate } from '../utils/dateUtils';
import { X, Clock, MapPin, FileText, UserCheck, CalendarOff, Edit3, Trash2, Plus } from 'lucide-react';

interface EventDetailModalProps {
  selectedCell: DayCell | null;
  isTeacherAuthenticated?: boolean;
  onClose: () => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onAddEventToDate?: (dateString: string) => void;
}

const getGradeBadge = (grade: GradeType) => {
  switch (grade) {
    case '3':
      return {
        label: '3학년',
        colorClass: 'bg-teal-100 text-teal-800 border-teal-300',
        cardBorder: 'border-l-4 border-l-teal-500',
      };
    case '4':
      return {
        label: '4학년',
        colorClass: 'bg-amber-100 text-amber-800 border-amber-300',
        cardBorder: 'border-l-4 border-l-amber-500',
      };
    case 'common':
    default:
      return {
        label: '3·4학년 공통',
        colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        cardBorder: 'border-l-4 border-l-indigo-500',
      };
  }
};

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  selectedCell,
  isTeacherAuthenticated = false,
  onClose,
  onEditEvent,
  onDeleteEvent,
  onAddEventToDate,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Esc key listener & Focus management
  useEffect(() => {
    if (!selectedCell) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedCell, onClose]);

  if (!selectedCell) return null;

  const dateTitle = formatFullKoreanDate(selectedCell.dateString);
  const events = selectedCell.events;
  const hasEvents = events.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-date-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-amber-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                일정 상세
              </span>
              {selectedCell.isToday && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  오늘
                </span>
              )}
              {isTeacherAuthenticated && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  교사 편집 가능
                </span>
              )}
            </div>
            <h3
              id="modal-date-title"
              className="mt-1 text-lg sm:text-xl font-bold text-stone-900"
            >
              {dateTitle}
            </h3>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            aria-label="팝업 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!hasEvents ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                <CalendarOff className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-stone-800">
                등록된 일정이 없습니다
              </h4>
              <p className="mt-1 text-sm text-stone-500">
                선택하신 날짜에는 등록된 3·4학년 학사 일정이 없습니다.
              </p>
              {isTeacherAuthenticated && onAddEventToDate && (
                <button
                  type="button"
                  onClick={() => onAddEventToDate(selectedCell.dateString)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>이 날짜에 새 일정 등록하기</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs text-stone-500 pb-1 border-b border-stone-100">
                <span>등록된 일정 목록</span>
                <span className="font-semibold text-stone-700">총 {events.length}건</span>
              </div>

              {events.map((event: CalendarEvent) => {
                const badge = getGradeBadge(event.grade);
                return (
                  <div
                    key={event.id}
                    className={`bg-stone-50/80 rounded-xl p-4 border border-stone-200/90 shadow-2xs ${badge.cardBorder} hover:shadow-xs transition-shadow`}
                  >
                    {/* Grade Badge & Time & Teacher Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${badge.colorClass}`}
                        >
                          [{badge.label}]
                        </span>

                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200">
                          <Clock className="w-3.5 h-3.5 text-stone-500" />
                          <span>
                            {event.allDay
                              ? '종일 일정'
                              : event.startTime && event.endTime
                              ? `${event.startTime} ~ ${event.endTime}`
                              : event.startTime
                              ? `${event.startTime} 시작`
                              : '시간 미정'}
                          </span>
                        </div>
                      </div>

                      {/* Teacher Edit & Delete Buttons */}
                      {isTeacherAuthenticated && (
                        <div className="flex items-center gap-1">
                          {onEditEvent && (
                            <button
                              type="button"
                              onClick={() => onEditEvent(event)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition-colors cursor-pointer"
                              title="일정 수정"
                            >
                              <Edit3 className="w-3 h-3 text-stone-600" />
                              <span>수정</span>
                            </button>
                          )}
                          {onDeleteEvent && (
                            <button
                              type="button"
                              onClick={() => onDeleteEvent(event)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                              title="일정 삭제"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>삭제</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                      {event.title}
                    </h4>

                    {/* Location */}
                    {event.location && (
                      <div className="mt-2.5 flex items-start gap-1.5 text-xs sm:text-sm text-stone-600">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-medium text-stone-800">
                          장소: {event.location}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {event.description && (
                      <div className="mt-2 text-xs sm:text-sm text-stone-600 bg-white p-3 rounded-lg border border-stone-150 leading-relaxed whitespace-pre-wrap">
                        <div className="flex items-center gap-1 text-stone-400 font-medium mb-1 text-xs">
                          <FileText className="w-3.5 h-3.5" />
                          <span>상세 안내</span>
                        </div>
                        {event.description}
                      </div>
                    )}

                    {/* CreatedBy */}
                    {event.createdBy && (
                      <div className="mt-2.5 text-[11px] text-stone-400 flex items-center justify-end gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span>담당/등록: {event.createdBy}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-stone-200 bg-stone-50">
          <div>
            {isTeacherAuthenticated && hasEvents && onAddEventToDate && (
              <button
                type="button"
                onClick={() => onAddEventToDate(selectedCell.dateString)}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>이 날짜에 새 일정 추가</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-stone-800 hover:bg-stone-900 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 cursor-pointer shadow-xs active:scale-95"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
