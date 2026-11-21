// src/logic/MYShopService.js

export const MY_SHOP_ITEMS = {
  // 1. 소모품 (구매 후 인벤토리 보관 -> 사용 시 효과 발동)
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
    effect: { health: -25, stress: -30 },
  },

  // 2. 기간제 / 1회성 버프 (구매 즉시 적용)
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

  // 3. 영구 아이템 (1회만 구매 가능)
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

  // 4. 방학 전용 시험 응시권
  cert_ticket: {
    id: 'cert_ticket',
    name: '자격증 접수권',
    price: 50000,
    type: 'vacation_ticket',
  },
  toeic_ticket: {
    id: 'toeic_ticket',
    name: '토익 응시권',
    price: 50000,
    type: 'vacation_ticket',
  },
};

export class MYShopService {
  constructor() {
    this.inventory = {}; // { itemId: count }
    this.permanentItems = []; // ['herman_miller', ...]
    this.weeklyUseCount = {}; // { itemId: usedCountThisWeek }
    this.activeEffects = {
      gptPlusWeeksLeft: 0,
      jokboActive: false,
      certPending: false,
      toeicPending: false, // 방학 마지막 주 토익 시험 대기 여부
    };
  }

  // 아이템 구매
  MYBuyItem(player, itemId, context = {}) {
    const item = MY_SHOP_ITEMS[itemId];
    if (!item) {
      return { ok: false, reason: '존재하지 않는 아이템입니다.' };
    }

    const { isVacation = false, hasCertification = false } = context;

    // 1. 영구 아이템 중복 구매 차단
    if (item.type === 'permanent' && this.permanentItems.includes(itemId)) {
      return { ok: false, reason: `이미 보유 중인 영구 아이템입니다: ${item.name}` };
    }

    // 2. 족보 중복 구매 차단
    if (itemId === 'jokbo' && this.activeEffects.jokboActive) {
      return { ok: false, reason: '이미 족보 효과가 활성화되어 있습니다.' };
    }

    // 3. 방학 전용 응시권(자격증, 토익) 조건 검사
    if (item.type === 'vacation_ticket' && !isVacation) {
      return { ok: false, reason: `${item.name}은(는) 방학 기간에만 구매할 수 있습니다.` };
    }
    if (itemId === 'cert_ticket') {
      if (hasCertification) {
        return { ok: false, reason: '이미 자격증을 취득했습니다.' };
      }
      if (this.activeEffects.certPending) {
        return { ok: false, reason: '이미 자격증 시험 응시가 접수되어 있습니다.' };
      }
    }
    if (itemId === 'toeic_ticket' && this.activeEffects.toeicPending) {
      return { ok: false, reason: '이미 이번 방학 토익 시험이 접수되어 있습니다.' };
    }

    // 4. 소지금 검사
    if (player.money < item.price) {
      return { ok: false, reason: `소지금이 부족합니다. (필요: ${item.price.toLocaleString()}원)` };
    }

    // 5. 결제 및 효과/보관 처리
    player.MYApplyDelta({ money: -item.price });

    if (item.type === 'consumable') {
      this.inventory[itemId] = (this.inventory[itemId] || 0) + 1;
      return { ok: true, item, message: `${item.name} 구매 완료 (보유: ${this.inventory[itemId]}개)` };
    }

    if (item.type === 'permanent') {
      this.permanentItems.push(itemId);
      return { ok: true, item, message: `${item.name} 구매 완료! 영구 효과가 적용됩니다.` };
    }

    if (itemId === 'gpt_plus') {
      this.activeEffects.gptPlusWeeksLeft += 4;
      return { ok: true, item, message: `GPT Plus 구매 완료 (남은 기간: ${this.activeEffects.gptPlusWeeksLeft}주)` };
    }

    if (itemId === 'jokbo') {
      this.activeEffects.jokboActive = true;
      return { ok: true, item, message: '족보 구매 완료! 다음 시험 요구 지능이 10 감소합니다.' };
    }

    if (itemId === 'cert_ticket') {
      this.activeEffects.certPending = true;
      return { ok: true, item, message: '자격증 접수 완료! 다음 주에 합격 여부가 판정됩니다.' };
    }

    if (itemId === 'toeic_ticket') {
      this.activeEffects.toeicPending = true;
      return { ok: true, item, message: '토익 응시권 구매 완료! 이번 방학 마지막 주에 토익 시험을 치릅니다.' };
    }

    return { ok: true, item, message: `${item.name} 구매 완료` };
  }

  // 소모품 사용
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

  // 주간 사용 제한 초기화 및 기간제 버프 차감
  MYResetWeeklyLimits() {
    this.weeklyUseCount = {};
    if (this.activeEffects.gptPlusWeeksLeft > 0) {
      this.activeEffects.gptPlusWeeksLeft -= 1;
    }
  }
}