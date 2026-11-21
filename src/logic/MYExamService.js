// src/logic/MYExamService.js

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

// 전공 시험 문제 은행 (난이도별 4문제 이상)
const MY_CS_QUESTIONS = {
  easy: [
    {
      prompt: 'HTML에서 가장 큰 제목 태그는?',
      options: ['<h1>', '<h6>', '<head>', '<title>'],
      answerIndex: 0,
    },
    {
      prompt: 'JavaScript에서 상수를 선언할 때 사용하는 키워드는?',
      options: ['var', 'let', 'const', 'static'],
      answerIndex: 2,
    },
    {
      prompt: '배열의 길이를 구하는 속성은?',
      options: ['size', 'length', 'count', 'index'],
      answerIndex: 1,
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
    },
    {
      prompt: '스택(Stack) 자료구조의 입출력 방식은?',
      options: ['FIFO', 'LIFO', 'LILO', 'Random'],
      answerIndex: 1,
    },
  ],
  hard: [
    {
      prompt: '이진 탐색 트리의 평균 탐색 시간 복잡도는?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      answerIndex: 1,
    },
    {
      prompt: 'HTTP 상태 코드 중 "Not Found"는?',
      options: ['200', '301', '404', '500'],
      answerIndex: 2,
    },
    {
      prompt: '교착 상태(Deadlock)의 4가지 필요 조건이 아닌 것은?',
      options: ['상호 배제', '점유와 대기', '선점', '순환 대기'],
      answerIndex: 2,
    },
    {
      prompt: 'TCP와 UDP의 가장 큰 차이점은?',
      options: ['연결 지향 여부', 'IP 주소 사용 여부', '포트 번호 사용 여부', '패킷 전송 여부'],
      answerIndex: 0,
    },
    {
      prompt: '관계형 데이터베이스에서 테이블의 각 행을 유일하게 식별하는 키는?',
      options: ['Foreign Key', 'Primary Key', 'Index Key', 'Check Key'],
      answerIndex: 1,
    },
  ],
};

// 토익 시험 문제 은행 (난이도별 4문제)
const MY_TOEIC_QUESTIONS = {
  easy: [
    {
      prompt: 'The meeting will start _____ 10:00 AM.',
      options: ['at', 'on', 'in', 'to'],
      answerIndex: 0,
    },
    {
      prompt: 'Ms. Kim is responsible _____ managing the new project.',
      options: ['for', 'with', 'at', 'by'],
      answerIndex: 0,
    },
    {
      prompt: 'Please submit your report _____ Friday.',
      options: ['by', 'during', 'between', 'into'],
      answerIndex: 0,
    },
    {
      prompt: 'Our team _____ the software update yesterday.',
      options: ['completes', 'completed', 'completing', 'complete'],
      answerIndex: 1,
    },
  ],
  hard: [
    {
      prompt: 'The new policy was implemented _____ reduce operational costs.',
      options: ['in order to', 'so that', 'because of', 'despite'],
      answerIndex: 0,
    },
    {
      prompt: '_____ the heavy rain, the outdoor tech conference proceeded as scheduled.',
      options: ['Although', 'Despite', 'Even though', 'Whereas'],
      answerIndex: 1,
    },
    {
      prompt: 'All applicants must have a _____ understanding of cloud architecture.',
      options: ['thorough', 'thoroughly', 'thoroughness', 'through'],
      answerIndex: 0,
    },
    {
      prompt: 'Had the server _____ earlier, the data loss could have been avoided.',
      options: ['restarted', 'been restarted', 'restarting', 'to restart'],
      answerIndex: 1,
    },
  ],
};

// 토익 정답 수(0~4개)에 따른 점수 환산표
const MY_TOEIC_SCORE_TABLE = [250, 450, 650, 800, 950];

export class MYExamService {
  constructor() {
    this.academicRecords = []; // 학기별 성적 기록
    this.currentExam = null;   // 현재 진행 중인 시험 정보
  }

  // 시험 출제 (examType: 'mid' | 'final' | 'toeic')
  MYBuildExam(semesterId, examType, playerIntelligence, jokboUsed = false) {
    const semThresholds = MY_EXAM_THRESHOLDS[semesterId] || { mid: 1275, final: 1400 };
    let threshold = examType === 'final' ? semThresholds.final : semThresholds.mid;

    // 족보는 전공 시험(중간·기말)에만 적용
    if (examType !== 'toeic' && jokboUsed) {
      threshold = Math.max(0, threshold - 10);
    }

    const difficulty = playerIntelligence >= threshold ? 'easy' : 'hard';
    const bank = examType === 'toeic' ? MY_TOEIC_QUESTIONS[difficulty] : MY_CS_QUESTIONS[difficulty];

    // 4문제 추출
    const selected = bank.slice(0, 4);

    this.currentExam = {
      semesterId,
      examType,
      difficulty,
      threshold,
      questions: selected,
    };

    // UI 전달용 (정답 인덱스 제외)
    return {
      semesterId,
      examType,
      difficulty,
      threshold,
      questions: selected.map((q) => ({
        prompt: q.prompt,
        options: q.options,
      })),
    };
  }

  // 답안 제출 및 채점
  MYSubmitAnswers(answers) {
    if (!this.currentExam) {
      return { ok: false, reason: '진행 중인 시험이 없습니다.' };
    }
    if (!Array.isArray(answers) || answers.length !== this.currentExam.questions.length) {
      return { ok: false, reason: '모든 문항의 답안을 제출해야 합니다.' };
    }

    let correctCount = 0;
    this.currentExam.questions.forEach((q, idx) => {
      if (answers[idx] === q.answerIndex) {
        correctCount += 1;
      }
    });

    const { examType, semesterId, difficulty } = this.currentExam;
    const score =
      examType === 'toeic'
        ? MY_TOEIC_SCORE_TABLE[correctCount] ?? 250
        : correctCount * 25;

    this.currentExam = null;

    return {
      ok: true,
      examType,
      semesterId,
      difficulty,
      correctCount,
      score,
    };
  }

  // 학기 최종 성적 산출 (중간 30% + 기말 40% + 과제 30%)
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

  // 전체 누적 평점(GPA) 계산
  MYGetCumulativeGPA() {
    if (this.academicRecords.length === 0) return 0;
    const sum = this.academicRecords.reduce((acc, rec) => acc + rec.gradePoint, 0);
    return Number((sum / this.academicRecords.length).toFixed(2));
  }
}