// src/workers/MYGameWorker.js

import { MYGameEngine } from '../logic/MYGameEngine.js';

let engine = null;
let revision = 0;

function MYRestoreEngine(saved) {
  const restored = new MYGameEngine(saved.player?.gender || 'male');

  if (typeof saved.elapsedWeek === 'number') {
    restored.calendar.elapsedWeek = saved.elapsedWeek;
  }
  if (saved.player) {
    Object.assign(restored.player, saved.player);
  }
  if (typeof saved.restrictedNextWeek === 'boolean') {
    restored.restrictedNextWeek = saved.restrictedNextWeek;
  }
  if (typeof saved.currentMidScore === 'number') {
    restored.currentMidScore = saved.currentMidScore;
  }
  if (saved.inventory) {
    restored.shopService.inventory = { ...saved.inventory };
  }
  if (Array.isArray(saved.permanentItems)) {
    restored.shopService.permanentItems = [...saved.permanentItems];
  }
  if (saved.activeEffects) {
    restored.shopService.activeEffects = {
      ...restored.shopService.activeEffects,
      ...saved.activeEffects,
    };
  }
  if (Array.isArray(saved.academicRecords)) {
    restored.examService.academicRecords = [...saved.academicRecords];
  }
  if (Array.isArray(saved.awards)) {
    restored.eventService.awards = [...saved.awards];
  }

  return restored;
}

function MYHandleWorkerMessage(event) {
  const { type, requestId, payload = {} } = event.data || {};

  try {
    // 1. 새 게임 시작
    if (type === 'INIT') {
      engine = new MYGameEngine(payload.gender || 'male');
      revision += 1;
      self.postMessage({
        type: 'STATE',
        requestId,
        revision,
        state: engine.MYExportState(),
        date: engine.calendar.MYGetDate(),
      });
      return;
    }

    // 2. 저장된 게임 불러오기
    if (type === 'LOAD') {
      if (!payload.savedState) {
        self.postMessage({
          type: 'ERROR',
          requestId,
          revision,
          reason: '불러올 저장 데이터가 없습니다.',
        });
        return;
      }
      engine = MYRestoreEngine(payload.savedState);
      revision += 1;
      self.postMessage({
        type: 'STATE',
        requestId,
        revision,
        state: engine.MYExportState(),
        date: engine.calendar.MYGetDate(),
        result: { message: '저장된 게임을 불러왔습니다.' },
      });
      return;
    }

    if (!engine) {
      self.postMessage({
        type: 'ERROR',
        requestId,
        revision,
        reason: '먼저 새 게임을 시작하거나 이어하기를 눌러주세요.',
      });
      return;
    }

    // 시험 대기 중에는 답안 제출 외 명령 차단
    if (engine.pendingExam && type !== 'SUBMIT_EXAM') {
      self.postMessage({
        type: 'ERROR',
        requestId,
        revision,
        reason: '시험 답안을 먼저 제출해야 합니다.',
      });
      return;
    }

    // 3. 상점 아이템 구매 (학년별 인플레이션 + 자격증 10종 반영)
    if (type === 'BUY') {
      const date = engine.calendar.MYGetDate();
      const res = engine.shopService.MYBuyItem(engine.player, payload.itemId, {
        isVacation: date.isVacation,
        academicYear: date.academicYear,
        awards: engine.eventService.awards,
      });
      if (!res.ok) {
        self.postMessage({ type: 'ERROR', requestId, revision, reason: res.reason });
        return;
      }
      revision += 1;
      self.postMessage({
        type: 'STATE',
        requestId,
        revision,
        state: engine.MYExportState(),
        date,
        result: res,
      });
      return;
    }

    // 4. 소모품 사용
    if (type === 'USE_ITEM') {
      const res = engine.shopService.MYUseItem(engine.player, payload.itemId);
      if (!res.ok) {
        self.postMessage({ type: 'ERROR', requestId, revision, reason: res.reason });
        return;
      }
      revision += 1;
      self.postMessage({
        type: 'STATE',
        requestId,
        revision,
        state: engine.MYExportState(),
        date: engine.calendar.MYGetDate(),
        result: res,
      });
      return;
    }

    // 5. 군대 입대 이벤트
    if (type === 'MILITARY') {
      const res = engine.MYTriggerMilitary();
      if (!res.ok) {
        self.postMessage({ type: 'ERROR', requestId, revision, reason: res.reason });
        return;
      }
      revision += 1;
      self.postMessage({
        type: 'STATE',
        requestId,
        revision,
        state: engine.MYExportState(),
        date: engine.calendar.MYGetDate(),
        result: res,
      });
      return;
    }

    // 6. 대회 / 해커톤 참가
    if (type === 'COMPETITION') {
      const res = engine.MYRunCompetition(payload.compId || 'HACKATHON');
      if (!res.ok) {
        self.postMessage({ type: 'ERROR', requestId, revision, reason: res.reason });
        return;
      }
      revision += 1;
      self.postMessage({
        type: 'STATE',
        requestId,
        revision,
        state: engine.MYExportState(),
        date: engine.calendar.MYGetDate(),
        result: res,
      });
      return;
    }

    // 7. 주간 활동 실행
    if (type === 'RUN_WEEK') {
      const res = engine.MYRunWeek(payload.activityId);
      if (res.status === 'ERROR') {
        self.postMessage({ type: 'ERROR', requestId, revision, reason: res.reason });
        return;
      }
      revision += 1;
      if (res.status === 'WAIT_EXAM') {
        self.postMessage({
          type: 'WAIT_EXAM',
          requestId,
          revision,
          exam: res.exam,
          logs: res.logs,
        });
        return;
      }
      self.postMessage({
        type: 'WEEK_DONE',
        requestId,
        revision,
        state: engine.MYExportState(),
        date: engine.calendar.MYGetDate(),
        result: res,
        ended: res.status === 'ENDED',
        endings: res.endings || null,
      });
      return;
    }

    // 8. 시험 답안 제출 (전공 / 토익 / 자격증)
    if (type === 'SUBMIT_EXAM') {
      const res = engine.MYSubmitExam(payload.answers);
      if (res.status === 'ERROR') {
        self.postMessage({ type: 'ERROR', requestId, revision, reason: res.reason });
        return;
      }
      revision += 1;
      self.postMessage({
        type: 'WEEK_DONE',
        requestId,
        revision,
        state: engine.MYExportState(),
        date: engine.calendar.MYGetDate(),
        result: res,
        ended: res.status === 'ENDED',
        endings: res.endings || null,
      });
      return;
    }

    self.postMessage({
      type: 'ERROR',
      requestId,
      revision,
      reason: `알 수 없는 명령입니다: ${type}`,
    });
  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      requestId,
      revision,
      reason: err?.message || '워커 처리 중 알 수 없는 오류가 발생했습니다.',
    });
  }
}

self.onmessage = MYHandleWorkerMessage;