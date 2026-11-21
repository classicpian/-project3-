// src/logic/MYGameEngine.js

import { MYPlayer } from './MYPlayer.js';
import { MYCalendar } from './MYCalendar.js';
import { MYTraitPolicy } from './MYTraitPolicy.js';
import { MYActivityService } from './MYActivityService.js';
import { MYShopService } from './MYShopService.js';
import { MYEconomyService } from './MYEconomyService.js';
import { MYExamService, MY_EXAM_THRESHOLDS } from './MYExamService.js';
import { MYAssignmentService } from './MYAssignmentService.js';
import { MYEventService } from './MYEventService.js';
import { MYEndingService } from './MYEndingService.js';

export class MYGameEngine {
  constructor(gender = 'male') {
    this.player = new MYPlayer(gender);
    this.calendar = new MYCalendar(0);
    this.traitPolicy = new MYTraitPolicy();
    this.activityService = new MYActivityService();
    this.shopService = new MYShopService();
    this.economyService = new MYEconomyService();
    this.examService = new MYExamService();
    this.assignmentService = new MYAssignmentService();
    this.eventService = new MYEventService();
    this.endingService = new MYEndingService();

    this.restrictedNextWeek = false; // 과로로 인한 강제 휴식 여부
    this.pendingExam = null;         // 시험 입력 대기 상태
    this.currentMidScore = 0;        // 이번 학기 중간고사 점수 임시 보관
    this.endingCandidates = null;    // 종료 시 엔딩 후보
  }

  // 현재(또는 방학 중 다음) 시험 정보 계산
  MYGetNextExamInfo(date = this.calendar.MYGetDate()) {
    let semesterId = date.semesterId;
    let examType = 'mid';

    if (date.isVacation) {
      if (date.month === 7 || date.month === 8) {
        semesterId = `${date.academicYear}-2`;
      } else {
        semesterId = date.academicYear < 4 ? `${date.academicYear + 1}-1` : '4-2';
      }
      examType = 'mid';
    } else {
      // 3~4월, 9~10월은 중간고사 기준 / 5~6월, 11~12월은 기말고사 기준
      examType =
        date.month === 3 || date.month === 4 || date.month === 9 || date.month === 10
          ? 'mid'
          : 'final';
    }

    const semThresholds = MY_EXAM_THRESHOLDS[semesterId] || { mid: 1275, final: 1400 };
    const baseThreshold = semThresholds[examType];

    return { semesterId, examType, baseThreshold };
  }

  // 직전 시험 요구 지능 계산 (월간 과제 성공률 판정용)
  MYGetPrevExamThreshold(date = this.calendar.MYGetDate()) {
    const { semesterId, examType } = this.MYGetNextExamInfo(date);
    if (semesterId === '1-1' && examType === 'mid') {
      return 0; // 1학년 1학기 중간고사 전까지는 성공률 100%
    }

    if (examType === 'final') {
      return MY_EXAM_THRESHOLDS[semesterId]?.mid || 0;
    }

    // 현재 중간고사 기준일 경우 직전 학기 기말고사 요구 지능 반환
    const [yearStr, termStr] = semesterId.split('-');
    const year = Number(yearStr);
    const term = Number(termStr);
    const prevSemesterId = term === 2 ? `${year}-1` : `${year - 1}-2`;
    return MY_EXAM_THRESHOLDS[prevSemesterId]?.final || 0;
  }

  // 현재(또는 다음) 시험 요구 지능 계산 (족보 효과 반영)
  MYGetTargetExamThreshold() {
    let { baseThreshold } = this.MYGetNextExamInfo();
    if (this.shopService.activeEffects.jokboActive) {
      baseThreshold = Math.max(0, baseThreshold - 10);
    }
    return baseThreshold;
  }

  // 주간 실행 (활동 선택 시 호출)
  MYRunWeek(activityId) {
    if (this.endingCandidates) {
      return { status: 'ENDED', endings: this.endingCandidates };
    }
    if (this.pendingExam) {
      return { status: 'ERROR', reason: '진행 중인 시험을 먼저 제출해야 합니다.' };
    }

    const date = this.calendar.MYGetDate();
    const schedule = this.calendar.MYGetSchedule();
    const logs = [];

    // 1. 일반 활동 처리 (과로 상태면 강제 회복)
    let activityResult = null;
    if (this.restrictedNextWeek) {
      this.restrictedNextWeek = false;
      this.player.MYApplyDelta({ health: 30, stress: -10 });
      logs.push('과로 여파로 이번 주는 강제 휴식을 취했습니다. (체력 +30, 스트레스 -10)');
    } else {
      const context = {
        hasAssignment: false,
        isAssignmentDone: true,
        weeksToAssignment: 99,
        weeksToExam: schedule.includes('MIDTERM_EXAM') || schedule.includes('FINAL_EXAM') ? 0 : 99,
      };

      const selectedMode = this.traitPolicy.MYSelectMode(activityId, this.player.MYGetState(), context);
      const evalRes = this.activityService.MYEvaluateActivity(
        activityId,
        selectedMode,
        this.player.MYGetState(),
        this.shopService.permanentItems
      );
      activityResult = this.activityService.MYApplyResult(this.player, evalRes);

      this.eventService.MYTrackLeisure(activityId);
      logs.push(`[${selectedMode.label}] ${selectedMode.reason}`);
    }

    // 2-1. 전공 시험 주차 확인 -> 시험이 있으면 WAIT_EXAM 상태로 일시 정지
    if (schedule.includes('MIDTERM_EXAM') || schedule.includes('FINAL_EXAM')) {
      const examType = schedule.includes('MIDTERM_EXAM') ? 'mid' : 'final';
      const jokboUsed = this.shopService.activeEffects.jokboActive;
      const examData = this.examService.MYBuildExam(
        date.semesterId,
        examType,
        this.player.intelligence,
        jokboUsed
      );
      if (jokboUsed) {
        this.shopService.activeEffects.jokboActive = false; // 족보 1회 소멸
        logs.push('족보 효과가 적용되어 시험 요구 지능이 10 감소했습니다.');
      }

      this.pendingExam = { examData, activityResult, logs, date, schedule };
      return { status: 'WAIT_EXAM', exam: examData, logs };
    }

    // 2-2. 방학 마지막 주(8월 4주 / 2월 4주) + 토익 응시권 보유 시 토익 시험 진행
    const isVacationLastWeek =
      date.isVacation && (date.month === 8 || date.month === 2) && date.weekInMonth === 4;

    if (isVacationLastWeek && this.shopService.activeEffects.toeicPending) {
      this.shopService.activeEffects.toeicPending = false;
      const { semesterId: targetSemesterId } = this.MYGetNextExamInfo(date);
      const examData = this.examService.MYBuildExam(
        targetSemesterId,
        'toeic',
        this.player.intelligence,
        false
      );
      logs.push(`방학 마지막 주 토익 시험에 응시합니다. (요구 지능: ${examData.threshold})`);
      this.pendingExam = { examData, activityResult, logs, date, schedule };
      return { status: 'WAIT_EXAM', exam: examData, logs };
    }

    // 시험이 없으면 바로 주간 마무리로 진행
    return this.MYCompleteWeek(activityResult, logs, date, schedule);
  }

  // 시험 답안 제출 후 주간 진행 재개
  MYSubmitExam(answers) {
    if (!this.pendingExam) {
      return { status: 'ERROR', reason: '제출할 시험이 없습니다.' };
    }

    const { activityResult, logs, date, schedule } = this.pendingExam;
    const submitRes = this.examService.MYSubmitAnswers(answers);
    if (!submitRes.ok) return { status: 'ERROR', reason: submitRes.reason };

    if (submitRes.examType === 'toeic') {
      const prevScore = this.player.toeicScore || 0;
      if (submitRes.score > prevScore) {
        this.player.toeicScore = submitRes.score;
      }
      logs.push(
        `토익 시험 완료: ${submitRes.score}점 (${submitRes.correctCount}/4 정답, 최고 점수: ${this.player.toeicScore}점)`
      );
    } else if (submitRes.examType === 'mid') {
      logs.push(`중간고사 완료: ${submitRes.score}점 (${submitRes.correctCount}/4 정답)`);
      this.currentMidScore = submitRes.score;
    } else {
      logs.push(`기말고사 완료: ${submitRes.score}점 (${submitRes.correctCount}/4 정답)`);

      // 기말고사 주차(6월 4주 / 12월 4주) 마지막 월간 과제 판정 후 학기 성적 산출
      const prevThreshold = this.MYGetPrevExamThreshold(date);
      const hasGpt = this.shopService.activeEffects.gptPlusWeeksLeft > 0;
      const assignRes = this.assignmentService.MYEvaluateMonthly(
        this.player.intelligence,
        prevThreshold,
        hasGpt
      );
      logs.push(assignRes.message);

      const gradeRec = this.examService.MYCalculateSemesterGrade(
        date.semesterId,
        this.currentMidScore,
        submitRes.score,
        this.assignmentService.MYGetSemesterScore()
      );
      logs.push(`${date.semesterId} 학기 최종 성적: ${gradeRec.grade} (${gradeRec.weightedScore}점)`);
    }

    this.pendingExam = null;
    return this.MYCompleteWeek(activityResult, logs, date, schedule);
  }

  // 월간 과제·자격증 판정·돌발 이벤트·월세 정산·주차 이동 및 새 학기 시작 정산(학비)
  MYCompleteWeek(activityResult, logs, date, schedule) {
    // 3-1. 학기 중 매달 4주차(기말고사 주 제외) 월간 과제 판정
    if (!date.isVacation && date.weekInMonth === 4 && !schedule.includes('FINAL_EXAM')) {
      const prevThreshold = this.MYGetPrevExamThreshold(date);
      const hasGpt = this.shopService.activeEffects.gptPlusWeeksLeft > 0;
      const assignRes = this.assignmentService.MYEvaluateMonthly(
        this.player.intelligence,
        prevThreshold,
        hasGpt
      );
      logs.push(assignRes.message);
    }

    // 3-2. 자격증 응시 대기 중이면 이번 주에 합격 판정 (현재 지능 / (다음 시험 요구 지능 + 50))
    if (this.shopService.activeEffects.certPending) {
      this.shopService.activeEffects.certPending = false;
      const { baseThreshold } = this.MYGetNextExamInfo(date);
      const certTarget = baseThreshold + 50;
      const passProb = Math.min(1, this.player.intelligence / certTarget);

      if (Math.random() < passProb) {
        this.eventService.awards.push('CERT');
        logs.push(
          `🎉 자격증 시험에 합격했습니다! (합격 확률 ${Math.round(passProb * 100)}%, 취업 스펙 추가)`
        );
      } else {
        logs.push(
          `😥 자격증 시험에서 아쉽게 불합격했습니다. (합격 확률 ${Math.round(passProb * 100)}%)`
        );
      }
    }

    // 4. 돌발 이벤트 (과로, 이별)
    const overwork = this.eventService.MYCheckOverwork(this.player);
    if (overwork.triggered) {
      this.restrictedNextWeek = true;
      logs.push(overwork.message);
    }

    const breakup = this.eventService.MYCheckBreakup(this.player);
    if (breakup.triggered) {
      logs.push(breakup.message);
    }

    // 5. 월말 월세 납부
    if (schedule.includes('RENT_DUE')) {
      const yearMonthKey = `${date.academicYear}-${date.month}`;
      const rentRes = this.economyService.MYPayRent(this.player, yearMonthKey);
      if (rentRes.isBankrupt) {
        return this.MYFinishGame(true, rentRes.reason);
      }
      if (!rentRes.alreadyPaid) {
        logs.push(`월세 ${rentRes.paidAmount.toLocaleString()}원 납부 완료`);
      }
    }

    // 6. 주간 제한 초기화 및 다음 주로 이동
    this.shopService.MYResetWeeklyLimits();
    const nextDate = this.calendar.MYAdvance();

    if (nextDate.isGraduated) {
      return this.MYFinishGame(false);
    }

    // 7. 새 학기 첫 주(9월 1주 / 3월 1주)에 진입하는 순간 학비 자동 납부 및 과제 점수 초기화
    const isNewSemesterStart =
      (nextDate.month === 3 || nextDate.month === 9) && nextDate.weekInMonth === 1;

    if (isNewSemesterStart) {
      this.assignmentService.MYResetAssignment();
      const prevGpa =
        this.examService.academicRecords.length > 0
          ? this.examService.academicRecords[this.examService.academicRecords.length - 1].gradePoint
          : null;
      const tuitionRes = this.economyService.MYPayTuition(this.player, nextDate.semesterId, prevGpa);
      if (tuitionRes.isBankrupt) {
        return this.MYFinishGame(true, tuitionRes.reason);
      }
      if (!tuitionRes.alreadyPaid) {
        logs.push(
          `[${nextDate.semesterId} 학기 시작] 학비 ${tuitionRes.paidAmount.toLocaleString()}원 자동 납부 (장학금 ${tuitionRes.scholarship.toLocaleString()}원 감면)`
        );
      }
    }

    return {
      status: 'WEEK_DONE',
      activityResult,
      logs,
      player: this.player.MYGetState(),
      nextDate,
    };
  }

  // 군대 이벤트 실행 (남성 캐릭터 자율 선택)
  MYTriggerMilitary() {
    if (this.endingCandidates) return { ok: false, reason: '이미 종료된 게임입니다.' };
    return this.eventService.MYApplyMilitary(this.player);
  }

  // 대회/해커톤 참가 및 결과 판정 (방학 불가, 요구 지능 = 다음 시험 요구치 + 50)
  MYRunCompetition(compId = 'HACKATHON') {
    if (this.endingCandidates) return { ok: false, reason: '이미 종료된 게임입니다.' };

    const date = this.calendar.MYGetDate();
    if (date.isVacation) {
      return { ok: false, reason: '방학 기간에는 대회/해커톤에 참가할 수 없습니다.' };
    }

    if (this.eventService.awards.includes(compId)) {
      return { ok: false, reason: '이미 수상한 대회입니다.' };
    }

    const { baseThreshold } = this.MYGetNextExamInfo(date);
    const requiredIntelligence = baseThreshold + 50;
    const res = this.eventService.MYResolveCompetition(this.player, compId, requiredIntelligence);
    return { ok: true, requiredIntelligence, ...res };
  }

  // 게임 종료 및 엔딩 계산
  MYFinishGame(isBankrupt, bankruptReason = '') {
    this.endingCandidates = this.endingService.MYEvaluateEndings({
      gpa: this.examService.MYGetCumulativeGPA(),
      awardCount: this.eventService.awards.length,
      money: this.player.money,
      isBankrupt,
      bankruptReason,
    });
    return { status: 'ENDED', endings: this.endingCandidates, player: this.player.MYGetState() };
  }

  // 저장용 스냅샷 추출
  MYExportState() {
    const date = this.calendar.MYGetDate();
    const { baseThreshold } = this.MYGetNextExamInfo(date);

    return {
      elapsedWeek: this.calendar.elapsedWeek,
      player: this.player.MYGetState(),
      examThreshold: this.MYGetTargetExamThreshold(),
      hackathonThreshold: date.isVacation ? null : baseThreshold + 50,
      assignmentScore: this.assignmentService.MYGetSemesterScore(),
      restrictedNextWeek: this.restrictedNextWeek,
      currentMidScore: this.currentMidScore,
      inventory: this.shopService.inventory,
      permanentItems: this.shopService.permanentItems,
      activeEffects: this.shopService.activeEffects,
      academicRecords: this.examService.academicRecords,
      awards: this.eventService.awards,
    };
  }
}