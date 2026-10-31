import { CalendarEvent, DayCell } from '../types/calendar';

/**
 * Returns YYYY-MM-DD string in local/KST format
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if two dates represent the exact same calendar day
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const KOREAN_DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const KOREAN_DAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

export function getKoreanDayName(dayIndex: number, short = false): string {
  return short ? KOREAN_DAY_SHORT[dayIndex] : KOREAN_DAY_NAMES[dayIndex];
}

/**
 * Format date for modal header: e.g. "2026년 10월 30일 (금요일)"
 */
export function formatFullKoreanDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayName = getKoreanDayName(dateObj.getDay());
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
}

/**
 * Generate 7-column calendar matrix for the given year and month
 */
export function generateMonthGrid(
  year: number,
  month: number, // 0-indexed (0: Jan, 9: Oct)
  events: CalendarEvent[],
  today: Date
): DayCell[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0: Sunday ... 6: Saturday
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];

  // Group events by date string
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const list = eventsByDate.get(ev.date) || [];
    list.push(ev);
    eventsByDate.set(ev.date, list);
  }

  // 1. Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const date = new Date(year, month - 1, dayNumber);
    const dateString = formatDateString(date);
    cells.push({
      date,
      dateString,
      dayNumber,
      dayOfWeek: date.getDay(),
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      events: sortEvents(eventsByDate.get(dateString) || []),
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = formatDateString(date);
    cells.push({
      date,
      dateString,
      dayNumber: day,
      dayOfWeek: date.getDay(),
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      events: sortEvents(eventsByDate.get(dateString) || []),
    });
  }

  // 3. Next month leading days to complete the full weeks (usually 35 or 42 cells)
  const remainingCells = (7 - (cells.length % 7)) % 7;
  // If we have 35 cells and start on Sunday, let's keep either 35 or 42 as needed
  const totalCellsNeeded = cells.length + remainingCells < 35 ? 35 : cells.length + remainingCells;
  const trailingNeeded = totalCellsNeeded - cells.length;

  for (let day = 1; day <= trailingNeeded; day++) {
    const date = new Date(year, month + 1, day);
    const dateString = formatDateString(date);
    cells.push({
      date,
      dateString,
      dayNumber: day,
      dayOfWeek: date.getDay(),
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      events: sortEvents(eventsByDate.get(dateString) || []),
    });
  }

  return cells;
}

/**
 * Sort events: All-day events first, then by startTime ascending, then by title
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    if (a.startTime && b.startTime) {
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
    } else if (a.startTime && !b.startTime) {
      return -1;
    } else if (!a.startTime && b.startTime) {
      return 1;
    }
    return a.title.localeCompare(b.title, 'ko');
  });
}
