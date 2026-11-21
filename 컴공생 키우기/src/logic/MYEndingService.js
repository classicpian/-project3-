// src/logic/MYEndingService.js

export class MYEndingService {
  // 졸업 시 달성 가능한 엔딩 후보 목록 계산
  MYEvaluateEndings({ gpa, awardCount, money, isBankrupt = false, bankruptReason = '' }) {
    if (isBankrupt) {
      return [
        {
          id: 'bankrupt',
          title: '파산 엔딩',
          category: '중도 종료',
          description: bankruptReason || '학비 또는 월세를 납부하지 못해 학업을 중단했습니다.',
        },
      ];
    }

    const candidates = [];

    // 1. 대기업 취업 (높은 누적 학점 + 수상 실적 2회 이상)
    if (gpa >= 3.8 && awardCount >= 2) {
      candidates.push({
        id: 'big_tech',
        title: '대기업 취업',
        category: '취업',
        description: `누적 평점 ${gpa}, 수상/자격증 ${awardCount}회로 꿈의 대기업에 입사했습니다!`,
      });
    }

    // 2. 스타트업 취업 (평점 3.2 이상 + 수상 실적 1회 이상)
    if (gpa >= 3.2 && awardCount >= 1) {
      candidates.push({
        id: 'startup',
        title: '유망 스타트업 취업',
        category: '취업',
        description: `실무 역량과 수상 실적(${awardCount}회)을 인정받아 유망 스타트업에 합류했습니다.`,
      });
    }

    // 3. 중소기업 취업 (평점 2.5 이상)
    if (gpa >= 2.5) {
      candidates.push({
        id: 'sme',
        title: '중소기업 취업',
        category: '취업',
        description: `꾸준한 대학 생활 끝에 안정적인 IT 기업에 취업했습니다. (평점 ${gpa})`,
      });
    }

    // 4. 대학원 진학 (학점 4.0 이상)
    if (gpa >= 4.0) {
      candidates.push({
        id: 'grad_school',
        title: '대학원 진학',
        category: '진학',
        description: `탁월한 학업 성취(평점 ${gpa})를 인정받아 대학원 연구실에 진학했습니다.`,
      });
    }

    // 5. 창업 (충분한 자본금 1,000만 원 이상)
    if (money >= 10000000) {
      candidates.push({
        id: 'founder',
        title: 'IT 스타트업 창업',
        category: '창업',
        description: `모아둔 시드머니 ${money.toLocaleString()}원으로 나만의 서비스를 창업했습니다!`,
      });
    }

    // 6. 조건 미달 시 백수 엔딩
    if (candidates.length === 0) {
      candidates.push({
        id: 'unemployed',
        title: '취업 준비생 (백수)',
        category: '미달',
        description: '졸업은 했지만 취업 기준에 미달하여 다시 취업을 준비하게 되었습니다.',
      });
    }

    return candidates;
  }
}