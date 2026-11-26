// src/logic/MYExamService.js

import { MY_TOEIC_QUESTIONS } from './questions/MYToeicQuestions.js';
import { MY_CERT_QUESTIONS } from './questions/MYCertQuestions.js';
import { MY_MAJOR_QUESTIONS } from './questions/MYMajorQuestions.js';

export const MY_EXAM_THRESHOLDS = {
  '1-1': { mid: 50, final: 150 },
  '1-2': { mid: 250, final: 350 },
  '2-1': { mid: 450, final: 550 },
  '2-2': { mid: 650, final: 750 },
  '3-1': { mid: 850, final: 950 },
  '3-2': { mid: 1050, final: 1150 },
  '4-1': { mid: 1200, final: 1275 },
  '4-2': { mid: 1350, final: 1400 },
};

function MYPickRandom(pool, count = 4) {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

export class MYExamService {
  constructor() {
    this.currentExam = null;
    this.academicRecords = [];
  }

  // 전공 시험(mid / final) 및 토익(toeic) 출제
  MYBuildExam(semesterId, examType, playerIntelligence, jokboUsed = false, hasAiGlasses = false) {
    if (examType === 'toeic') {
      const selected = MYPickRandom(MY_TOEIC_QUESTIONS, 4);
      this.currentExam = {
        semesterId,
        examType: 'toeic',
        difficulty: 'toeic',
        threshold: 0,
        questions: selected,
      };
      return {
        semesterId,
        examType: 'toeic',
        difficulty: 'toeic',
        threshold: 0,
        questions: selected.map((q) => ({
          prompt: q.prompt,
          options: q.options,
          ...(hasAiGlasses ? { aiAnswerIndex: q.answerIndex } : {}),
        })),
      };
    }

    const semThresholds = MY_EXAM_THRESHOLDS[semesterId] || { mid: 1275, final: 1400 };
    let threshold = semThresholds[examType] ?? 100;
    if (jokboUsed) {
      threshold = Math.max(0, threshold - 10);
    }

    // 원래 기획대로 easy / hard 2단계 판정
    const difficulty = playerIntelligence >= threshold ? 'easy' : 'hard';
    const pool =
      MY_MAJOR_QUESTIONS[semesterId]?.[examType]?.[difficulty] ||
      MY_MAJOR_QUESTIONS['1-1'].mid[difficulty];
    const selected = MYPickRandom(pool, 4);

    this.currentExam = {
      semesterId,
      examType,
      difficulty,
      threshold,
      intelligence: playerIntelligence,
      questions: selected,
    };

    return {
      semesterId,
      examType,
      difficulty,
      threshold,
      intelligence: playerIntelligence,
      questions: selected.map((q) => ({
        prompt: q.prompt,
        options: q.options,
        ...(hasAiGlasses ? { aiAnswerIndex: q.answerIndex } : {}),
      })),
    };
  }

  // 자격증 10종 시험 출제
  MYBuildCertExam(certId, certName, hasAiGlasses = false) {
    const pool = MY_CERT_QUESTIONS[certId] || [];
    const selected = MYPickRandom(pool, 4);

    this.currentExam = {
      examType: 'cert',
      certId,
      certName,
      questions: selected,
    };

    return {
      examType: 'cert',
      certId,
      certName,
      questions: selected.map((q) => ({
        prompt: q.prompt,
        options: q.options,
        ...(hasAiGlasses ? { aiAnswerIndex: q.answerIndex } : {}),
      })),
    };
  }

  // 답안 채점 및 문항별 해설 반환
  MYSubmitAnswers(answers = []) {
    if (!this.currentExam) {
      return { ok: false, reason: '진행 중인 시험이 없습니다.' };
    }

    const { examType, certId, certName, questions } = this.currentExam;
    let correctCount = 0;

    const reviews = questions.map((q, idx) => {
      const userAns = answers[idx];
      const isCorrect = userAns === q.answerIndex;
      if (isCorrect) correctCount += 1;

      return {
        index: idx + 1,
        isCorrect,
        correctOption: q.options[q.answerIndex],
        explanation: q.explanation || '',
      };
    });

    this.currentExam = null;

    if (examType === 'cert') {
      return {
        ok: true,
        examType: 'cert',
        certId,
        certName,
        correctCount,
        passed: correctCount >= 3,
        reviews,
      };
    }

    if (examType === 'toeic') {
      const toeicMap = [400, 550, 700, 850, 990];
      const score = toeicMap[correctCount] ?? 400;
      return { ok: true, examType: 'toeic', correctCount, score, reviews };
    }

    const score = Math.round((correctCount / questions.length) * 100);
    return { ok: true, examType, correctCount, score, reviews };
  }

  MYCalculateSemesterGrade(semesterId, midScore, finalScore, assignmentScore) {
    const weightedScore = Math.round(midScore * 0.4 + finalScore * 0.4 + assignmentScore * 0.2);

    let grade = 'F';
    let gradePoint = 0.0;
    if (weightedScore >= 95) { grade = 'A+'; gradePoint = 4.5; }
    else if (weightedScore >= 90) { grade = 'A0'; gradePoint = 4.0; }
    else if (weightedScore >= 85) { grade = 'B+'; gradePoint = 3.5; }
    else if (weightedScore >= 80) { grade = 'B0'; gradePoint = 3.0; }
    else if (weightedScore >= 75) { grade = 'C+'; gradePoint = 2.5; }
    else if (weightedScore >= 70) { grade = 'C0'; gradePoint = 2.0; }
    else if (weightedScore >= 60) { grade = 'D0'; gradePoint = 1.0; }

    const record = { semesterId, midScore, finalScore, assignmentScore, weightedScore, grade, gradePoint };
    this.academicRecords.push(record);
    return record;
  }

  MYGetCumulativeGPA() {
    if (this.academicRecords.length === 0) return 0;
    const sum = this.academicRecords.reduce((acc, rec) => acc + rec.gradePoint, 0);
    return Math.round((sum / this.academicRecords.length) * 100) / 100;
  }
}
