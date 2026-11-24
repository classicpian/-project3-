// src/logic/MYActivityService.js

export const MY_ACTIVITY_RULES = {
  study: { health: -15, intelligence: 20, stress: 15, money: 0 },
  partTime: { health: -15, intelligence: 0, stress: 15, money: 600000 },
  leisure: { health: 30, intelligence: 0, stress: -30, money: -100000 },
  rest: { health: 20, intelligence: 0, stress: -15, money: 0 },
};

const MY_MODE_MULTIPLIERS = {
  balanced_study: { health: 1.0, intelligence: 1.0, stress: 1.0, money: 1.0 },
  assignment_focus: { health: 1.0, intelligence: 0.8, stress: 1.1, money: 1.0 },
  deep_review: { health: 1.2, intelligence: 1.25, stress: 1.2, money: 1.0 },
  light_study: { health: 0.6, intelligence: 0.7, stress: 0.5, money: 1.0 },
  normal_work: { health: 1.0, intelligence: 1.0, stress: 1.0, money: 1.0 },
  safe_work: { health: 0.7, intelligence: 1.0, stress: 0.7, money: 0.85 },
  normal_leisure: { health: 1.0, intelligence: 1.0, stress: 1.0, money: 1.0 },
  light_leisure: { health: 0.8, intelligence: 1.0, stress: 0.7, money: 0.5 },
  sleep_rest: { health: 1.3, intelligence: 1.0, stress: 0.8, money: 1.0 },
  mental_rest: { health: 0.8, intelligence: 1.0, stress: 1.4, money: 1.0 },
};

export class MYActivityService {
  MYEvaluateActivity(activityId, selectedMode, playerState, permanentItems = []) {
    const base = MY_ACTIVITY_RULES[activityId];
    if (!base) {
      throw new Error(`알 수 없는 활동입니다: ${activityId}`);
    }

    const mult = MY_MODE_MULTIPLIERS[selectedMode.id] || {
      health: 1.0,
      intelligence: 1.0,
      stress: 1.0,
      money: 1.0,
    };

    let health = base.health * mult.health;
    let intelligence = base.intelligence * mult.intelligence;
    let stress = base.stress * mult.stress;
    let money = base.money * mult.money;

    if (playerState.stress >= 70) {
      if (activityId === 'study' && intelligence > 0) {
        intelligence *= 0.8;
      }
      if (activityId === 'partTime' && money > 0) {
        money *= 0.8;
      }
    }

    if (permanentItems.includes('gemini_sub') && activityId === 'study') {
      intelligence *= 1.2;
    }
    if (permanentItems.includes('living_set') && activityId === 'rest') {
      health *= 1.2;
    }
    if (permanentItems.includes('herman_miller') && health < 0) {
      health *= 0.8;
    }
    if (permanentItems.includes('new_pc') && activityId === 'study') {
      intelligence *= 1.3;
      stress *= 0.85;
    }

    return {
      activityId,
      mode: selectedMode,
      delta: {
        health: Math.round(health * 10) / 10,
        intelligence: Math.round(intelligence * 10) / 10,
        stress: Math.round(stress * 10) / 10,
        money: Math.round(money),
      },
    };
  }

  MYApplyResult(player, evalRes) {
    player.MYApplyDelta(evalRes.delta);
    return {
      activityId: evalRes.activityId,
      mode: evalRes.mode,
      delta: evalRes.delta,
      playerAfter: player.MYGetState(),
    };
  }
}