import { CalendarEvent } from '../types/calendar';
import { formatDateString } from '../utils/dateUtils';

/**
 * Creates dynamic sample events relative to the current month
 * As stated in Section 7 of plan.md:
 * "초기 화면 개발 시 예시 일정을 사용하되 실제 일정과 명확히 구분하고 정식 운영 전 제거한다."
 */
export function getSampleEvents(baseDate: Date = new Date()): CalendarEvent[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0-indexed

  // Helper to get YYYY-MM-DD for a day in this month
  const getDateStr = (day: number) => {
    return formatDateString(new Date(year, month, day));
  };

  const today = baseDate.getDate();

  return [
    {
      id: 'sample-1',
      title: '3·4학년 가을 운동회',
      date: getDateStr(Math.max(1, today - 4)),
      grade: 'common',
      allDay: true,
      location: '운동장',
      description: '3, 4학년 전체 학생이 함께하는 신나는 가을 체육 한마당입니다. 편한 체육복과 운동화, 개인 물병을 준비해 주세요.',
      createdBy: '교무실',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-2',
      title: '3학년 과학 탐구 체험학습',
      date: getDateStr(today),
      grade: '3',
      allDay: false,
      startTime: '09:10',
      endTime: '11:40',
      location: '과학실 및 생태학습장',
      description: '가을 식물 관찰 및 곤충 생태 탐구 활동을 진행합니다. 관찰 기록장과 필기도구를 챙겨오세요.',
      createdBy: '3학년부',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-3',
      title: '학부모 공개 수업의 날',
      date: getDateStr(today),
      grade: 'common',
      allDay: false,
      startTime: '13:20',
      endTime: '15:00',
      location: '각 반 교실',
      description: '3, 4학년 각 반 교실에서 학부모 공개수업이 실시됩니다. 학부모님들의 많은 관심과 참관 부탁드립니다.',
      createdBy: '연구부',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-4',
      title: '4학년 독서 골든벨 대회',
      date: getDateStr(Math.min(28, today + 3)),
      grade: '4',
      allDay: false,
      startTime: '10:00',
      endTime: '12:00',
      location: '시청각실 (도서관 옆)',
      description: '1학기 및 2학기 추천도서를 바탕으로 열리는 4학년 독서 퀴즈 대회입니다. 모둠별 협동 미션도 함께 진행됩니다.',
      createdBy: '4학년부',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-5',
      title: '재난 대응 안전 대피 훈련',
      date: getDateStr(Math.min(28, today + 3)),
      grade: 'common',
      allDay: false,
      startTime: '14:00',
      endTime: '14:40',
      location: '전체 교실 및 운동장 대피소',
      description: '지진 및 화재 대비 전교생 모의 대피 훈련입니다. 대피 유도 요원의 안내에 따라 질서 있게 이동합니다.',
      createdBy: '안전생활부',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-6',
      title: '3학년 줄넘기 급수제 측정',
      date: getDateStr(Math.min(28, today + 7)),
      grade: '3',
      allDay: false,
      startTime: '10:50',
      endTime: '11:30',
      location: '강당 (체육관)',
      description: '기초 체력 증진을 위한 3학년 줄넘기 급수 도전 평가입니다.',
      createdBy: '체육부',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-7',
      title: '4학년 생존수영 실기 교육',
      date: getDateStr(Math.min(28, today + 8)),
      grade: '4',
      allDay: true,
      location: '지역 청소년 수련관 수영장',
      description: '물놀이 안전 수칙 및 실전 생존수영 2일차 교육입니다. 수영복, 수모, 물안경, 수건을 준비하세요. (학교 버스 왕복 이동)',
      createdBy: '4학년부',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-8',
      title: '한송 꿈·끼 동아리 발표회',
      date: getDateStr(Math.min(28, today + 12)),
      grade: 'common',
      allDay: false,
      startTime: '13:00',
      endTime: '15:20',
      location: '꿈나래 강당',
      description: '3, 4학년 동아리 활동 결과물 전시 및 오케스트라, 댄스, 사물놀이 축하 공연이 열립니다.',
      createdBy: '방과후지원부',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}
