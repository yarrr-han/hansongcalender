import React, { useState, useEffect } from 'react';
import { DailyNotice, GradeType } from '../types/calendar';
import { X, Calendar, Megaphone, Package, User, AlertCircle, Loader2 } from 'lucide-react';

interface NoticeEditModalProps {
  isOpen: boolean;
  initialNotice?: DailyNotice | null;
  defaultGrade?: GradeType;
  todayDateStr: string;
  onClose: () => void;
  onSubmit: (noticeData: {
    id?: string;
    date: string;
    grade: GradeType;
    title: string;
    items: string[];
    supplies?: string;
    author?: string;
  }) => Promise<void>;
}

export const NoticeEditModal: React.FC<NoticeEditModalProps> = ({
  isOpen,
  initialNotice,
  defaultGrade = '3',
  todayDateStr,
  onClose,
  onSubmit,
}) => {
  const [date, setDate] = useState(todayDateStr);
  const [grade, setGrade] = useState<GradeType>(defaultGrade);
  const [title, setTitle] = useState('');
  const [itemsText, setItemsText] = useState('');
  const [supplies, setSupplies] = useState('');
  const [author, setAuthor] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      if (initialNotice) {
        setDate(initialNotice.date);
        setGrade(initialNotice.grade);
        setTitle(initialNotice.title);
        setItemsText(initialNotice.items.join('\n'));
        setSupplies(initialNotice.supplies || '');
        setAuthor(initialNotice.author || '');
      } else {
        setDate(todayDateStr);
        setGrade(defaultGrade);
        setTitle(defaultGrade === '3' ? '3학년 오늘 알림장' : defaultGrade === '4' ? '4학년 오늘 알림장' : '3·4학년 공통 알림장');
        setItemsText('');
        setSupplies('');
        setAuthor('담임교사');
      }
    }
  }, [isOpen, initialNotice, defaultGrade, todayDateStr]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('알림장 제목을 입력해주세요.');
      return;
    }

    const items = itemsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (items.length === 0) {
      setValidationError('알림장 내용을 최소 1줄 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: initialNotice?.id,
        date,
        grade,
        title: title.trim(),
        items,
        supplies: supplies.trim() || undefined,
        author: author.trim() || '담임교사',
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || '알림장 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {initialNotice ? '알림장 수정' : '오늘 알림장 작성'}
              </h3>
              <p className="text-xs text-stone-500">
                작성된 알림장은 달력 상단에 실시간으로 표시됩니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {validationError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              알림장 일자 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 pl-10 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
              <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Grade selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              대상 학년 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setGrade('3');
                  if (!initialNotice) setTitle('3학년 오늘 알림장');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  grade === '3'
                    ? 'bg-teal-500 text-white border-teal-600 shadow-xs'
                    : 'bg-teal-50 border-teal-200 text-teal-800'
                }`}
              >
                [3학년]
              </button>
              <button
                type="button"
                onClick={() => {
                  setGrade('4');
                  if (!initialNotice) setTitle('4학년 오늘 알림장');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  grade === '4'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                [4학년]
              </button>
              <button
                type="button"
                onClick={() => {
                  setGrade('common');
                  if (!initialNotice) setTitle('3·4학년 공통 알림장');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  grade === 'common'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                }`}
              >
                [3·4학년 공통]
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              알림장 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 3학년 오늘 알림장"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          {/* Notice items (One per line) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              알림 내용 (줄바꿈으로 구분) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              placeholder="예:&#10;1교시 체육: 체육복 착용 및 운동화 챙기기&#10;수학익힘책 42~45쪽 풀어오기&#10;하교 시간: 5교시 종료 후 13:50 하교"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white leading-relaxed"
            ></textarea>
            <p className="mt-1 text-[11px] text-stone-400">
              * 한 줄에 알림장 내용 하나씩 입력하면 체크 표시와 함께 깔끔하게 나열됩니다.
            </p>
          </div>

          {/* Supplies */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              내일/오늘 준비물 (선택)
            </label>
            <div className="relative">
              <input
                type="text"
                value={supplies}
                onChange={(e) => setSupplies(e.target.value)}
                placeholder="예: 색연필, 식물 관찰 기록장, 개인 물병"
                className="w-full px-3.5 py-2 pl-10 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
              <Package className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              작성자 / 부서 (선택)
            </label>
            <div className="relative">
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="예: 3학년 담임교사, 교무실"
                className="w-full px-3.5 py-2 pl-10 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <span>{initialNotice ? '알림장 수정 완료' : '알림장 등록하기'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
