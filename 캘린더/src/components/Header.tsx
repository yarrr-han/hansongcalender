import React from 'react';
import { School, CalendarCheck2, Lock, Unlock, Plus, LogOut, Calendar, Megaphone, PenSquare } from 'lucide-react';

interface HeaderProps {
  activeTab: 'calendar' | 'notices';
  onChangeTab: (tab: 'calendar' | 'notices') => void;
  isTeacherAuthenticated: boolean;
  onOpenTeacherAuth: () => void;
  onOpenCreateEvent: () => void;
  onOpenCreateNotice: () => void;
  onLogoutTeacher: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onChangeTab,
  isTeacherAuthenticated,
  onOpenTeacherAuth,
  onOpenCreateEvent,
  onOpenCreateNotice,
  onLogoutTeacher,
}) => {
  return (
    <header className="bg-white border-b border-amber-200/80 shadow-xs sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Main Title & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <School className="w-3.5 h-3.5" />
                한송초등학교
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-200">
                <CalendarCheck2 className="w-3 h-3 text-amber-700" />
                3·4학년 전용
              </span>

              {isTeacherAuthenticated ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                  <Unlock className="w-3 h-3 text-rose-600" />
                  교사 편집 모드
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-stone-500 bg-stone-100">
                  누구나 로그인 없이 열람
                </span>
              )}
            </div>

            {/* Required Welcome Headline from plan.md Section 2 */}
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-stone-900 tracking-tight leading-tight">
              한송초 3,4학년 일정 공유 달력에 오신 것을 환영합니다
            </h1>
          </div>

          {/* Right Toolbar: View Tabs & Teacher Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Switching Tabs: Calendar vs Notice Board */}
            <nav className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => onChangeTab('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>월간 달력</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('notices')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'notices'
                    ? 'bg-white text-amber-900 shadow-xs font-extrabold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                <span>알림장 모아보기</span>
              </button>
            </nav>

            {/* Prominent "알림장 작성" Tab/Button (Always visible to fulfill user request) */}
            <button
              type="button"
              onClick={onOpenCreateNotice}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer"
              title="오늘 3·4학년 알림장 작성하기"
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>알림장 작성</span>
            </button>

            {/* Teacher Actions */}
            {isTeacherAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenCreateEvent}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="새 학사일정 등록"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>일정 등록</span>
                </button>
                <button
                  type="button"
                  onClick={onLogoutTeacher}
                  className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition-colors cursor-pointer"
                  title="교사 편집 모드 종료"
                >
                  <LogOut className="w-3 h-3 text-stone-500" />
                  <span className="hidden sm:inline">편집 종료</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenTeacherAuth}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition-all cursor-pointer shadow-2xs"
                title="공용 비밀번호를 입력해 일정 및 알림장 편집 권한을 얻습니다."
              >
                <Lock className="w-3 h-3 text-stone-500" />
                <span>교사 관리</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
