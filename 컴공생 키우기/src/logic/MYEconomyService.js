// src/logic/MYEconomyService.js

export class MYEconomyService {
  constructor(tuition = 2000000, monthlyRent = 600000) {
    this.tuition = tuition;           // 기본 학기 학비
    this.monthlyRent = monthlyRent;   // 고정 월세
    this.paymentRecords = {
      tuition: {}, // { '1-1': true, ... }
      rent: {},    // { '1-3': true, ... } (학년-월)
    };
  }

  // 직전 학기 평점 기반 장학금 감면액 계산
  MYCalculateScholarship(prevGpa, isFirstSemester) {
    if (isFirstSemester || prevGpa === null) return 0;
    if (prevGpa >= 4.3) return this.tuition;        // 전액 장학금
    if (prevGpa >= 4.0) return this.tuition * 0.5;  // 반액 장학금
    if (prevGpa >= 3.5) return this.tuition * 0.25; // 일부 감면
    return 0;
  }

  // 학기 초 학비 납부
  MYPayTuition(player, semesterId, prevGpa = null) {
    if (this.paymentRecords.tuition[semesterId]) {
      return { ok: true, alreadyPaid: true, paidAmount: 0, isBankrupt: false };
    }

    const isFirstSemester = semesterId === '1-1';
    const scholarship = this.MYCalculateScholarship(prevGpa, isFirstSemester);
    const finalTuition = Math.max(0, this.tuition - scholarship);

    // 납부액과 잔액이 같으면 0원으로 정상 납부, 부족하면 파산
    if (player.money < finalTuition) {
      return {
        ok: false,
        isBankrupt: true,
        reason: '학비 납부액 부족으로 파산했습니다.',
        shortage: finalTuition - player.money,
      };
    }

    player.MYApplyDelta({ money: -finalTuition });
    this.paymentRecords.tuition[semesterId] = true;

    return {
      ok: true,
      alreadyPaid: false,
      scholarship,
      paidAmount: finalTuition,
      isBankrupt: false,
    };
  }

  // 월말 월세 납부
  MYPayRent(player, yearMonthKey) {
    if (this.paymentRecords.rent[yearMonthKey]) {
      return { ok: true, alreadyPaid: true, paidAmount: 0, isBankrupt: false };
    }

    if (player.money < this.monthlyRent) {
      return {
        ok: false,
        isBankrupt: true,
        reason: '월세 납부액 부족으로 파산했습니다.',
        shortage: this.monthlyRent - player.money,
      };
    }

    player.MYApplyDelta({ money: -this.monthlyRent });
    this.paymentRecords.rent[yearMonthKey] = true;

    return {
      ok: true,
      alreadyPaid: false,
      paidAmount: this.monthlyRent,
      isBankrupt: false,
    };
  }
}