// src/logic/MYSaveRepository.js

import {MY_SHOP_ITEMS} from './MYShopService.js';
const MY_SAVE_KEY = 'COMGONG_SAVE_CHECKPOINT_V1';
const MY_SCHEMA_VERSION = 1;
const MYObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const MYNonnegative=value=>Number.isFinite(value)&&value>=0;
export function MYValidateSave(data){
 if(!MYObject(data)||!MYObject(data.player))return false;
 const p=data.player;
 if(!['health','maxHealth','intelligence','stress','money'].every(key=>MYNonnegative(p[key]))||p.maxHealth<=0||p.health>p.maxHealth||p.stress>100)return false;
 if(!Number.isSafeInteger(data.elapsedWeek)||data.elapsedWeek<0||data.elapsedWeek>192)return false;
 if(data.militaryLeave!=null&&(!MYObject(data.militaryLeave)||!Number.isSafeInteger(data.militaryLeave.week)||data.militaryLeave.week<0||data.militaryLeave.week>191||data.militaryLeave.week>data.elapsedWeek||data.militaryLeave.years!==2||p.isMilitaryDone!==true))return false;
 if(p.gender!==undefined&&!['male','female'].includes(p.gender))return false;
 if(p.spoon!==undefined&&(!MYObject(p.spoon)||!['diamond','gold','silver','dirt'].includes(p.spoon.id)))return false;
 for(const key of ['isBrokenUp','isMilitaryDone'])if(p[key]!==undefined&&typeof p[key]!=='boolean')return false;
 if(p.toeicScore!==undefined&&(!MYNonnegative(p.toeicScore)||p.toeicScore>990))return false;
 for(const key of ['awards','permanentItems','academicRecords','eventHistory','competitionRecords','assignmentHistory'])if(data[key]!==undefined&&!Array.isArray(data[key]))return false;
 const awardId=id=>typeof id==='string'&&(id==='HACKATHON'||/^HACKATHON:[1-4]:(5|11)$/.test(id)||id==='cert_security_bonus'||MY_SHOP_ITEMS[id]?.type==='cert_ticket');
 if(!(data.awards||[]).every(awardId)||!(data.permanentItems||[]).every(id=>MY_SHOP_ITEMS[id]?.type==='permanent'))return false;
 for(const key of ['inventory','weeklyUseCount'])if(data[key]!==undefined&&(!MYObject(data[key])||!Object.entries(data[key]).every(([id,count])=>MY_SHOP_ITEMS[id]?.type==='consumable'&&Number.isSafeInteger(count)&&count>=0)))return false;
 if(!(data.academicRecords||[]).every(r=>MYObject(r)&&/^[1-4]-[12]$/.test(r.semesterId)&&['midScore','finalScore','assignmentScore','weightedScore'].every(k=>MYNonnegative(r[k])&&r[k]<=100)&&MYNonnegative(r.gradePoint)&&r.gradePoint<=4.5&&typeof r.grade==='string'))return false;
 if(!(data.assignmentHistory||[]).every(r=>MYObject(r)&&/^[1-4]-[12]$/.test(r.semesterId)&&[3,4,5,6,9,10,11,12].includes(r.month)&&typeof r.success==='boolean'&&r.gained===(r.success?25:0)&&MYNonnegative(r.totalScore)&&r.totalScore<=100))return false;
 if(!(data.eventHistory||[]).every(r=>MYObject(r)&&['OVERWORK','BREAKUP','MILITARY'].includes(r.type)))return false;
 if(!(data.competitionRecords||[]).every(r=>MYObject(r)&&/^HACKATHON:[1-4]:(5|11)$/.test(r.id)&&Number.isSafeInteger(r.week)&&r.week>=0&&r.week<192&&typeof r.won==='boolean'))return false;
 for(const key of ['assignmentTotal','assignmentScore'])if(data[key]!==undefined&&(!MYNonnegative(data[key])||data[key]>100))return false;
 if(data.currentMidScore!==undefined&&(!MYNonnegative(data.currentMidScore)||data.currentMidScore>100))return false;
 if(data.weeksWithoutLeisure!==undefined&&(!Number.isSafeInteger(data.weeksWithoutLeisure)||data.weeksWithoutLeisure<0||data.weeksWithoutLeisure>192))return false;
 if(data.restrictedNextWeek!==undefined&&typeof data.restrictedNextWeek!=='boolean')return false;
 if(data.activeEffects!==undefined){const e=data.activeEffects;if(!MYObject(e)||!Number.isSafeInteger(e.gptPlusWeeksLeft)||e.gptPlusWeeksLeft<0||typeof e.jokboActive!=='boolean'||typeof e.toeicPending!=='boolean'||(e.pendingCertId!==null&&MY_SHOP_ITEMS[e.pendingCertId]?.type!=='cert_ticket'))return false;}
 if(data.paymentRecords!==undefined){if(!MYObject(data.paymentRecords))return false;for(const key of ['rent','tuition']){const entries=data.paymentRecords[key];if(!Array.isArray(entries)||!entries.every(v=>typeof v==='string'&&(key==='tuition'?/^[1-4]-[12]$/.test(v):/^[1-4]-(1[0-2]|[1-9])$/.test(v))))return false;}}
 if(data.endingCandidates!=null&&(!Array.isArray(data.endingCandidates)||!data.endingCandidates.length||!data.endingCandidates.every(e=>MYObject(e)&&['big_tech','sme','startup','grad_school','founder','unemployed','bankrupt','EXPELLED_CHEATING'].includes(e.id)&&typeof e.title==='string'&&typeof e.description==='string')))return false;
 if(data.ui!==undefined){const u=data.ui;if(!MYObject(u)||typeof u.name!=='string'||!u.name.trim()||u.name.length>40)return false;
  if(u.introPhase!==undefined&&!['spoon','entrance','done'].includes(u.introPhase))return false;
  if(u.monthPlan!==undefined&&(!MYObject(u.monthPlan)||u.monthPlan.monthIndex!==Math.floor(data.elapsedWeek/4)||!Array.isArray(u.monthPlan.activities)||u.monthPlan.activities.length!==4||!u.monthPlan.activities.every(v=>v===null||['study','work','leisure','rest'].includes(v))))return false;
  if(u.environment!==undefined&&(!MYObject(u.environment)||u.environment.weekId!==data.elapsedWeek||!['sun','cloud','rain','snow'].includes(u.environment.weather)||!Number.isInteger(u.environment.action)||u.environment.action<0||u.environment.action>3))return false;
 }
 return true;
}

export class MYSaveRepository {
  // 주간 완료 상태 저장
  MYSaveCheckpoint(stateObject) {
    try {
      const payload = {
        schemaVersion: MY_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        data: stateObject,
      };
      const serialized = JSON.stringify(payload);
      localStorage.setItem(MY_SAVE_KEY, serialized);
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: '저장 공간 부족 또는 직렬화 오류로 저장에 실패했습니다.' };
    }
  }

  // 저장된 체크포인트 불러오기 및 유효성 검사
  MYLoadCheckpoint() {
    try {
      const raw = localStorage.getItem(MY_SAVE_KEY);
      if (!raw) return { ok: false, reason: '저장된 기록이 없습니다.' };

      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== MY_SCHEMA_VERSION || !parsed.data || !parsed.data.player) {
        return { ok: false, reason: '저장 데이터 형식이 손상되었거나 버전이 일치하지 않습니다.' };
      }

      const { player, elapsedWeek } = parsed.data;
      if (
        !Number.isFinite(player.money) ||
        player.money < 0 ||
        !Number.isSafeInteger(elapsedWeek) ||
        elapsedWeek < 0 ||
        elapsedWeek > 192
      ) {
        return { ok: false, reason: '저장 데이터 수치가 유효 범위를 벗어났습니다.' };
      }

      if(!['health','maxHealth','intelligence','stress'].every(k=>Number.isFinite(player[k]) && player[k]>=0) || player.maxHealth<=0 || player.health>player.maxHealth || player.stress>100) return {ok:false,reason:'능력치 데이터가 올바르지 않습니다.'};
      if(!MYValidateSave(parsed.data))return {ok:false,reason:'저장된 기록·아이템·일정 데이터가 올바르지 않습니다.'};
      return { ok: true, data: parsed.data };
    } catch (error) {
      return { ok: false, reason: '손상된 JSON 데이터로 인해 불러올 수 없습니다.' };
    }
  }

  // 저장 기록 삭제 (새 게임 덮어쓰기용)
  MYClearCheckpoint() {
    localStorage.removeItem(MY_SAVE_KEY);
  }
}
