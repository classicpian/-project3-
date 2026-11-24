// src/logic/MYGameEngine.js

import { MYPlayer } from './MYPlayer.js';
import { MYCalendar } from './MYCalendar.js';
import { MYTraitPolicy } from './MYTraitPolicy.js';
import { MYActivityService } from './MYActivityService.js';
import { MYShopService, MY_SHOP_ITEMS } from './MYShopService.js';
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

    this.restrictedNextWeek = false;
    this.pendingExam = null;
    this.currentMidScore = 0;
    this.endingCandidates = null;
  }

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
      examType =
        date.month === 3 || date.month === 4 || date.month === 9 || date.month === 10
          ? 'mid'
          : 'final';
    }

    const semThresholds = MY_EXAM_THRESHOLDS[semesterId] || { mid: 1275, final: 1400 };
    const baseThreshold = semThresholds[examType];

    return { semesterId, examType, baseThreshold };
  }

  MYGetPrevExamThreshold(date = this.calendar.MYGetDate()) {
    const { semesterId, examType } = this.MYGetNextExamInfo(date);
    if (semesterId === '1-1' && examType === 'mid') {
      return 0;
    }

    if (examType === 'final') {
      return MY_EXAM_THRESHOLDS[semesterId]?.mid || 0;
    }

    const [yearStr, termStr] = semesterId.split('-');
    const year = Number(yearStr);
    const term = Number(termStr);
    const prevSemesterId = term === 2 ? `${year}-1` : `${year - 1}-2`;
    return MY_EXAM_THRESHOLDS[prevSemesterId]?.final || 0;
  }

  MYGetTargetExamThreshold() {
    let { baseThreshold } = this.MYGetNextExamInfo();
    if (this.shopService.activeEffects.jokboActive) {
      baseThreshold = Math.max(0, baseThreshold - 10);
    }
    return baseThreshold;
  }

  MYRunWeek(activityId) {
    if (this.endingCandidates) {
      return { status: 'ENDED', endings: this.endingCandidates };
    }
    if (this.pendingExam) {
      return { status: 'ERROR', reason: '진행 중인 시험을 먼저 제출해야 합니다.' };
    }
    if (activityId === 'leisure' && this.player.money < 100000) {
      return {
        status: 'ERROR',
        reason: '소지금이 부족해 여가를 즐길 수 없습니다. (필요: 100,000원 / 무료인 휴식을 이용해 주세요)',
      };
    }

    const date = this.calendar.MYGetDate();
    const schedule = this.calendar.MYGetSchedule();
    const logs = [];

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

    const hasAiGlasses = this.shopService.permanentItems.includes('ai_glasses');

    // 2-1. 전공 시험
    if (schedule.includes('MIDTERM_EXAM') || schedule.includes('FINAL_EXAM')) {
      const examType = schedule.includes('MIDTERM_EXAM') ? 'mid' : 'final';
      const jokboUsed = this.shopService.activeEffects.jokboActive;
      const examData = this.examService.MYBuildExam(
        date.semesterId,
        examType,
        this.player.intelligence,
        jokboUsed,
        hasAiGlasses
      );
      if (jokboUsed) {
        this.shopService.activeEffects.jokboActive = false;
        logs.push('족보 효과가 적용되어 시험 요구 지능이 10 감소했습니다.');
      }

      this.pendingExam = { examData, activityResult, logs, date, schedule };
      return { status: 'WAIT_EXAM', exam: examData, logs };
    }

    // 2-2. 접수해 둔 자격증 시험 진행
    if (this.shopService.activeEffects.pendingCertId) {
      const certId = this.shopService.activeEffects.pendingCertId;
      this.shopService.activeEffects.pendingCertId = null;
      const certName = MY_SHOP_ITEMS[certId]?.name || certId;
      const examData = this.examService.MYBuildCertExam(certId, certName, hasAiGlasses);
      logs.push(`[${certName}] 자격증 시험에 응시합니다. (4문제 중 3문제 이상 합격)`);
      this.pendingExam = { examData, activityResult, logs, date, schedule };
      return { status: 'WAIT_EXAM', exam: examData, logs };
    }

    // 2-3. 방학 마지막 주 토익 시험 진행
    const isVacationLastWeek =
      date.isVacation && (date.month === 8 || date.month === 2) && date.weekInMonth === 4;

    if (isVacationLastWeek && this.shopService.activeEffects.toeicPending) {
      this.shopService.activeEffects.toeicPending = false;
      const { semesterId: targetSemesterId } = this.MYGetNextExamInfo(date);
      const examData = this.examService.MYBuildExam(
        targetSemesterId,
        'toeic',
        this.player.intelligence,
        false,
        hasAiGlasses
      );
      logs.push('방학 마지막 주 토익 시험에 응시합니다.');
      this.pendingExam = { examData, activityResult, logs, date, schedule };
      return { status: 'WAIT_EXAM', exam: examData, logs };
    }

    return this.MYCompleteWeek(activityResult, logs, date, schedule);
  }

  MYSubmitExam(answers) {
    if (!this.pendingExam) {
      return { status: 'ERROR', reason: '제출할 시험이 없습니다.' };
    }

    const { activityResult, logs, date, schedule } = this.pendingExam;
    const submitRes = this.examService.MYSubmitAnswers(answers);
    if (!submitRes.ok) return { status: 'ERROR', reason: submitRes.reason };

    // AI 안경 착용 시 10% 확률로 부정행위 적발 -> 즉시 퇴학 엔딩
    if (this.shopService.permanentItems.includes('ai_glasses') && Math.random() < 0.1) {
      this.pendingExam = null;
      this.endingCandidates = [
        {
          id: 'EXPELLED_CHEATING',
          title: '🚨 부정행위 적발 (퇴학 엔딩)',
          description: 'AI 안경을 착용하고 시험을 치르다 감독관에게 적발되어 즉시 퇴학 처리되었습니다.',
        },
      ];
      logs.push('🚨 [부정행위 적발] AI 안경 사용이 감독관에게 발각되어 퇴학 처리되었습니다!');
      return {
        status: 'ENDED',
        endings: this.endingCandidates,
        player: this.player.MYGetState(),
        logs,
      };
    }

    // 문항별 정답 및 한 줄 해설 로그 추가
    if (submitRes.reviews) {
      submitRes.reviews.forEach((r) => {
        const mark = r.isCorrect ? '✅' : '❌';
        const expText = r.explanation ? ` — ${r.explanation}` : '';
        logs.push(`Q${r.index} ${mark} (정답: ${r.correctOption})${expText}`);
      });
    }

    if (submitRes.examType === 'cert') {
      if (submitRes.passed) {
        this.eventService.awards.push(submitRes.certId);
        if (submitRes.certId === 'cert_security') {
          this.eventService.awards.push('cert_security_bonus');
          logs.push(
            `🎉 [${submitRes.certName}] 합격! (${submitRes.correctCount}/4 정답, 끝판왕 자격증 보너스 스펙 +2)`
          );
        } else {
          logs.push(
            `🎉 [${submitRes.certName}] 합격! (${submitRes.correctCount}/4 정답, 취업 스펙 +1)`
          );
        }
      } else {
        logs.push(
          `😥 [${submitRes.certName}] 불합격 (${submitRes.correctCount}/4 정답 — 3문제 이상 필요)`
        );
      }
    } else if (submitRes.examType === 'toeic') {
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

  MYCompleteWeek(activityResult, logs, date, schedule) {
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

    const overwork = this.eventService.MYCheckOverwork(this.player);
    if (overwork.triggered) {
      this.restrictedNextWeek = true;
      logs.push(overwork.message);
    }

    const breakup = this.eventService.MYCheckBreakup(this.player);
    if (breakup.triggered) {
      logs.push(breakup.message);
    }

    if (schedule.includes('RENT_DUE')) {
      const yearMonthKey = `${date.academicYear}-${date.month}`;
      const rentRes = this.economyService.MYPayRent(this.player, yearMonthKey);
      if (rentRes.isBankrupt) {
        return this.MYFinishGame(true, rentRes.reason);
      }
      if (rentRes.supportedBySpoon) {
        logs.push(`${this.player.spoon.label} 혜택으로 이번 달 월세가 전액 지원되었습니다! (0원)`);
      } else if (!rentRes.alreadyPaid) {
        logs.push(`월세 ${rentRes.paidAmount.toLocaleString()}원 납부 완료`);
      }
    }

    this.shopService.MYResetWeeklyLimits();
    const nextDate = this.calendar.MYAdvance();

    if (nextDate.isGraduated) {
      return this.MYFinishGame(false);
    }

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
      if (tuitionRes.supportedBySpoon) {
        logs.push(
          `[${nextDate.semesterId} 학기 시작] ${this.player.spoon.label} 혜택으로 학비가 전액 지원되었습니다! (0원)`
        );
      } else if (!tuitionRes.alreadyPaid) {
        logs.push(
          `[${nextDate.semesterId} 학기 시작] 학비 ${tuitionRes.paidAmount.toLocaleString()}원 자동 납부 (장학금 ${tuitionRes.scholarship.toLocaleString()}원 감면)`
        );
      }
    }

    // 남자 캐릭터가 3학년 1학기까지 미입대 상태면 자동 입대 처리
    if (
      nextDate.academicYear === 3 &&
      nextDate.month === 3 &&
      nextDate.weekInMonth === 1 &&
      this.player.gender === 'male'
    ) {
      const milRes = this.MYTriggerMilitary();
      if (milRes.ok) {
        logs.push(`🪖 [영장 발부] 3학년 진입 전까지 미입대 상태여서 자동 입대했습니다! (${milRes.message})`);
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

  MYTriggerMilitary() {
    if (this.endingCandidates) return { ok: false, reason: '이미 종료된 게임입니다.' };
    return this.eventService.MYApplyMilitary(this.player);
  }

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

  MYExportState() {
    const date = this.calendar.MYGetDate();
    const { baseThreshold } = this.MYGetNextExamInfo(date);

    return {
      elapsedWeek: this.calendar.elapsedWeek,
      player: this.player.MYGetState(),
      examThreshold: this.MYGetTargetExamThreshold(),
      hackathonThreshold: date.isVacation ? null : baseThreshold + 50,
      permanentPrices: this.shopService.MYGetPermanentPriceMap(date.academicYear),
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