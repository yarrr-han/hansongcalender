import { CalendarEvent } from '../types/calendar';

export interface LoginResponse {
  success: boolean;
  token?: string;
  expiresAt?: number;
  error?: string;
  remainingAttempts?: number;
  locked?: boolean;
}

export interface ApiError {
  error: string;
}

const TOKEN_STORAGE_KEY = 'hansong_teacher_token';
const EXPIRES_STORAGE_KEY = 'hansong_teacher_expires';

export const authStorage = {
  getToken: (): string | null => {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  },
  setSession: (token: string, expiresAt: number) => {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(EXPIRES_STORAGE_KEY, String(expiresAt));
  },
  clearSession: () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(EXPIRES_STORAGE_KEY);
  },
  getExpiresAt: (): number => {
    const raw = sessionStorage.getItem(EXPIRES_STORAGE_KEY);
    return raw ? parseInt(raw, 10) : 0;
  },
};

export const api = {
  // Public: get all events
  async getEvents(): Promise<CalendarEvent[]> {
    const res = await fetch('/api/events');
    if (!res.ok) {
      throw new Error('일정 목록을 불러오는 중 오류가 발생했습니다.');
    }
    return res.json();
  },

  // Teacher login
  async loginTeacher(password: string): Promise<LoginResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || '인증에 실패했습니다.',
        remainingAttempts: data.remainingAttempts,
        locked: data.locked,
      };
    }

    if (data.token && data.expiresAt) {
      authStorage.setSession(data.token, data.expiresAt);
    }
    return data;
  },

  // Check auth status
  async checkAuthStatus(token: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.authenticated);
    } catch {
      return false;
    }
  },

  // Teacher logout
  async logoutTeacher(token: string): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      authStorage.clearSession();
    }
  },

  // Create event
  async createEvent(
    event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
    token: string
  ): Promise<CalendarEvent> {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '일정 등록에 실패했습니다.');
    }
    return data;
  },

  // Update event
  async updateEvent(
    id: string,
    event: Partial<CalendarEvent>,
    token: string
  ): Promise<CalendarEvent> {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '일정 수정에 실패했습니다.');
    }
    return data;
  },

  // Delete event
  async deleteEvent(id: string, token: string): Promise<void> {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '일정 삭제에 실패했습니다.');
    }
  },

  // Public: Ask Gemini AI Q&A bot about calendar schedules
  async askQna(
    question: string,
    history: Array<{ sender: 'user' | 'bot'; text: string }> = []
  ): Promise<string> {
    const res = await fetch('/api/qna', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '답변을 불러오는 중 오류가 발생했습니다.');
    }
    return data.answer;
  },

  // Notices API
  async getNotices(date?: string): Promise<any[]> {
    const url = date ? `/api/notices?date=${encodeURIComponent(date)}` : '/api/notices';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('알림장 목록을 불러오지 못했습니다.');
    }
    return res.json();
  },

  async saveNotice(
    notice: {
      id?: string;
      date: string;
      grade: string;
      title: string;
      items: string[];
      supplies?: string;
      author?: string;
    },
    token: string
  ): Promise<any> {
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(notice),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '알림장 저장에 실패했습니다.');
    }
    return data;
  },

  async deleteNotice(id: string, token: string): Promise<void> {
    const res = await fetch(`/api/notices/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '알림장 삭제에 실패했습니다.');
    }
  },
};

