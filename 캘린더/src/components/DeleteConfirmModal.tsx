import React, { useState } from 'react';
import { CalendarEvent } from '../types/calendar';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  event,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(event.id);
      onClose();
    } catch (err: any) {
      setError(err.message || '일정 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
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
        className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>일정 삭제 확인</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-sm text-stone-700">
            정말로 다음 일정을 삭제하시겠습니까?
          </p>
          <div className="mt-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 space-y-1">
            <div className="font-bold text-stone-900 text-sm">{event.title}</div>
            <div className="text-stone-500">날짜: {event.date}</div>
            <div className="text-stone-500">장소: {event.location}</div>
          </div>
          <p className="mt-2 text-xs text-stone-400">
            * 삭제된 일정은 복구할 수 없습니다.
          </p>

          {error && (
            <p className="mt-2 text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>삭제 중...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>삭제하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
