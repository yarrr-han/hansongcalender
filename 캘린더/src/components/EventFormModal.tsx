import React, { useState, useEffect } from 'react';
import { CalendarEvent, GradeType } from '../types/calendar';
import { X, Calendar, Clock, MapPin, AlignLeft, User, AlertCircle, Loader2 } from 'lucide-react';

interface EventFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialDate?: string;
  initialEvent?: CalendarEvent | null;
  onClose: () => void;
  onSubmit: (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  mode,
  initialDate,
  initialEvent,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [grade, setGrade] = useState<GradeType>('common');
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [createdBy, setCreatedBy] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form values
  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      if (mode === 'edit' && initialEvent) {
        setTitle(initialEvent.title);
        setDate(initialEvent.date);
        setGrade(initialEvent.grade);
        setAllDay(initialEvent.allDay);
        setStartTime(initialEvent.startTime || '09:00');
        setEndTime(initialEvent.endTime || '10:00');
        setLocation(initialEvent.location);
        setDescription(initialEvent.description || '');
        setCreatedBy(initialEvent.createdBy || '');
      } else {
        // Create mode
        setTitle('');
        setDate(initialDate || new Date().toISOString().split('T')[0]);
        setGrade('common');
        setAllDay(true);
        setStartTime('09:00');
        setEndTime('10:00');
        setLocation('');
        setDescription('');
        setCreatedBy('');
      }
    }
  }, [isOpen, mode, initialEvent, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation rules from Plan.md Section 4
    if (!title.trim()) {
      setValidationError('일정 제목을 입력해주세요 (공백 불가).');
      return;
    }
    if (!date) {
      setValidationError('일정 날짜를 선택해주세요.');
      return;
    }
    if (!location.trim()) {
      setValidationError('장소를 입력해주세요 (공백 불가).');
      return;
    }
    if (!allDay) {
      if (!startTime) {
        setValidationError('시작 시간을 입력해주세요.');
        return;
      }
      if (endTime && endTime < startTime) {
        setValidationError('종료 시간이 시작 시간보다 빠를 수 없습니다.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        date,
        grade,
        allDay,
        startTime: allDay ? undefined : startTime,
        endTime: allDay ? undefined : endTime,
        location: location.trim(),
        description: description.trim(),
        createdBy: createdBy.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      // Retain input values on failure as required by plan.md section 4
      setValidationError(err.message || '저장 중 오류가 발생했습니다.');
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
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              {mode === 'edit' ? '일정 수정 (교사 권한)' : '새 일정 등록 (교사 권한)'}
            </h3>
            <p className="text-xs text-stone-500">
              등록된 일정은 학생·학부모 달력에 즉시 실시간으로 반영됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Validation Error Banner */}
          {validationError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium">{validationError}</span>
            </div>
          )}

          {/* Title (Required) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              일정 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 3학년 과학 탐구 체험학습"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Grade selection (Required) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              대상 학년 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGrade('3')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  grade === '3'
                    ? 'bg-teal-500 text-white border-teal-600 shadow-xs'
                    : 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
                }`}
              >
                [3학년]
              </button>
              <button
                type="button"
                onClick={() => setGrade('4')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  grade === '4'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                [4학년]
              </button>
              <button
                type="button"
                onClick={() => setGrade('common')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  grade === 'common'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
                }`}
              >
                [3·4학년 공통]
              </button>
            </div>
          </div>

          {/* Date Picker (Required) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              일정 날짜 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 pl-10 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* All day toggle & Time selectors */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="all-day-checkbox" className="text-xs font-semibold text-stone-800 flex items-center gap-1.5 cursor-pointer">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>시간 구분: 종일 일정 여부</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="all-day-checkbox"
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-medium text-stone-700">
                  {allDay ? '종일' : '시간 지정'}
                </span>
              </label>
            </div>

            {!allDay && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200/80">
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    시작 시각 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required={!allDay}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    종료 시각 (선택)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location (Required) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              장소 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 각 반 교실, 과학실, 운동장, 시청각실"
                className="w-full px-3.5 py-2 pl-10 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              상세 설명 및 준비물 (선택)
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="학생 및 학부모님께 전달할 추가 안내사항을 적어주세요."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white leading-relaxed"
              ></textarea>
            </div>
          </div>

          {/* CreatedBy (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              담당자 / 등록 부서 (선택)
            </label>
            <div className="relative">
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="예: 3학년부, 4학년 2반, 체육부, 교무실"
                className="w-full px-3.5 py-2 pl-10 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <span>{mode === 'edit' ? '일정 수정 완료' : '일정 저장하기'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
