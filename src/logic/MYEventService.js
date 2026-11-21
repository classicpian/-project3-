// src/logic/MYEventService.js

export class MYEventService {
  constructor() {
    this.weeksWithoutLeisure = 0; // 여가 미수행 연속 주차
    this.awards = [];             // 대회 수상 및 자격증 기록
    this.eventHistory = [];
  }

  // 여가 수행 여부에 따라 카운트 갱신
  MYTrackLeisure(activityId) {
    if (activityId === 'leisure') {
      this.weeksWithoutLeisure = 0;
    } else {
      this.weeksWithoutLeisure += 1;
    }
  }

  // 과로 판정: 체력 40 이하일 때 (40 - 체력) * 2.5% 확률
  MYCheckOverwork(player, randomValue = Math.random()) {
    if (player.health > 40) return { triggered: false };

    const prob = ((40 - player.health) * 2.5) / 100;
    if (randomValue < prob) {
      this.eventHistory.push({ type: 'OVERWORK', health: player.health });
      return {
        triggered: true,
        type: 'OVERWORK',
        message: '체력 저하로 과로가 발생했습니다! 다음 주는 강제로 휴식합니다.',
      };
    }
    return { triggered: false };
  }

  // 이별 판정: 여가 8주 이상 미수행 시 (3달 차 50%, 4달 차 100%), 게임 내 1회만 발생
  MYCheckBreakup(player, randomValue = Math.random()) {
    if (player.isBrokenUp) return { triggered: false };

    let prob = 0;
    if (this.weeksWithoutLeisure >= 16) prob = 1.0;      // 4달 차 100%
    else if (this.weeksWithoutLeisure >= 12) prob = 0.5; // 3달 차 50%

    if (prob > 0 && randomValue < prob) {
      player.isBrokenUp = true; // 재발 방지 락
      player.MYApplyDelta({ health: -30, stress: 60 });
      this.eventHistory.push({ type: 'BREAKUP' });
      return {
        triggered: true,
        type: 'BREAKUP',
        message: '여가 시간이 너무 부족해 연인과 이별했습니다. (체력 -30, 스트레스 +60)',
      };
    }
    return { triggered: false };
  }

  // 군대 이벤트 (남성 캐릭터 자율 선택, 1회 한정)
  MYApplyMilitary(player) {
    if (player.gender !== 'male' || player.isMilitaryDone) {
      return { ok: false, reason: '군대 이벤트를 진행할 수 없는 상태입니다.' };
    }

    player.isMilitaryDone = true;
    player.maxHealth = 120;
    player.health = 120;
    player.stress = 0;
    player.intelligence = Number((player.intelligence * 0.7).toFixed(1)); // 지능 30% 감소
    player.MYApplyDelta({ money: 6000000 }); // 군 적금 600만 원

    this.eventHistory.push({ type: 'MILITARY' });
    return {
      ok: true,
      message: '군 복무를 마치고 복학했습니다! (소지금 +600만, 최대 체력 120, 스트레스 0, 지능 -30%)',
    };
  }

  // 대회/해커톤 결과 판정
  MYResolveCompetition(player, compId, requiredIntelligence) {
    if (player.intelligence >= requiredIntelligence) {
      const prize = 1000000;
      player.MYApplyDelta({ money: prize, intelligence: 20, health: -15 });
      this.awards.push(compId);
      return {
        won: true,
        message: `대회(${compId})에서 수상했습니다! (상금 100만 원, 지능 +20)`,
      };
    }
    player.MYApplyDelta({ health: -15, stress: 15 });
    return {
      won: false,
      message: `대회(${compId})에서 아쉽게 탈락했습니다. (체력 -15, 스트레스 +15)`,
    };
  }
}