import React, { useState } from 'react';
import { DailyNotice, GradeType } from '../types/calendar';
import { formatFullKoreanDate } from '../utils/dateUtils';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Package,
  Calendar,
  Clock,
  Search,
  Filter,
} from 'lucide-react';

interface NoticeBoardViewProps {
  todayStr: string;
  notices: DailyNotice[];
  isTeacherAuthenticated: boolean;
  onOpenCreateNotice: (grade?: GradeType) => void;
  onOpenEditNotice: (notice: DailyNotice) => void;
  onDeleteNotice: (id: string) => void;
}

export const NoticeBoardView: React.FC<NoticeBoardViewProps> = ({
  todayStr,
  notices,
  isTeacherAuthenticated,
  onOpenCreateNotice,
  onOpenEditNotice,
  onDeleteNotice,
}) => {
  const [gradeFilter, setGradeFilter] = useState<'all' | '3' | '4' | 'common'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sort notices by date descending, then grade
  const sortedNotices = [...notices].sort((a, b) => b.date.localeCompare(a.date));

  const filteredNotices = sortedNotices.filter((n) => {
    if (gradeFilter !== 'all' && n.grade !== gradeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchItems = n.items.some((i) => i.toLowerCase().includes(q));
      const matchSupplies = n.supplies?.toLowerCase().includes(q);
      return matchTitle || matchItems || matchSupplies;
    }
    return true;
  });

  const getGradeTheme = (grade: GradeType) => {
    switch (grade) {
      case '3':
        return {
          badge: 'bg-teal-100 text-teal-800 border-teal-200',
          title: 'text-teal-950',
          border: 'border-l-4 border-l-teal-500 bg-white border-stone-200',
          label: '3학년',
          bulletColor: 'text-teal-600',
        };
      case '4':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          title: 'text-amber-950',
          border: 'border-l-4 border-l-amber-500 bg-white border-stone-200',
          label: '4학년',
          bulletColor: 'text-amber-600',
        };
      case 'common':
      default:
        return {
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          title: 'text-indigo-950',
          border: 'border-l-4 border-l-indigo-500 bg-white border-stone-200',
          label: '3·4학년 공통',
          bulletColor: 'text-indigo-600',
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-stone-50/50 space-y-4">
      {/* Top Banner Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              <Megaphone className="w-3.5 h-3.5 text-amber-600" />
              한송초 알림장 게시판
            </span>
            <span className="text-xs text-stone-400">
              오늘 기준: {formatFullKoreanDate(todayStr)}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
            3·4학년 일자별 알림장 및 준비물 안내
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            학년별 수업 준비물, 과제, 하교 시간 및 학교 공지사항을 날짜별로 확인할 수 있습니다.
          </p>
        </div>

        {/* Big Notice Creation Button */}
        <button
          type="button"
          onClick={() => onOpenCreateNotice(gradeFilter === 'all' ? undefined : gradeFilter)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>새 알림장 작성하기</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Grade Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setGradeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              gradeFilter === 'all'
                ? 'bg-stone-800 text-white shadow-2xs'
                : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
            }`}
          >
            전체 보기 ({notices.length})
          </button>
          <button
            type="button"
            onClick={() => setGradeFilter('3')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              gradeFilter === '3'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-white hover:bg-teal-50 text-teal-800 border border-teal-200'
            }`}
          >
            3학년 알림장 ({notices.filter((n) => n.grade === '3').length})
          </button>
          <button
            type="button"
            onClick={() => setGradeFilter('4')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              gradeFilter === '4'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            4학년 알림장 ({notices.filter((n) => n.grade === '4').length})
          </button>
          <button
            type="button"
            onClick={() => setGradeFilter('common')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              gradeFilter === 'common'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200'
            }`}
          >
            공통 알림 ({notices.filter((n) => n.grade === 'common').length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="알림장 내용 또는 준비물 검색..."
            className="w-full px-3.5 py-1.5 pl-9 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Notice Cards List */}
      {filteredNotices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 shadow-2xs">
          <Megaphone className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-stone-700">해당 조건의 알림장이 없습니다</h3>
          <p className="text-xs text-stone-500 mt-1">
            새로운 알림장을 작성하거나 검색 조건을 변경해 보세요.
          </p>
          <button
            type="button"
            onClick={() => onOpenCreateNotice()}
            className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer"
          >
            + 새 알림장 작성하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredNotices.map((notice) => {
            const theme = getGradeTheme(notice.grade);
            const isTodayNotice = notice.date === todayStr;

            return (
              <div
                key={notice.id}
                className={`rounded-2xl p-4 sm:p-5 border shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between ${theme.border}`}
              >
                <div>
                  {/* Top metadata & Grade */}
                  <div className="flex items-center justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${theme.badge}`}
                      >
                        [{theme.label}]
                      </span>
                      {isTodayNotice && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                          오늘
                        </span>
                      )}
                    </div>

                    {/* Teacher Edit/Delete buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditNotice(notice)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        title="알림장 수정"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNotice(notice.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="알림장 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Date & Title */}
                  <div className="mb-2">
                    <div className="flex items-center gap-1 text-[11px] text-stone-500 mb-0.5">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span>{formatFullKoreanDate(notice.date)}</span>
                    </div>
                    <h3 className={`text-base font-bold ${theme.title} leading-snug`}>
                      {notice.title}
                    </h3>
                  </div>

                  {/* Checklist items */}
                  <ul className="space-y-2 my-3">
                    {notice.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs sm:text-sm text-stone-700 leading-relaxed bg-stone-50/70 p-2 rounded-lg border border-stone-150"
                      >
                        <CheckCircle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${theme.bulletColor}`}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Supplies Box */}
                  {notice.supplies && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <Package className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">준비물: </span>
                        <span>{notice.supplies}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer metadata */}
                <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <span>작성: {notice.author || '담임교사'}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
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
  );
};
