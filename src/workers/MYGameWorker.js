// src/workers/MYGameWorker.js

import { MYGameEngine } from '../logic/MYGameEngine.js';

let engine = null;
let revision = 0;

function sendState(requestId, result = null) {
  self.postMessage({
    type: 'STATE',
    requestId,
    revision,
    state: engine.MYExportState(),
    date: engine.calendar.MYGetDate(),
    result,
  });
}

function sendError(requestId, reason) {
  self.postMessage({
    type: 'ERROR',
    requestId,
    revision,
    reason,
  });
}

self.onmessage = (event) => {
  const { type, requestId, payload = {} } = event.data || {};

  try {
    if (type === 'INIT') {
      engine = new MYGameEngine(payload.gender || 'male');
      revision += 1;
      const sp = engine.player.spoon;
      sendState(requestId, {
        message: `🎲 출생 수저 배정: ${sp.label} (${sp.desc})`,
      });
      return;
    }

    if (type === 'LOAD') {
      const saved = payload.savedState;
      if (!saved || !saved.player) {
        sendError(requestId, '저장된 게임 데이터가 없습니다.');
        return;
      }

      engine = new MYGameEngine(saved.player.gender || 'male');
      engine.calendar.elapsedWeek = saved.elapsedWeek || 0;
      Object.assign(engine.player, saved.player);
      engine.restrictedNextWeek = Boolean(saved.restrictedNextWeek);
      engine.currentMidScore = saved.currentMidScore || 0;
      engine.shopService.inventory = saved.inventory || {};
      engine.shopService.permanentItems = saved.permanentItems || [];
      engine.shopService.activeEffects = {
        gptPlusWeeksLeft: 0,
        jokboActive: false,
        pendingCertId: null,
        toeicPending: false,
        ...(saved.activeEffects || {}),
      };
      engine.examService.academicRecords = saved.academicRecords || [];
      engine.eventService.awards = saved.awards || [];

      revision += 1;
      sendState(requestId, { message: '저장된 게임을 불러왔습니다.' });
      return;
    }

    if (!engine) {
      sendError(requestId, '먼저 게임을 시작해 주세요.');
      return;
    }

    if (type === 'RUN_WEEK') {
      const res = engine.MYRunWeek(payload.activityId);
      if (res.status === 'ERROR') {
        sendError(requestId, res.reason);
        return;
      }
      revision += 1;

      if (res.status === 'WAIT_EXAM') {
        self.postMessage({
          type: 'WAIT_EXAM',
          requestId,
          revision,
          exam: res.exam,
          logs: res.logs || [],
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
        endings: res.endings || [],
      });
      return;
    }

    if (type === 'SUBMIT_EXAM') {
      const res = engine.MYSubmitExam(payload.answers || []);
      if (res.status === 'ERROR') {
        sendError(requestId, res.reason);
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
        endings: res.endings || [],
      });
      return;
    }

    if (type === 'BUY') {
      const date = engine.calendar.MYGetDate();
      const res = engine.shopService.MYBuyItem(engine.player, payload.itemId, {
        isVacation: date.isVacation,
        academicYear: date.academicYear,
        awards: engine.eventService.awards,
        hiddenUnlocked: Boolean(payload.hiddenUnlocked),
      });
      if (!res.ok) {
        sendError(requestId, res.reason);
        return;
      }
      revision += 1;
      sendState(requestId, res);
      return;
    }

    if (type === 'USE_ITEM') {
      const res = engine.shopService.MYUseItem(engine.player, payload.itemId);
      if (!res.ok) {
        sendError(requestId, res.reason);
        return;
      }
      revision += 1;
      sendState(requestId, res);
      return;
    }

    if (type === 'MILITARY') {
      const res = engine.MYTriggerMilitary();
      if (!res.ok) {
        sendError(requestId, res.reason);
        return;
      }
      revision += 1;
      sendState(requestId, res);
      return;
    }

    if (type === 'COMPETITION') {
      const res = engine.MYRunCompetition(payload.compId || 'HACKATHON');
      if (!res.ok) {
        sendError(requestId, res.reason);
        return;
      }
      revision += 1;
      sendState(requestId, res);
      return;
    }

    sendError(requestId, `알 수 없는 명령입니다: ${type}`);
  } catch (err) {
    sendError(requestId, err?.message || '워커 실행 중 오류가 발생했습니다.');
  }
};