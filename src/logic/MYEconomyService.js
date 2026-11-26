// src/logic/MYEconomyService.js

export const MY_ECONOMY_RULES = {
  monthlyRent: 600000,
  baseTuition: 2000000,
};

export class MYEconomyService {
  constructor() {
    this.paidRentMonths = new Set();
    this.paidTuitionSemesters = new Set();
  }

  // 월세 납부 처리 (다이아·금수저는 전액 지원)
  MYPayRent(player, yearMonthKey) {
    if (this.paidRentMonths.has(yearMonthKey)) {
      return {
        isBankrupt: false,
        alreadyPaid: true,
        paidAmount: 0,
        supportedBySpoon: false,
      };
    }

    if (player.spoon?.id === 'diamond' || player.spoon?.id === 'gold') {
      this.paidRentMonths.add(yearMonthKey);
      return {
        isBankrupt: false,
        alreadyPaid: false,
        paidAmount: 0,
        supportedBySpoon: true,
      };
    }

    const amount = MY_ECONOMY_RULES.monthlyRent;
    if (player.money < amount) {
      return {
        isBankrupt: true,
        alreadyPaid: false,
        paidAmount: 0,
        supportedBySpoon: false,
        reason: `월세(${amount.toLocaleString()}원)를 납부할 소지금이 부족해 파산했습니다.`,
      };
    }

    player.MYApplyDelta({ money: -amount });
    this.paidRentMonths.add(yearMonthKey);

    return {
      isBankrupt: false,
      alreadyPaid: false,
      paidAmount: amount,
      supportedBySpoon: false,
    };
  }

  // 직전 학기 평점 기반 장학금 계산
  MYCalculateScholarship(prevGpa) {
    if (typeof prevGpa !== 'number') return 0;
    const base = MY_ECONOMY_RULES.baseTuition;

    if (prevGpa >= 4.2) return base;                  // 전액 장학금 (100%)
    if (prevGpa >= 3.8) return Math.round(base * 0.5); // 반액 장학금 (50%)
    if (prevGpa >= 3.5) return Math.round(base * 0.25); // 성적 우수 장학금 (25%)
    return 0;
  }

  // 학비 납부 처리 (다이아·은수저는 전액 지원)
  MYPayTuition(player, semesterId, prevGpa = null) {
    if (this.paidTuitionSemesters.has(semesterId)) {
      return {
        isBankrupt: false,
        alreadyPaid: true,
        paidAmount: 0,
        scholarship: 0,
        supportedBySpoon: false,
      };
    }

    if (player.spoon?.id === 'diamond' || player.spoon?.id === 'silver') {
      this.paidTuitionSemesters.add(semesterId);
      return {
        isBankrupt: false,
        alreadyPaid: false,
        paidAmount: 0,
        scholarship: 0,
        supportedBySpoon: true,
      };
    }

    const scholarship = this.MYCalculateScholarship(prevGpa);
    const amount = Math.max(0, MY_ECONOMY_RULES.baseTuition - scholarship);

    if (player.money < amount) {
      return {
        isBankrupt: true,
        alreadyPaid: false,
        paidAmount: 0,
        scholarship,
        supportedBySpoon: false,
        reason: `[${semesterId}] 학비(${amount.toLocaleString()}원)를 납부할 소지금이 부족해 파산했습니다.`,
      };
    }

    if (amount > 0) {
      player.MYApplyDelta({ money: -amount });
    }
    this.paidTuitionSemesters.add(semesterId);

    return {
      isBankrupt: false,
      alreadyPaid: false,
      paidAmount: amount,
      scholarship,
      supportedBySpoon: false,
    };
  }
}