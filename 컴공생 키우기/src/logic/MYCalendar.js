// src/logic/MYCalendar.js

export class MYCalendar {
  constructor(elapsedWeek = 0) {
    this.elapsedWeek = elapsedWeek; // 완료한 주 수 (0 ~ 192)
    this.MAX_WEEKS = 192; // 4년 * 12개월 * 4주
  }

  // 현재 날짜 정보 계산[cite: 45]
  MYGetDate() {
    if (this.elapsedWeek >= this.MAX_WEEKS) {
      return {
        isGraduated: true,
        academicYear: 4,
        month: 2,
        weekInMonth: 4,
        semesterId: 'GRADUATED',
        isVacation: false,
      };
    }

    const academicYear = Math.floor(this.elapsedWeek / 48) + 1;
    const monthIndex = Math.floor((this.elapsedWeek % 48) / 4);
    const month = ((monthIndex + 2) % 12) + 1; // 3월부터 시작 (3~12, 1~2)
    const weekInMonth = (this.elapsedWeek % 4) + 1;

    // 학기 및 방학 판별 (3~6월: 1학기, 7~8월: 여름방학, 9~12월: 2학기, 1~2월: 겨울방학)
    let semesterId = '';
    let isVacation = false;

    if (month >= 3 && month <= 6) {
      semesterId = `${academicYear}-1`;
    } else if (month >= 9 && month <= 12) {
      semesterId = `${academicYear}-2`;
    } else {
      semesterId = `${academicYear}-VAC`;
      isVacation = true;
    }

    return {
      isGraduated: false,
      elapsedWeek: this.elapsedWeek,
      academicYear,
      month,
      weekInMonth,
      semesterId,
      isVacation,
    };
  }

  // 이번 주 고정 학사 일정 조회 (월말 월세, 학기 초 학비, 시험 주차 등)
  MYGetSchedule() {
    const date = this.MYGetDate();
    if (date.isGraduated) return [];

    const events = [];

    // 학기 초 첫 주 (3월 1주, 9월 1주) -> 학비 납부
    if ((date.month === 3 || date.month === 9) && date.weekInMonth === 1) {
      events.push('TUITION_DUE');
    }

    // 중간고사 (4월 4주, 10월 4주)
    if ((date.month === 4 || date.month === 10) && date.weekInMonth === 4) {
      events.push('MIDTERM_EXAM');
    }

    // 기말고사 및 과제 마감 (6월 4주, 12월 4주)
    if ((date.month === 6 || date.month === 12) && date.weekInMonth === 4) {
      events.push('FINAL_EXAM');
      events.push('ASSIGNMENT_DEADLINE');
    }

    // 매월 마지막 주 (4주차) -> 월세 납부
    if (date.weekInMonth === 4) {
      events.push('RENT_DUE');
    }

    return events;
  }

  // 다음 주로 1주 진행
  MYAdvance() {
    if (this.elapsedWeek < this.MAX_WEEKS) {
      this.elapsedWeek += 1;
    }
    return this.MYGetDate();
  }
}