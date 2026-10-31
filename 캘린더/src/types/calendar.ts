export type GradeType = '3' | '4' | 'common';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD (KST)
  grade: GradeType;
  allDay: boolean;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  location: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayCell {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  dayOfWeek: number; // 0: Sun, 1: Mon, ... 6: Sat
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface DailyNotice {
  id: string;
  date: string; // YYYY-MM-DD
  grade: GradeType;
  title: string;
  items: string[];
  supplies?: string;
  updatedAt: string;
  author?: string;
}

