// src/logic/MYPlayer.js

export const MY_SPOON_TYPES = {
  diamond: { id: 'diamond', label: '💎 다이아 수저', desc: '학비·월세 전액 지원' },
  gold: { id: 'gold', label: '🥇 금수저', desc: '월세 전액 지원' },
  silver: { id: 'silver', label: '🥈 은수저', desc: '학비 전액 지원' },
  dirt: { id: 'dirt', label: '🥉 흙수저', desc: '지원 없음 (자수성가)' },
};

function MYRollSpoon() {
  const r = Math.random() * 100;
  if (r < 5) return MY_SPOON_TYPES.diamond; // 5%
  if (r < 20) return MY_SPOON_TYPES.gold;   // 15% (5~20)
  if (r < 55) return MY_SPOON_TYPES.silver; // 35% (20~55)
  return MY_SPOON_TYPES.dirt;               // 45% (55~100)
}

export class MYPlayer {
  constructor(gender = 'male') {
    this.gender = gender;
    this.health = 100;
    this.maxHealth = 100;
    this.intelligence = 0;
    this.stress = 0;
    this.money = 0;
    this.toeicScore = 0;
    this.spoon = MYRollSpoon();
  }

  MYApplyDelta(delta = {}) {
    if (typeof delta.health === 'number') {
      this.health = Math.max(0, Math.min(this.maxHealth, Math.round((this.health + delta.health) * 10) / 10));
    }
    if (typeof delta.intelligence === 'number') {
      this.intelligence = Math.max(0, Math.round((this.intelligence + delta.intelligence) * 10) / 10);
    }
    if (typeof delta.stress === 'number') {
      this.stress = Math.max(0, Math.min(100, Math.round((this.stress + delta.stress) * 10) / 10));
    }
    if (typeof delta.money === 'number') {
      this.money += Math.round(delta.money);
    }
  }

  MYGetState() {
    return {
      gender: this.gender,
      health: this.health,
      maxHealth: this.maxHealth,
      intelligence: this.intelligence,
      stress: this.stress,
      money: this.money,
      toeicScore: this.toeicScore,
      spoon: this.spoon,
    };
  }
}