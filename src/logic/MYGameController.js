// src/logic/MYGameController.js

import { MYSaveRepository } from './MYSaveRepository.js';

export class MYGameController {
  constructor(callbacks = {}) {
    this.saveRepo = new MYSaveRepository();
    this.callbacks = callbacks; // { onState, onWaitExam, onWeekDone, onAdvice, onError }

    this.requestSeq = 0;
    this.latestRevision = 0;
    this.isBusy = false;

    // Web Worker 2개 고정 생성 (턴마다 재생성 금지)
    this.gameWorker = new Worker(
      new URL('../workers/MYGameWorker.js', import.meta.url),
      { type: 'module' }
    );
    this.advisorWorker = new Worker(
      new URL('../workers/MYAdvisorWorker.js', import.meta.url),
      { type: 'module' }
    );

    this.gameWorker.onmessage = (e) => this.MYHandleReply(e.data);
    this.advisorWorker.onmessage = (e) => this.MYHandleAdvisorReply(e.data);
  }

  // 새 게임 시작
  MYStartGame(gender = 'male') {
    this.saveRepo.MYClearCheckpoint();
    this.latestRevision = 0;
    this.MYSendCommand('INIT', { gender });
  }

  // 저장된 게임 이어하기
  MYLoadGame() {
    const loaded = this.saveRepo.MYLoadCheckpoint();
    if (!loaded.ok) {
      this.callbacks.onError?.(loaded.reason);
      return false;
    }
    this.latestRevision = 0;
    this.MYSendCommand('RESTORE', { savedData: loaded.data });
    return true;
  }

  // GameWorker로 명령 전송 (중복 입력 차단)
  MYSendCommand(type, payload = {}) {
    if (this.isBusy && type !== 'SUBMIT_EXAM') {
      this.callbacks.onError?.('이전 요청을 처리 중입니다.');
      return;
    }
    this.isBusy = true;
    this.requestSeq += 1;

    this.gameWorker.postMessage({
      type,
      requestId: this.requestSeq,
      revision: this.latestRevision,
      payload,
    });
  }

  // GameWorker 응답 처리
  MYHandleReply(msg) {
    this.isBusy = false;

    // 오래된 revision 응답 무시
    if (msg.revision && msg.revision < this.latestRevision) return;
    if (msg.revision) this.latestRevision = msg.revision;

    if (msg.type === 'ERROR') {
      this.callbacks.onError?.(msg.reason);
      return;
    }

    if (msg.type === 'STATE') {
      this.callbacks.onState?.(msg);
      this.MYRequestAdvice(msg.state, msg.date);
      return;
    }

    if (msg.type === 'WAIT' && msg.kind === 'EXAM') {
      this.callbacks.onWaitExam?.(msg);
      return;
    }

    if (msg.type === 'WEEK_DONE') {
      // 주간 완료 시 자동 저장
      const saveRes = this.saveRepo.MYSaveCheckpoint(msg.state);
      this.callbacks.onWeekDone?.({ ...msg, saveRes });
      this.MYRequestAdvice(msg.state, msg.date);
    }
  }

  // AdvisorWorker에 병행 상태 조회 요청
  MYRequestAdvice(state, date) {
    if (!state) return;
    this.advisorWorker.postMessage({
      type: 'ANALYZE',
      revision: this.latestRevision,
      snapshot: state,
      date,
    });
  }

  // AdvisorWorker 응답 처리 (오래된 revision 폐기)
  MYHandleAdvisorReply(msg) {
    if (msg.type === 'ADVICE' && msg.revision === this.latestRevision) {
      this.callbacks.onAdvice?.(msg.advice);
    }
  }
}