// src/logic/MYAssignmentService.js

export class MYAssignmentService {
  constructor() {
    this.semesterScore = 0; // 이번 학기 누적 과제 점수 (0 ~ 100점, 월 25점 x 4회)
  }

  // 학기 초 과제 점수 초기화
  MYResetAssignment() {
    this.semesterScore = 0;
  }


  // 월말(4주차) 과제 성공/실패 판정
  // prevThreshold가 0 이하(1학년 1학기 중간고사 전)이거나 GPT Plus 구독 중이면 100% 성공
  MYEvaluateMonthly(playerIntelligence, prevThreshold, hasGpt = false) {
    if (hasGpt) {
      this.semesterScore = Math.min(100, this.semesterScore + 25);
      return {
        success: true,
        gained: 25,
        totalScore: this.semesterScore,
        message: `🤖 [GPT Plus 적용] 이번 달 과제를 완벽하게 완료했습니다! (+25점, 누적 ${this.semesterScore}/100점)`,
      };
    }

    if (prevThreshold <= 0) {
      this.semesterScore = Math.min(100, this.semesterScore + 25);
      return {
        success: true,
        gained: 25,
        totalScore: this.semesterScore,
        message: `📘 이번 달 과제를 성공적으로 제출했습니다! (성공률 100%, +25점, 누적 ${this.semesterScore}/100점)`,
      };
    }

    const prob = Math.min(1, Math.max(0, playerIntelligence / prevThreshold));
    const isSuccess = Math.random() < prob;

    if (isSuccess) {
      this.semesterScore = Math.min(100, this.semesterScore + 25);
      return {
        success: true,
        gained: 25,
        totalScore: this.semesterScore,
        message: `📘 이번 달 과제를 성공적으로 제출했습니다! (성공률 ${Math.round(prob * 100)}%, +25점, 누적 ${this.semesterScore}/100점)`,
      };
    }

    return {
      success: false,
      gained: 0,
      totalScore: this.semesterScore,
      message: `😥 이번 달 과제 제출에 실패했습니다. (성공률 ${Math.round(prob * 100)}%, +0점, 누적 ${this.semesterScore}/100점)`,
    };
  }

  // 현재 학기 누적 과제 점수 반환
  MYGetSemesterScore() {
    return this.semesterScore;
  }
}
