// src/logic/MYShopService.js

// 학년별 영구 아이템 인플레이션 배율
export const MY_INFLATION_RATES = {
  1: 1.0,
  2: 1.25,
  3: 1.5,
  4: 2.0,
};

export const MY_SHOP_ITEMS = {
  // 1. 소모품
  energy_drink: {
    id: 'energy_drink',
    name: '에너지 드링크',
    price: 5000,
    type: 'consumable',
    weeklyLimit: 2,
    effect: { health: 15, stress: 10 },
  },
  iseul_cham: {
    id: 'iseul_cham',
    name: '이슬(참)',
    price: 30000,
    type: 'consumable',
    weeklyLimit: 1,
    effect: { health: -20, stress: -30 },
  },

  // 2. 기간제 / 1회성 버프
  gpt_plus: {
    id: 'gpt_plus',
    name: 'GPT Plus (4주)',
    price: 30000,
    type: 'buff',
  },
  jokbo: {
    id: 'jokbo',
    name: '족보',
    price: 50000,
    type: 'buff',
  },

  // 3. 영구 아이템 (2학년부터 인플레이션 적용)
  gemini_sub: {
    id: 'gemini_sub',
    name: '제미나이 영구 구독',
    price: 300000,
    type: 'permanent',
  },
  living_set: {
    id: 'living_set',
    name: '자취 세트',
    price: 300000,
    type: 'permanent',
  },
  herman_miller: {
    id: 'herman_miller',
    name: '허먼밀러 의자',
    price: 500000,
    type: 'permanent',
  },
  new_pc: {
    id: 'new_pc',
    name: '최신형 컴퓨터',
    price: 1200000,
    type: 'permanent',
  },
  ai_glasses: {
    id: 'ai_glasses',
    name: '👓 AI 안경 (히든)',
    price: 1000000,
    type: 'permanent',
    isHidden: true,
    fixedPrice: true, // 인플레이션 미적용 (100만 원 고정)
  },

  // 4. 방학 전용 토익 응시권
  toeic_ticket: {
    id: 'toeic_ticket',
    name: '토익 응시권',
    price: 50000,
    type: 'vacation_ticket',
  },

  // 5. 방학 전용 자격증 10종 (입문 1학년~ / 중급 2학년~ / 고급 3학년~)
  cert_sqld: { id: 'cert_sqld', name: 'SQLD', price: 50000, type: 'cert_ticket', minYear: 1 },
  cert_adsp: { id: 'cert_adsp', name: 'ADsP', price: 50000, type: 'cert_ticket', minYear: 1 },
  cert_linux2: { id: 'cert_linux2', name: '리눅스마스터 2급', price: 50000, type: 'cert_ticket', minYear: 1 },
  cert_net2: { id: 'cert_net2', name: '네트워크관리사 2급', price: 50000, type: 'cert_ticket', minYear: 1 },
  cert_linux1: { id: 'cert_linux1', name: '리눅스마스터 1급', price: 50000, type: 'cert_ticket', minYear: 2 },
  cert_aws_saa: { id: 'cert_aws_saa', name: 'AWS SAA', price: 50000, type: 'cert_ticket', minYear: 2 },
  cert_eip_ind: { id: 'cert_eip_ind', name: '정보처리산업기사', price: 50000, type: 'cert_ticket', minYear: 2 },
  cert_eip: { id: 'cert_eip', name: '정보처리기사', price: 50000, type: 'cert_ticket', minYear: 3 },
  cert_bigdata: { id: 'cert_bigdata', name: '빅데이터분석기사', price: 50000, type: 'cert_ticket', minYear: 3 },
  cert_security: { id: 'cert_security', name: '정보보안기사', price: 50000, type: 'cert_ticket', minYear: 3 },
};

export class MYShopService {
  constructor() {
    this.inventory = {};
    this.permanentItems = [];
    this.weeklyUseCount = {};
    this.activeEffects = {
      gptPlusWeeksLeft: 0,
      jokboActive: false,
      pendingCertId: null, // 다음 주 응시할 자격증 ID
      toeicPending: false,
    };
  }

  // 학년별 인플레이션이 반영된 실제 가격 계산 (fixedPrice 아이템은 고정가)
  MYGetItemPrice(itemId, academicYear = 1) {
    const item = MY_SHOP_ITEMS[itemId];
    if (!item) return 0;
    if (item.type === 'permanent' && !item.fixedPrice) {
      const rate = MY_INFLATION_RATES[academicYear] || 2.0;
      return Math.round(item.price * rate);
    }
    return item.price;
  }

  // 현재 학년 기준 영구 아이템 가격표 반환 (UI 표시용)
  MYGetPermanentPriceMap(academicYear = 1) {
    const map = {};
    Object.values(MY_SHOP_ITEMS).forEach((item) => {
      if (item.type === 'permanent') {
        map[item.id] = this.MYGetItemPrice(item.id, academicYear);
      }
    });
    return map;
  }

  MYBuyItem(player, itemId, context = {}) {
    const item = MY_SHOP_ITEMS[itemId];
    if (!item) {
      return { ok: false, reason: '존재하지 않는 아이템입니다.' };
    }

    const {
      isVacation = false,
      academicYear = 1,
      awards = [],
      hiddenUnlocked = false,
    } = context;

    if (item.isHidden && !hiddenUnlocked) {
      return {
        ok: false,
        reason: '엔딩을 1회 이상 달성해야 구매할 수 있는 히든 아이템입니다.',
      };
    }

    if (item.type === 'permanent' && this.permanentItems.includes(itemId)) {
      return { ok: false, reason: `이미 보유 중인 영구 아이템입니다: ${item.name}` };
    }

    if (itemId === 'jokbo' && this.activeEffects.jokboActive) {
      return { ok: false, reason: '이미 족보 효과가 활성화되어 있습니다.' };
    }

    if ((item.type === 'vacation_ticket' || item.type === 'cert_ticket') && !isVacation) {
      return { ok: false, reason: `${item.name}은(는) 방학 기간에만 신청할 수 있습니다.` };
    }

    if (item.type === 'cert_ticket') {
      if (item.minYear && academicYear < item.minYear) {
        return { ok: false, reason: `${item.name}은(는) ${item.minYear}학년부터 응시할 수 있습니다.` };
      }
      if (awards.includes(itemId)) {
        return { ok: false, reason: `이미 취득한 자격증입니다: ${item.name}` };
      }
      if (this.activeEffects.pendingCertId) {
        const pendingName = MY_SHOP_ITEMS[this.activeEffects.pendingCertId]?.name || '자격증';
        return { ok: false, reason: `이미 [${pendingName}] 시험이 접수되어 있습니다.` };
      }
    }

    if (itemId === 'toeic_ticket' && this.activeEffects.toeicPending) {
      return { ok: false, reason: '이미 이번 방학 토익 시험이 접수되어 있습니다.' };
    }

    const finalPrice = this.MYGetItemPrice(itemId, academicYear);
    if (player.money < finalPrice) {
      return { ok: false, reason: `소지금이 부족합니다. (필요: ${finalPrice.toLocaleString()}원)` };
    }

    player.MYApplyDelta({ money: -finalPrice });

    if (item.type === 'consumable') {
      this.inventory[itemId] = (this.inventory[itemId] || 0) + 1;
      return { ok: true, item, message: `${item.name} 구매 완료 (보유: ${this.inventory[itemId]}개)` };
    }

    if (item.type === 'permanent') {
      this.permanentItems.push(itemId);
      if (itemId === 'ai_glasses') {
        return {
          ok: true,
          item,
          message: `👓 ${item.name} 구매 완료! 이제 모든 시험에서 정답이 보입니다. (단, 시험마다 10% 확률로 부정행위 적발 시 즉시 퇴학!)`,
        };
      }
      return {
        ok: true,
        item,
        message: `${item.name} 구매 완료 (${finalPrice.toLocaleString()}원)! 영구 효과가 적용됩니다.`,
      };
    }

    if (itemId === 'gpt_plus') {
      this.activeEffects.gptPlusWeeksLeft += 4;
      return { ok: true, item, message: `GPT Plus 구매 완료 (남은 기간: ${this.activeEffects.gptPlusWeeksLeft}주)` };
    }

    if (itemId === 'jokbo') {
      this.activeEffects.jokboActive = true;
      return { ok: true, item, message: '족보 구매 완료! 다음 시험 요구 지능이 10 감소합니다.' };
    }

    if (item.type === 'cert_ticket') {
      this.activeEffects.pendingCertId = itemId;
      return { ok: true, item, message: `[${item.name}] 접수 완료! 다음 주에 자격증 시험(4문제, 3문제 이상 합격)을 치릅니다.` };
    }

    if (itemId === 'toeic_ticket') {
      this.activeEffects.toeicPending = true;
      return { ok: true, item, message: '토익 응시권 구매 완료! 이번 방학 마지막 주에 토익 시험을 치릅니다.' };
    }

    return { ok: true, item, message: `${item.name} 구매 완료` };
  }

  MYUseItem(player, itemId) {
    const item = MY_SHOP_ITEMS[itemId];
    if (!item || item.type !== 'consumable') {
      return { ok: false, reason: '사용할 수 없는 아이템입니다.' };
    }

    const count = this.inventory[itemId] || 0;
    if (count <= 0) {
      return { ok: false, reason: `보유 중인 ${item.name}이(가) 없습니다.` };
    }

    const used = this.weeklyUseCount[itemId] || 0;
    if (item.weeklyLimit && used >= item.weeklyLimit) {
      return { ok: false, reason: `${item.name}은(는) 주당 최대 ${item.weeklyLimit}회만 사용할 수 있습니다.` };
    }

    this.inventory[itemId] = count - 1;
    this.weeklyUseCount[itemId] = used + 1;
    player.MYApplyDelta(item.effect);

    return {
      ok: true,
      item,
      message: `${item.name} 사용 완료! (남은 개수: ${this.inventory[itemId]}개)`,
    };
  }

  MYResetWeeklyLimits() {
    this.weeklyUseCount = {};
    if (this.activeEffects.gptPlusWeeksLeft > 0) {
      this.activeEffects.gptPlusWeeksLeft -= 1;
    }
  }
}