import React from 'react';
import { DayCell, CalendarEvent, GradeType } from '../types/calendar';
import { getKoreanDayName } from '../utils/dateUtils';
import { Clock, Plus } from 'lucide-react';

interface CalendarGridProps {
  cells: DayCell[];
  isTeacherAuthenticated?: boolean;
  onSelectDate: (cell: DayCell) => void;
  onAddEventToDate?: (dateString: string) => void;
}

const getGradeBadge = (grade: GradeType) => {
  switch (grade) {
    case '3':
      return {
        label: '3학년',
        shortLabel: '3',
        pillClass: 'bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100',
        badgeClass: 'bg-teal-200/80 text-teal-900',
      };
    case '4':
      return {
        label: '4학년',
        shortLabel: '4',
        pillClass: 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100',
        badgeClass: 'bg-amber-200/80 text-amber-900',
      };
    case 'common':
    default:
      return {
        label: '공통',
        shortLabel: '공통',
        pillClass: 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100',
        badgeClass: 'bg-indigo-200/80 text-indigo-900',
      };
  }
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  cells,
  isTeacherAuthenticated = false,
  onSelectDate,
  onAddEventToDate,
}) => {
  const weekDays = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="flex-1 flex flex-col bg-stone-100 min-h-[560px] select-none">
      {/* Weekday Header (일 ~ 토) */}
      <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-200 text-center text-xs sm:text-sm font-semibold">
        {weekDays.map((dayIndex) => {
          const isSunday = dayIndex === 0;
          const isSaturday = dayIndex === 6;
          const textColor = isSunday
            ? 'text-rose-600 bg-rose-50/40'
            : isSaturday
            ? 'text-blue-600 bg-blue-50/40'
            : 'text-stone-700';

          return (
            <div
              key={dayIndex}
              className={`py-2.5 border-r last:border-r-0 border-stone-200 ${textColor}`}
            >
              <span className="sm:hidden">{getKoreanDayName(dayIndex, true)}</span>
              <span className="hidden sm:inline">{getKoreanDayName(dayIndex, false)}</span>
            </div>
          );
        })}
      </div>

      {/* Days Grid - 7 Columns */}
      <div
        className="grid grid-cols-7 flex-1 auto-rows-fr bg-stone-200 gap-[1px]"
        role="grid"
        aria-label="한송초 3,4학년 월간 일정 달력"
      >
        {cells.map((cell) => {
          const isSunday = cell.dayOfWeek === 0;
          const isSaturday = cell.dayOfWeek === 6;
          const eventCount = cell.events.length;

          // Limit displayed event pills in cell, with remainder as "+N개"
          const maxVisibleEvents = 2;
          const visibleEvents = cell.events.slice(0, maxVisibleEvents);
          const extraCount = eventCount - maxVisibleEvents;

          const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectDate(cell);
            }
          };

          return (
            <div
              key={cell.dateString}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate(cell)}
              onKeyDown={handleKeyDown}
              aria-label={`${cell.dateString} 일정 ${eventCount}건 확인`}
              className={`group relative flex flex-col p-1.5 sm:p-2 min-h-[90px] sm:min-h-[105px] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:z-10 ${
                cell.isCurrentMonth
                  ? 'bg-white hover:bg-amber-50/40'
                  : 'bg-stone-50/70 text-stone-400 hover:bg-stone-100/80'
              }`}
            >
              {/* Date Number Header Row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-flex items-center justify-center text-xs sm:text-sm font-semibold rounded-full ${
                      cell.isToday
                        ? 'w-6 h-6 sm:w-7 sm:h-7 bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-300'
                        : isSunday
                        ? cell.isCurrentMonth
                          ? 'text-rose-600'
                          : 'text-rose-400/80'
                        : isSaturday
                        ? cell.isCurrentMonth
                          ? 'text-blue-600'
                          : 'text-blue-400/80'
                        : cell.isCurrentMonth
                        ? 'text-stone-800'
                        : 'text-stone-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.isToday && (
                    <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      오늘
                    </span>
                  )}
                </div>

                {/* Right side of date header: Teacher quick add button OR Event count */}
                <div className="flex items-center gap-1">
                  {isTeacherAuthenticated && onAddEventToDate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddEventToDate(cell.dateString);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-opacity"
                      title={`${cell.dateString}에 새 일정 등록`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}

                  {eventCount > 0 && (
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 group-hover:bg-amber-100 text-stone-600 group-hover:text-amber-900 border border-stone-200 transition-colors"
                      title={`등록된 일정 ${eventCount}개`}
                    >
                      {eventCount}개
                    </span>
                  )}
                </div>
              </div>

              {/* Event preview pills */}
              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                {visibleEvents.map((event: CalendarEvent) => {
                  const badge = getGradeBadge(event.grade);
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] sm:text-xs truncate transition-all ${badge.pillClass}`}
                      title={`${event.title} (${badge.label}) - 클릭하여 상세 정보 확인`}
                    >
                      <span
                        className={`shrink-0 px-1 py-0.1 rounded text-[10px] font-bold ${badge.badgeClass}`}
                      >
                        {badge.shortLabel}
                      </span>
                      <span className="truncate font-medium text-stone-800">
                        {event.title}
                      </span>
                      {event.allDay ? (
                        <span className="hidden sm:inline text-[9px] text-stone-500 shrink-0 ml-auto font-normal">
                          종일
                        </span>
                      ) : event.startTime ? (
                        <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] text-stone-500 shrink-0 ml-auto">
                          <Clock className="w-2.5 h-2.5" />
                          {event.startTime}
                        </span>
                      ) : null}
                    </div>
                  );
                })}

                {/* Overflow count "+N개 더보기" */}
                {extraCount > 0 && (
                  <div className="mt-auto pt-0.5 text-[10px] sm:text-[11px] text-stone-500 font-semibold group-hover:text-emerald-700 transition-colors text-right sm:text-left">
                    +{extraCount}개 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
