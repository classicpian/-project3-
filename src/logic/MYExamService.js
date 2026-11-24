// src/logic/MYExamService.js

import { MY_TOEIC_QUESTIONS } from './questions/MYToeicQuestions.js';
import { MY_CERT_QUESTIONS } from './questions/MYCertQuestions.js';

export const MY_EXAM_THRESHOLDS = {
  '1-1': { mid: 50, final: 100 },
  '1-2': { mid: 150, final: 200 },
  '2-1': { mid: 275, final: 350 },
  '2-2': { mid: 425, final: 500 },
  '3-1': { mid: 600, final: 700 },
  '3-2': { mid: 800, final: 900 },
  '4-1': { mid: 1025, final: 1150 },
  '4-2': { mid: 1275, final: 1400 },
};

const MY_CS_QUESTIONS = {
  easy: [
    {
      prompt: 'HTML에서 가장 큰 제목 태그는?',
      options: ['<h1>', '<h6>', '<head>', '<title>'],
      answerIndex: 0,
      explanation: 'h1이 가장 큰 제목 태그이고 h6으로 갈수록 작아집니다.',
    },
    {
      prompt: 'JavaScript에서 상수를 선언할 때 사용하는 키워드는?',
      options: ['var', 'let', 'const', 'static'],
      answerIndex: 2,
      explanation: 'const는 재할당이 불가능한 상수를 선언합니다.',
    },
    {
      prompt: '배열의 길이를 구하는 속성은?',
      options: ['size', 'length', 'count', 'index'],
      answerIndex: 1,
      explanation: 'JS 배열은 length 속성으로 길이를 확인합니다.',
    },
    {
      prompt: 'CPU의 약자는?',
      options: [
        'Central Processing Unit',
        'Computer Personal Unit',
        'Core Program Unit',
        'Control Power Unit',
      ],
      answerIndex: 0,
      explanation: 'CPU는 중앙처리장치(Central Processing Unit)입니다.',
    },
    {
      prompt: '스택(Stack) 자료구조의 입출력 방식은?',
      options: ['FIFO', 'LIFO', 'LILO', 'Random'],
      answerIndex: 1,
      explanation: '스택은 나중에 들어온 데이터가 먼저 나가는 후입선출(LIFO) 구조입니다.',
    },
  ],
  hard: [
    {
      prompt: '이진 탐색 트리의 평균 탐색 시간 복잡도는?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      answerIndex: 1,
      explanation: '균형 잡힌 이진 탐색 트리는 탐색 범위를 절반씩 줄여 O(log n)입니다.',
    },
    {
      prompt: 'HTTP 상태 코드 중 "Not Found"는?',
      options: ['200', '301', '404', '500'],
      answerIndex: 2,
      explanation: '404는 요청한 리소스를 서버에서 찾을 수 없음을 뜻합니다.',
    },
    {
      prompt: '교착 상태(Deadlock)의 4가지 필요 조건이 아닌 것은?',
      options: ['상호 배제', '점유와 대기', '선점', '순환 대기'],
      answerIndex: 2,
      explanation: '교착 상태의 조건은 "비선점(No Preemption)"입니다.',
    },
    {
      prompt: 'TCP와 UDP의 가장 큰 차이점은?',
      options: ['연결 지향 여부', 'IP 주소 사용 여부', '포트 번호 사용 여부', '패킷 전송 여부'],
      answerIndex: 0,
      explanation: 'TCP는 연결 지향(신뢰성 보장), UDP는 비연결 지향 프로토콜입니다.',
    },
    {
      prompt: '관계형 데이터베이스에서 테이블의 각 행을 유일하게 식별하는 키는?',
      options: ['Foreign Key', 'Primary Key', 'Index Key', 'Check Key'],
      answerIndex: 1,
      explanation: '기본 키(Primary Key)는 중복과 NULL을 허용하지 않고 행을 유일하게 식별합니다.',
    },
  ],
};

const MY_TOEIC_SCORE_TABLE = [250, 450, 650, 800, 950];

// 배열 무작위 셔플 후 count개 추출
function MYPickRandom(arr, count = 4) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

export class MYExamService {
  constructor() {
    this.academicRecords = [];
    this.currentExam = null;
  }

  // 전공 시험 및 토익 시험 출제 (examType: 'mid' | 'final' | 'toeic')
  MYBuildExam(semesterId, examType, playerIntelligence, jokboUsed = false) {
    if (examType === 'toeic') {
      const selected = MYPickRandom(MY_TOEIC_QUESTIONS, 4);
      this.currentExam = {
        semesterId,
        examType: 'toeic',
        difficulty: '실전',
        threshold: null,
        questions: selected,
      };
      return {
        semesterId,
        examType: 'toeic',
        difficulty: '실전',
        threshold: null,
        questions: selected.map((q) => ({ prompt: q.prompt, options: q.options })),
      };
    }

    const semThresholds = MY_EXAM_THRESHOLDS[semesterId] || { mid: 1275, final: 1400 };
    let threshold = examType === 'final' ? semThresholds.final : semThresholds.mid;

    if (jokboUsed) {
      threshold = Math.max(0, threshold - 10);
    }

    const difficulty = playerIntelligence >= threshold ? 'easy' : 'hard';
    const selected = MYPickRandom(MY_CS_QUESTIONS[difficulty], 4);

    this.currentExam = {
      semesterId,
      examType,
      difficulty,
      threshold,
      questions: selected,
    };

    return {
      semesterId,
      examType,
      difficulty,
      threshold,
      questions: selected.map((q) => ({ prompt: q.prompt, options: q.options })),
    };
  }

  // 자격증 시험 출제 (4문제 랜덤 추출, 3문제 이상 합격)
  MYBuildCertExam(certId, certName) {
    const bank = MY_CERT_QUESTIONS[certId] || [];
    const selected = MYPickRandom(bank, 4);

    this.currentExam = {
      examType: 'cert',
      certId,
      certName,
      difficulty: '자격증',
      threshold: null,
      questions: selected,
    };

    return {
      examType: 'cert',
      certId,
      certName,
      difficulty: '자격증',
      threshold: null,
      questions: selected.map((q) => ({ prompt: q.prompt, options: q.options })),
    };
  }

  // 답안 제출 및 채점 (문항별 정답 및 해설 포함)
  MYSubmitAnswers(answers) {
    if (!this.currentExam) {
      return { ok: false, reason: '진행 중인 시험이 없습니다.' };
    }
    if (!Array.isArray(answers) || answers.length !== this.currentExam.questions.length) {
      return { ok: false, reason: '모든 문항의 답안을 제출해야 합니다.' };
    }

    let correctCount = 0;
    const reviews = this.currentExam.questions.map((q, idx) => {
      const isCorrect = answers[idx] === q.answerIndex;
      if (isCorrect) correctCount += 1;
      return {
        index: idx + 1,
        isCorrect,
        correctOption: q.options[q.answerIndex],
        explanation: q.explanation || '',
      };
    });

    const { examType, semesterId, difficulty, certId, certName } = this.currentExam;
    let score = correctCount * 25;
    if (examType === 'toeic') {
      score = MY_TOEIC_SCORE_TABLE[correctCount] ?? 250;
    }

    this.currentExam = null;

    return {
      ok: true,
      examType,
      semesterId,
      difficulty,
      certId,
      certName,
      correctCount,
      score,
      passed: examType === 'cert' ? correctCount >= 3 : null,
      reviews,
    };
  }

  MYCalculateSemesterGrade(semesterId, midScore, finalScore, assignmentScore) {
    const weightedScore = Math.round(midScore * 0.3 + finalScore * 0.4 + assignmentScore * 0.3);

    let grade = 'F';
    let gradePoint = 0.0;

    if (weightedScore >= 95) {
      grade = 'A+';
      gradePoint = 4.5;
    } else if (weightedScore >= 90) {
      grade = 'A0';
      gradePoint = 4.0;
    } else if (weightedScore >= 85) {
      grade = 'B+';
      gradePoint = 3.5;
    } else if (weightedScore >= 80) {
      grade = 'B0';
      gradePoint = 3.0;
    } else if (weightedScore >= 75) {
      grade = 'C+';
      gradePoint = 2.5;
    } else if (weightedScore >= 70) {
      grade = 'C0';
      gradePoint = 2.0;
    } else if (weightedScore >= 60) {
      grade = 'D0';
      gradePoint = 1.0;
    }

    const record = {
      semesterId,
      midScore,
      finalScore,
      assignmentScore,
      weightedScore,
      grade,
      gradePoint,
    };

    this.academicRecords.push(record);
    return record;
  }

  MYGetCumulativeGPA() {
    if (this.academicRecords.length === 0) return 0;
    const sum = this.academicRecords.reduce((acc, rec) => acc + rec.gradePoint, 0);
    return Number((sum / this.academicRecords.length).toFixed(2));
  }
}