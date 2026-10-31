import React, { useState } from 'react';
import { DailyNotice, GradeType } from '../types/calendar';
import { formatFullKoreanDate, formatDateString } from '../utils/dateUtils';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Megaphone,
} from 'lucide-react';

interface TodayNoticeBannerProps {
  today: Date;
  notices: DailyNotice[];
  isTeacherAuthenticated: boolean;
  onOpenCreateNotice: (grade?: GradeType) => void;
  onOpenEditNotice: (notice: DailyNotice) => void;
  onDeleteNotice: (id: string) => void;
}

export const TodayNoticeBanner: React.FC<TodayNoticeBannerProps> = ({
  today,
  notices,
  isTeacherAuthenticated,
  onOpenCreateNotice,
  onOpenEditNotice,
  onDeleteNotice,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'all' | '3' | '4'>('all');

  const todayStr = formatDateString(today);
  const formattedToday = formatFullKoreanDate(todayStr);

  // Filter notices for today
  const todayNotices = notices.filter((n) => n.date === todayStr);

  const filteredNotices = todayNotices.filter((n) => {
    if (selectedGradeFilter === 'all') return true;
    return n.grade === selectedGradeFilter || n.grade === 'common';
  });

  const getGradeTheme = (grade: GradeType) => {
    switch (grade) {
      case '3':
        return {
          badge: 'bg-teal-100 text-teal-800 border-teal-200',
          title: 'text-teal-950',
          border: 'border-l-4 border-l-teal-500 bg-teal-50/40 border-stone-200',
          label: '3학년',
          bulletColor: 'text-teal-600',
        };
      case '4':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          title: 'text-amber-950',
          border: 'border-l-4 border-l-amber-500 bg-amber-50/40 border-stone-200',
          label: '4학년',
          bulletColor: 'text-amber-600',
        };
      case 'common':
      default:
        return {
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          title: 'text-indigo-950',
          border: 'border-l-4 border-l-indigo-500 bg-indigo-50/40 border-stone-200',
          label: '3·4학년 공통',
          bulletColor: 'text-indigo-600',
        };
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 border-b border-amber-200/90 transition-all">
      {/* Top Bar Header */}
      <div className="px-4 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
            <Megaphone className="w-4 h-4 animate-bounce duration-1000" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                오늘의 알림장
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                {formattedToday}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">
              오늘 3·4학년 준비물, 과제, 하교 시간 및 학교 공지사항입니다.
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-2">
          {/* Grade Filter Tabs */}
          <div className="flex items-center bg-white/80 p-0.5 rounded-lg border border-amber-200 text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedGradeFilter('all')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                selectedGradeFilter === 'all'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setSelectedGradeFilter('3')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                selectedGradeFilter === '3'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              3학년
            </button>
            <button
              type="button"
              onClick={() => setSelectedGradeFilter('4')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                selectedGradeFilter === '4'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              4학년
            </button>
          </div>

          {/* Add Notice Button - Always accessible */}
          <button
            type="button"
            onClick={() => onOpenCreateNotice(selectedGradeFilter === 'all' ? undefined : selectedGradeFilter)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer transition-all active:scale-95"
            title="새 알림장 작성"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>알림장 작성</span>
          </button>

          {/* Toggle Expand / Collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/80 hover:bg-white text-stone-600 border border-amber-200 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
            aria-label={isExpanded ? '알림장 접기' : '알림장 펼치기'}
          >
            <span>{isExpanded ? '접기' : '펼치기'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content Grid */}
      {isExpanded && (
        <div className="px-4 sm:px-6 pb-3 pt-1">
          {filteredNotices.length === 0 ? (
            <div className="bg-white/90 rounded-xl p-4 text-center border border-amber-200/80">
              <p className="text-xs text-stone-500">
                선택하신 학년의 오늘 등록된 알림장이 없습니다.
              </p>
              <button
                type="button"
                onClick={() => onOpenCreateNotice(selectedGradeFilter === 'all' ? undefined : selectedGradeFilter)}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>오늘 알림장 작성하기</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredNotices.map((notice) => {
                const theme = getGradeTheme(notice.grade);
                return (
                  <div
                    key={notice.id}
                    className={`bg-white rounded-xl p-3 sm:p-3.5 border shadow-2xs flex flex-col justify-between ${theme.border}`}
                  >
                    <div>
                      {/* Card Header: Grade badge & title & teacher actions */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${theme.badge}`}
                          >
                            [{theme.label}]
                          </span>
                          <h4 className={`text-xs sm:text-sm font-bold ${theme.title} truncate`}>
                            {notice.title}
                          </h4>
                        </div>

                        {/* Teacher actions */}
                        {isTeacherAuthenticated && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onOpenEditNotice(notice)}
                              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded cursor-pointer"
                              title="알림장 수정"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteNotice(notice.id)}
                              className="p-1 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                              title="알림장 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Notice Items List */}
                      <ul className="space-y-1.5 my-2">
                        {notice.items.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-1.5 text-xs text-stone-700 leading-snug"
                          >
                            <CheckCircle
                              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${theme.bulletColor}`}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Supplies Box (준비물) */}
                      {notice.supplies && (
                        <div className="mt-2.5 p-2 rounded-lg bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-1.5">
                          <Package className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">준비물: </span>
                            <span>{notice.supplies}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Author & Timestamp */}
                    <div className="mt-2.5 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                      <span>작성: {notice.author || '담임교사'}</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(notice.updatedAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
