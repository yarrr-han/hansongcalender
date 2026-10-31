import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar as CalendarIcon } from 'lucide-react';
import { formatFullKoreanDate, formatDateString } from '../utils/dateUtils';

interface CalendarNavProps {
  currentDate: Date;
  today: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export const CalendarNav: React.FC<CalendarNavProps> = ({
  currentDate,
  today,
  onPrevMonth,
  onNextMonth,
  onToday,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const isCurrentMonth =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth();

  const todayStr = formatFullKoreanDate(formatDateString(today));

  return (
    <div className="bg-white border-b border-stone-200/80 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      {/* Month Title & Year */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-emerald-600 hidden sm:block" />
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            {year}년 {month}월
          </h2>
        </div>

        {isCurrentMonth ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            이번 달
          </span>
        ) : (
          <span className="text-xs text-stone-500 hidden sm:inline">
            (전체 학사일정 조회 중)
          </span>
        )}
      </div>

      {/* Navigation Buttons: Prev, Today, Next */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-stone-700 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 active:scale-95 transition-all cursor-pointer"
          aria-label="이전 달로 이동"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>이전 달</span>
        </button>

        <button
          type="button"
          onClick={onToday}
          disabled={isCurrentMonth}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 cursor-pointer ${
            isCurrentMonth
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-80 cursor-default'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs active:scale-95'
          }`}
          title="오늘 날짜가 속한 달로 이동"
          aria-label="오늘 달력으로 이동"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>오늘</span>
        </button>

        <button
          type="button"
          onClick={onNextMonth}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-stone-700 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 active:scale-95 transition-all cursor-pointer"
          aria-label="다음 달로 이동"
        >
          <span>다음 달</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Today Reference Badge */}
      <div className="w-full sm:w-auto text-xs text-stone-500 flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-100">
        <span className="text-stone-400">기준 오늘:</span>
        <span className="font-medium text-stone-700">{todayStr}</span>
      </div>
    </div>
  );
};
