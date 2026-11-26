// src/workers/MYGameWorker.js

import { MYGameEngine } from '../logic/MYGameEngine.js';
import {MYValidateSave} from '../logic/MYSaveRepository.js';

let engine = null;
let revision = 0;

// 저장된 스냅샷으로 엔진 상태 복원
function MYRestoreEngineState(savedData) {
  if(!MYValidateSave(savedData))throw new Error('저장 데이터가 올바르지 않습니다.');
  const { player, elapsedWeek } = savedData;
  engine = new MYGameEngine(player.gender || 'male');

  engine.player.spoon = player.spoon || {id:'dirt',label:'흙수저',desc:'지원 없음 (이전 저장)'};
  engine.player.health = player.health;
  engine.player.maxHealth = player.maxHealth;
  engine.player.intelligence = player.intelligence;
  engine.player.stress = player.stress;
  engine.player.money = player.money;
  engine.player.toeicScore = player.toeicScore || 0;
  engine.player.isBrokenUp = player.isBrokenUp;
  engine.player.isMilitaryDone = player.isMilitaryDone;

  engine.calendar.elapsedWeek = elapsedWeek;
  engine.calendar.militaryLeave=savedData.militaryLeave||(player.isMilitaryDone?{week:Math.min(191,elapsedWeek),years:2,migrated:true}:null);
  engine.restrictedNextWeek = savedData.restrictedNextWeek || false;
  engine.currentMidScore = savedData.currentMidScore || 0;
  engine.shopService.inventory = savedData.inventory || {};
  engine.shopService.permanentItems = savedData.permanentItems || [];
  engine.shopService.activeEffects = savedData.activeEffects || {
    gptPlusWeeksLeft: 0,
    jokboActive: false,
    pendingCertId: null,
    toeicPending: false,
  };
  engine.examService.academicRecords = savedData.academicRecords || [];
  engine.eventService.awards = savedData.awards || [];
  engine.assignmentService.semesterScore = savedData.assignmentTotal ?? savedData.assignmentScore ?? 0;
  engine.competitionRecords=savedData.competitionRecords||[];
  engine.economyService.paidRentMonths = new Set(Array.isArray(savedData.paymentRecords?.rent)?savedData.paymentRecords.rent:Object.keys(savedData.paymentRecords?.rent||{}));
  engine.economyService.paidTuitionSemesters = new Set(Array.isArray(savedData.paymentRecords?.tuition)?savedData.paymentRecords.tuition:Object.keys(savedData.paymentRecords?.tuition||{}));
  engine.shopService.weeklyUseCount = savedData.weeklyUseCount || {};
  engine.eventService.weeksWithoutLeisure = savedData.weeksWithoutLeisure || 0;
  engine.eventService.eventHistory = savedData.eventHistory || [];
  engine.endingCandidates = savedData.endingCandidates || null;
}

// 메인 스레드 메시지 처리
function MYHandleWorkerMessage(event) {
  const { type, requestId, payload = {} } = event.data;

  try {
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

    if (type === 'RESTORE') {
      MYRestoreEngineState(payload.savedData);
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

    if (!engine) {
      self.postMessage({
        type: 'ERROR',
        requestId,
        revision,
        reason: '게임 엔진이 초기화되지 않았습니다.',
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

    if(engine.endingCandidates && ['BUY','USE_ITEM','MILITARY','COMPETITION'].includes(type)) {
      self.postMessage({type:'ERROR',requestId,revision,reason:'이미 종료된 게임입니다.'});return;
    }
    if(type==='RUN_WEEK' && !['study','partTime','leisure','rest'].includes(payload.activityId)) {
      self.postMessage({type:'ERROR',requestId,revision,reason:'올바른 활동을 선택해주세요.'});return;
    }
    if(type==='RUN_WEEK' && payload.activityId==='leisure' && !engine.restrictedNextWeek && engine.player.money<100000) {
      self.postMessage({type:'ERROR',requestId,revision,reason:'여가 비용 100,000원이 부족합니다.'});return;
    }
    if (type === 'BUY') {
      const date = engine.calendar.MYGetDate();
      const res = engine.shopService.MYBuyItem(engine.player, payload.itemId, {
        isVacation: date.isVacation,
        academicYear: date.academicYear, awards: engine.eventService.awards, hiddenUnlocked: Boolean(payload.hiddenUnlocked),
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

    if (type === 'RUN_WEEK') {
      const res = engine.MYRunWeek(payload.activityId);
      revision += 1;

      if (res.status === 'WAIT_EXAM') {
        self.postMessage({
          type: 'WAIT',
          requestId,
          revision,
          kind: 'EXAM',
          exam: res.exam,
          logs: res.logs,
        });
      } else if (res.status === 'ENDED') {
        self.postMessage({
          type: 'WEEK_DONE',
          requestId,
          revision,
          ended: true,
          endings: res.endings,
          result:res,
          state: engine.MYExportState(),
        });
      } else if (res.status === 'ERROR') {
        self.postMessage({ type: 'ERROR', requestId, revision, reason: res.reason });
      } else {
        self.postMessage({
          type: 'WEEK_DONE',
          requestId,
          revision,
          ended: false,
          result: res,
          state: engine.MYExportState(),
          date: engine.calendar.MYGetDate(),
        });
      }
      return;
    }

    if (type === 'SUBMIT_EXAM') {
      const res = engine.MYSubmitExam(payload.answers);
      revision += 1;
      if(res.status==='WAIT_EXAM'){
        self.postMessage({type:'WAIT',kind:'EXAM',requestId,revision,exam:res.exam,examResult:res.examResult,logs:res.logs});return;
      }
      if (res.status === 'ERROR') {
        self.postMessage({ type: 'ERROR', requestId, revision, reason: res.reason });
        return;
      }
      self.postMessage({
        type: 'WEEK_DONE',
        requestId,
        revision,
        ended: res.status === 'ENDED',
        endings: res.endings || null,
        result: res,
        state: engine.MYExportState(),
        date: engine.calendar.MYGetDate(),
      });
      return;
    }

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

    if (type === 'COMPETITION') {
      const res = engine.MYRunCompetition(payload.compId);
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
  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      requestId,
      revision,
      reason: `Worker 처리 오류: ${err.message}`,
    });
  }
}

self.onmessage = MYHandleWorkerMessage;
