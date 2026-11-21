// src/workers/MYAdvisorWorker.js

class MYAdvisor {
  // 읽기 전용 상태 사본 분석 (게임 상태 변경 금지)
  MYAnalyzeSnapshot(snapshot, date) {
    const tips = [];
    if (!snapshot || !snapshot.player) return tips;

    const { health, stress, money } = snapshot.player;
    const reqInt = snapshot.examThreshold !== undefined ? ` (요구 지능: ${snapshot.examThreshold})` : '';

    // 1. 체력 및 과로 위험 안내
    if (health <= 30) {
      tips.push('⚠️ 체력이 매우 낮습니다. 과로 위험이 크니 휴식을 권장합니다.');
    } else if (health <= 40) {
      tips.push('⚡ 체력이 40 이하입니다. 과로 이벤트가 발생할 수 있습니다.');
    }

    // 2. 스트레스 경고
    if (stress >= 70) {
      tips.push('🔥 스트레스가 높습니다. 공부·알바 효율이 감소할 수 있으니 여가를 고려하세요.');
    }

    // 3. 경제(월세) 경고
    if (money < 600000) {
      tips.push('💸 소지금이 월세(600,000원)보다 부족합니다. 월말 전 아르바이트가 필요합니다.');
    }

    // 4. 일정 안내
    if (date && !date.isGraduated) {
      if (date.weekInMonth === 4) {
        tips.push('📅 이번 주는 월말 정산(월세 600,000원 납부) 주차입니다.');
      }
      if (
        date.isVacation &&
        (date.month === 8 || date.month === 2) &&
        date.weekInMonth === 4 &&
        !(date.academicYear === 4 && date.month === 2)
      ) {
        tips.push('🏫 다음 주(새 학기 1주차)가 시작되면 학비가 자동 납부됩니다.');
      }
      if ((date.month === 4 || date.month === 10) && date.weekInMonth === 3) {
        tips.push(`📝 다음 주는 중간고사 주차입니다.${reqInt}`);
      }
      if ((date.month === 6 || date.month === 12) && date.weekInMonth === 3) {
        tips.push(`📝 다음 주는 기말고사 및 과제 마감 주차입니다.${reqInt}`);
      }
      if (date.isVacation && snapshot.activeEffects?.toeicPending) {
        tips.push(`📘 토익 시험 접수 완료! 이번 방학 마지막 주에 응시합니다.${reqInt}`);
      }
    }

    if (tips.length === 0) {
      tips.push('✅ 현재 상태가 안정적입니다. 목표에 맞춰 일정을 진행하세요.');
    }

    return tips;
  }
}

const advisor = new MYAdvisor();

self.onmessage = function MYHandleAdvisorMessage(event) {
  const { type, revision, snapshot, date } = event.data;

  if (type === 'ANALYZE') {
    const advice = advisor.MYAnalyzeSnapshot(snapshot, date);
    self.postMessage({
      type: 'ADVICE',
      revision,
      advice,
    });
  }
};