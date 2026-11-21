// src/logic/MYTraitPolicy.js

export class MYTraitPolicy {
  // 활동별 후보 수행 방식과 점수 계산 (상태·일정 기반)
  MYScoreModes(activityId, playerState, context = {}) {
    const { health, stress, money } = playerState;
    const {
      hasAssignment = false,
      isAssignmentDone = false,
      weeksToAssignment = 99,
      weeksToExam = 99,
    } = context;

    const candidates = [];

    if (activityId === 'study') {
      candidates.push({
        modeId: 'balanced',
        label: '균형 학습',
        score: 10,
        reason: '전반적인 상태가 안정적이어서 균형 있게 공부했습니다.',
      });

      if (hasAssignment && !isAssignmentDone) {
        let score = 15;
        let reason = '미완료 과제를 진행하기 위해 과제를 우선했습니다.';
        if (weeksToAssignment <= 2) {
          score += 25;
          reason = '과제 마감이 가까워 과제를 우선했습니다.';
        }
        candidates.push({ modeId: 'assignment_first', label: '과제 우선', score, reason });
      }

      const reviewScore = weeksToExam <= 2 ? 20 : 5;
      const reviewReason =
        weeksToExam <= 2
          ? '시험이 임박하여 꼼꼼하게 복습했습니다.'
          : '완벽한 이해를 위해 꼼꼼하게 복습했습니다.';
      candidates.push({
        modeId: 'thorough_review',
        label: '꼼꼼한 복습',
        score: reviewScore,
        reason: reviewReason,
      });

      let easyScore = 0;
      let easyReason = '무리하지 않기 위해 쉬어가며 공부했습니다.';
      if (health <= 30) {
        easyScore += 40;
        easyReason = '체력이 낮아 쉬어가며 공부했습니다.';
      }
      if (stress >= 70) {
        easyScore += 30;
        easyReason = '스트레스가 높아 쉬어가며 공부했습니다.';
      }
      candidates.push({
        modeId: 'easy_study',
        label: '쉬어가며 공부',
        score: easyScore,
        reason: easyReason,
      });
    } else if (activityId === 'partTime') {
      candidates.push({
        modeId: 'normal_work',
        label: '보통 근무',
        score: 10,
        reason: '평소 페이스로 아르바이트를 진행했습니다.',
      });

      let pacedScore = 0;
      let pacedReason = '부담을 줄이기 위해 강도를 조절해 일했습니다.';
      if (health <= 30) {
        pacedScore += 40;
        pacedReason = '체력이 낮아 강도를 조절하며 일했습니다.';
      }
      if (stress >= 70) {
        pacedScore += 30;
        pacedReason = '스트레스가 높아 강도를 조절하며 일했습니다.';
      }
      candidates.push({
        modeId: 'paced_work',
        label: '강도 조절 알바',
        score: pacedScore,
        reason: pacedReason,
      });
    } else if (activityId === 'leisure') {
      candidates.push({
        modeId: 'normal_leisure',
        label: '기본 여가',
        score: 10,
        reason: '충분히 즐기며 여가 시간을 보냈습니다.',
      });

      let lightScore = 0;
      let lightReason = '가볍게 기분 전환을 했습니다.';
      if (health <= 30) {
        lightScore += 20;
        lightReason = '체력이 부족해 가벼운 여가를 선택했습니다.';
      }
      if (money < 600000) {
        lightScore += 20;
        lightReason = '소지금이 부족해 비용이 적은 가벼운 여가를 선택했습니다.';
      }
      candidates.push({
        modeId: 'light_leisure',
        label: '가벼운 여가',
        score: lightScore,
        reason: lightReason,
      });
    } else if (activityId === 'rest') {
      const sleepScore = Math.max(0, 80 - health);
      candidates.push({
        modeId: 'sleep_focus',
        label: '수면 중심',
        score: sleepScore,
        reason: '체력 회복을 위해 잠을 푹 잤습니다.',
      });

      candidates.push({
        modeId: 'mind_care',
        label: '마음 정리',
        score: stress,
        reason: '스트레스 해소를 위해 마음을 정리하며 쉬었습니다.',
      });
    }

    return candidates;
  }

  // 최고점 수행 방식 선택 (동점은 앞선 후보 우선)
  MYSelectMode(activityId, playerState, context = {}) {
    const candidates = this.MYScoreModes(activityId, playerState, context);
    if (candidates.length === 0) return null;

    let best = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
      if (candidates[i].score > best.score) {
        best = candidates[i];
      }
    }
    return best;
  }
}