// src/logic/MYExamService.js

import { MY_TOEIC_QUESTIONS } from './questions/MYToeicQuestions.js';
import { MY_CERT_QUESTIONS } from './questions/MYCertQuestions.js';

// 학기별 전공 시험 요구 지능 기준
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

// 전공 시험 난이도별 문제 은행
const MY_MAJOR_QUESTIONS = {
  easy: [
    {
      prompt: 'HTML에서 가장 큰 제목 태그는?',
      options: ['<h1>', '<head>', '<title>', '<h6>'],
      answerIndex: 0,
      explanation: 'HTML 제목 태그는 <h1>이 가장 크고 <h6>이 가장 작습니다.',
    },
    {
      prompt: '웹 페이지의 스타일(색상, 레이아웃 등)을 지정하는 언어는?',
      options: ['HTML', 'CSS', 'SQL', 'C'],
      answerIndex: 1,
      explanation: 'CSS(Cascading Style Sheets)는 웹 문서의 시각적 표현을 담당합니다.',
    },
    {
      prompt: '컴퓨터에서 1바이트(Byte)는 몇 비트(Bit)인가?',
      options: ['4비트', '8비트', '16비트', '32비트'],
      answerIndex: 1,
      explanation: '1바이트는 8비트로 구성됩니다.',
    },
    {
      prompt: 'JavaScript에서 재할당이 불가능한 상수를 선언하는 키워드는?',
      options: ['var', 'let', 'const', 'static'],
      answerIndex: 2,
      explanation: 'const는 블록 스코프의 상수를 선언할 때 사용합니다.',
    },
    {
      prompt: 'Git에서 로컬 변경 사항을 원격 저장소로 업로드하는 명령어는?',
      options: ['git pull', 'git push', 'git clone', 'git fetch'],
      answerIndex: 1,
      explanation: 'git push는 로컬 커밋을 원격 저장소로 전송합니다.',
    },
    {
      prompt: '다음 중 대표적인 관계형 데이터베이스(RDBMS)가 아닌 것은?',
      options: ['MySQL', 'PostgreSQL', 'Oracle', 'MongoDB'],
      answerIndex: 3,
      explanation: 'MongoDB는 문서 기반 NoSQL 데이터베이스입니다.',
    },
  ],
  normal: [
    {
      prompt: '이진 탐색(Binary Search)의 시간 복잡도는?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      answerIndex: 1,
      explanation: '매 단계마다 탐색 범위를 절반씩 줄이므로 O(log n)입니다.',
    },
    {
      prompt: 'HTTP 상태 코드 중 요청한 리소스를 찾을 수 없을 때 반환되는 코드는?',
      options: ['200', '301', '403', '404'],
      answerIndex: 3,
      explanation: '404 Not Found는 요청한 경로에 리소스가 존재하지 않음을 뜻합니다.',
    },
    {
      prompt: '스택(Stack) 자료구조의 데이터 입출력 방식은?',
      options: ['FIFO', 'LIFO', 'Random', 'Priority'],
      answerIndex: 1,
      explanation: '스택은 마지막에 들어온 데이터가 먼저 나가는 LIFO(후입선출) 구조입니다.',
    },
    {
      prompt: '운영체제에서 프로세스 내 실행 흐름의 최소 단위는?',
      options: ['스레드 (Thread)', '커널 (Kernel)', '레지스터 (Register)', '세그먼트 (Segment)'],
      answerIndex: 0,
      explanation: '스레드는 프로세스 자원을 공유하며 독립적으로 실행되는 최소 단위입니다.',
    },
    {
      prompt: 'SQL에서 중복된 행을 제거하고 조회할 때 사용하는 키워드는?',
      options: ['UNIQUE', 'DISTINCT', 'GROUP', 'FILTER'],
      answerIndex: 1,
      explanation: 'SELECT DISTINCT 컬럼명 형태로 중복 값을 제거합니다.',
    },
    {
      prompt: 'TCP가 신뢰성 있는 연결을 수립하기 위해 사용하는 절차는?',
      options: ['2-Way Handshake', '3-Way Handshake', '4-Way Handshake', 'Token Ring'],
      answerIndex: 1,
      explanation: 'TCP 연결 설정은 SYN → SYN+ACK → ACK의 3-Way Handshake를 거칩니다.',
    },
  ],
  hard: [
    {
      prompt: '교착 상태(Deadlock) 발생의 4가지 필요조건에 해당하지 않는 것은?',
      options: ['상호 배제', '점유와 대기', '선점 (Preemption)', '순환 대기'],
      answerIndex: 2,
      explanation: '교착 상태 조건은 상호 배제, 점유 대기, 비선점(Non-preemption), 순환 대기입니다.',
    },
    {
      prompt: '해시 테이블에서 서로 다른 키가 같은 해시 버킷에 매핑되는 현상은?',
      options: ['해시 충돌 (Collision)', '스래싱 (Thrashing)', '단편화 (Fragmentation)', '교착 상태'],
      answerIndex: 0,
      explanation: '해시 충돌은 체이닝(Chaining)이나 개방 주소법(Open Addressing)으로 해결합니다.',
    },
    {
      prompt: '다익스트라(Dijkstra) 최단 경로 알고리즘이 정상 동작하지 않는 그래프 조건은?',
      options: ['방향 그래프', '사이클이 있는 그래프', '음수 가중치 간선이 있는 그래프', '가중치가 모두 같은 그래프'],
      answerIndex: 2,
      explanation: '음수 가중치 간선이 있으면 벨만-포드(Bellman-Ford) 알고리즘을 사용해야 합니다.',
    },
    {
      prompt: '데이터베이스 트랜잭션 격리 수준 중 가장 높으며 모든 이상 현상을 방지하지만 동시성이 가장 낮은 수준은?',
      options: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
      answerIndex: 3,
      explanation: 'SERIALIZABLE은 트랜잭션을 순차 실행한 것과 동일한 결과를 보장합니다.',
    },
    {
      prompt: 'B-Tree 인덱스가 데이터베이스에서 널리 사용되는 가장 주된 이유는?',
      options: [
        '메모리 사용량이 0이기 때문에',
        '트리의 높이를 낮게 유지해 디스크 I/O 횟수를 최소화하기 때문에',
        '정렬이 필요 없기 때문에',
        '문자열만 저장할 수 있기 때문에',
      ],
      answerIndex: 1,
      explanation: 'B-Tree는 다진 균형 트리로 디스크 블록 접근 횟수를 크게 줄여줍니다.',
    },
    {
      prompt: '가상 메모리에서 페이지 교체 시 Belady의 모순(프레임이 늘었는데 페이지 부재가 증가)이 발생하는 알고리즘은?',
      options: ['LRU', 'OPT', 'FIFO', 'LFU'],
      answerIndex: 2,
      explanation: 'FIFO 페이지 교체 알고리즘은 스택 속성을 만족하지 않아 Belady의 모순이 발생할 수 있습니다.',
    },
  ],
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

    let difficulty = 'normal';
    if (playerIntelligence >= threshold + 20) {
      difficulty = 'easy';
    } else if (playerIntelligence < threshold) {
      difficulty = 'hard';
    }

    const pool = MY_MAJOR_QUESTIONS[difficulty] || MY_MAJOR_QUESTIONS.normal;
    const selected = MYPickRandom(pool, 4);

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
      questions: selected.map((q) => ({
        prompt: q.prompt,
        options: q.options,
        ...(hasAiGlasses ? { aiAnswerIndex: q.answerIndex } : {}),
      })),
    };
  }

  // 자격증 10종 시험 출제 (4문제 중 3문제 이상 합격)
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
      return {
        ok: true,
        examType: 'toeic',
        correctCount,
        score,
        reviews,
      };
    }

    const score = Math.round((correctCount / questions.length) * 100);
    return {
      ok: true,
      examType,
      correctCount,
      score,
      reviews,
    };
  }

  // 학기 최종 성적 산출 (중간 40% + 기말 40% + 과제 20%)
  MYCalculateSemesterGrade(semesterId, midScore, finalScore, assignmentScore) {
    const weightedScore = Math.round(midScore * 0.4 + finalScore * 0.4 + assignmentScore * 0.2);

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

  // 누적 평균 평점(GPA) 계산
  MYGetCumulativeGPA() {
    if (this.academicRecords.length === 0) return 0;
    const sum = this.academicRecords.reduce((acc, rec) => acc + rec.gradePoint, 0);
    return Math.round((sum / this.academicRecords.length) * 100) / 100;
  }
}