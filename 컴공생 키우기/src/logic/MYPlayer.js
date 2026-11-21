// src/logic/MYPlayer.js

export class MYPlayer {
  constructor(gender = 'male', initialMoney = 0) {
    this.gender = gender;
    this.health = 100;
    this.maxHealth = 100;
    this.intelligence = 0;
    this.stress = 0;
    this.money = initialMoney;
    this.toeicScore = 0;
    this.isBrokenUp = false;
    this.isMilitaryDone = false;
  }

  // 스탯 변화량 적용 및 범위 보정
  MYApplyDelta(delta = {}) {
    if (delta.maxHealth) {
      this.maxHealth = Math.max(10, Math.round((this.maxHealth + delta.maxHealth) * 10) / 10);
    }
    if (delta.health) {
      this.health = Math.min(
        this.maxHealth,
        Math.max(0, Math.round((this.health + delta.health) * 10) / 10)
      );
    }
    if (delta.intelligence) {
      this.intelligence = Math.max(
        0,
        Math.round((this.intelligence + delta.intelligence) * 10) / 10
      );
    }
    if (delta.stress) {
      this.stress = Math.min(100, Math.max(0, Math.round((this.stress + delta.stress) * 10) / 10));
    }
    if (delta.money) {
      this.money = Math.round(this.money + delta.money);
    }
  }

  // 현재 상태 스냅샷 반환
  MYGetState() {
    return {
      gender: this.gender,
      health: this.health,
      maxHealth: this.maxHealth,
      intelligence: this.intelligence,
      stress: this.stress,
      money: this.money,
      toeicScore: this.toeicScore,
      isBrokenUp: this.isBrokenUp,
      isMilitaryDone: this.isMilitaryDone,
    };
  }
}