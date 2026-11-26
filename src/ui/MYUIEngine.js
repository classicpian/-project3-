// A 화면과 B Worker 사이의 연결 계층. 게임 수치 계산은 B 서비스가 담당한다.
import { MYGameController } from '../logic/MYGameController.js';

export class MYUIEngine {
  constructor(hooks={}) {
    this.hooks=hooks;this.raw=null;this.meta=null;this.pending=null;
    this.controller=new MYGameController({
      onState:msg=>this.MYReceive(msg),onWeekDone:msg=>this.MYReceive(msg),
      onWaitExam:msg=>this.MYWaitExam(msg),onAdvice:advice=>hooks.onAdvice?.(advice),
      onError:reason=>this.MYFail(reason)
    });
  }
  MYFail(reason) {
    this.controller.isBusy=false;
    if(this.pending){clearTimeout(this.pending.timer);const p=this.pending;this.pending=null;p.reject(new Error(reason));}
    else this.hooks.onAdvice?.([reason]);
  }
  MYReceive(msg) {
    if(!this.pending || msg.requestId!==this.pending.requestId)return;
    clearTimeout(this.pending.timer);
    this.raw=structuredClone(msg.state);
    if(msg.ended && msg.endings?.length)this.raw.endingCandidates=msg.endings;
    if(msg.type==='WEEK_DONE'){this.MYNormalizeMeta();msg.saveRes=this.MYSave();}
    if(this.raw.endingCandidates?.length){try{localStorage.setItem('MY_GAME_CLEARED','true');}catch{}}
    const p=this.pending;this.pending=null;p.resolve(msg);
  }
  MYCommand(type,payload={}) {
    if(this.pending || this.controller.isBusy)return Promise.reject(new Error('이전 요청을 처리 중입니다.'));
    return new Promise((resolve,reject)=>{
      this.pending={resolve,reject,requestId:this.controller.requestSeq+1};
      this.pending.timer=setTimeout(()=>{this.controller.isBusy=false;this.MYFail('처리 응답이 없습니다. 마지막 저장을 불러오세요.');},15000);
      this.controller.MYSendCommand(type,payload);
    });
  }
  async MYWaitExam(msg) {
    if(!this.pending || msg.requestId!==this.pending.requestId)return;
    clearTimeout(this.pending.timer);
    try {
      if(msg.examResult)await this.hooks.onExamResult?.(msg.examResult);
      const answers=await this.hooks.onExam(msg.exam);
      if(!this.pending)return;
      this.pending.requestId=this.controller.requestSeq+1;
      this.pending.timer=setTimeout(()=>this.MYFail('시험 제출 응답이 없습니다.'),15000);
      this.controller.MYSendCommand('SUBMIT_EXAM',{answers});
    } catch(error){this.MYFail(error.message);}
  }
  MYNormalizeMeta(name) {
    const week=this.raw.elapsedWeek;
    this.meta ||= {name:name||'플레이어'};
    if(!this.meta.monthPlan || this.meta.monthPlan.monthIndex!==Math.floor(week/4))this.meta.monthPlan={monthIndex:Math.floor(week/4),activities:[null,null,null,null]};
    if(week===0)this.meta.environment=this.hooks.createEnvironment(0,false,null);
    else if(!this.meta.environment || this.meta.environment.weekId!==week)this.meta.environment=this.hooks.createEnvironment(week,false,this.meta.environment);
  }
  async MYNewGame(name) {
    await this.MYCommand('INIT',{gender:'male'});
    this.meta={name};this.MYNormalizeMeta(name);return this.MYGetState();
  }
  MYGetState() {
    if(!this.raw)return null;
    this.MYNormalizeMeta();
    return structuredClone({version:1,completedWeeks:this.raw.elapsedWeek,
      player:{...this.raw.player,name:this.meta.name,age:20+Math.min(4,Math.floor(this.raw.elapsedWeek/48))+(this.raw.militaryLeave?2:0)},
      environment:this.meta.environment,monthPlan:this.meta.monthPlan,
      ending:this.raw.endingCandidates, bState:{...this.raw,ui:this.meta}});
  }
  MYSetIntroPhase(phase) {this.meta.introPhase=phase;return this.MYGetState();}
  MYSetMonthPlan(plan) {
    if(!this.raw || this.raw.endingCandidates)throw new Error('게임이 시작되지 않았거나 종료되었습니다.');
    this.MYNormalizeMeta();const current=this.raw.elapsedWeek%4;
    if(!Array.isArray(plan) || plan.length!==4 || !plan.slice(current).every(v=>['study','work','leisure','rest'].includes(v)))throw new Error('남은 모든 주의 활동을 선택해주세요.');
    for(let i=0;i<current;i++)if(plan[i]!==this.meta.monthPlan.activities[i])throw new Error('완료한 주는 수정할 수 없습니다.');
    this.meta.monthPlan.activities=[...plan];return this.MYGetState();
  }
  async MYRunWeek(activityId) {
    if(!this.raw || this.raw.endingCandidates || this.raw.elapsedWeek>=192)throw new Error('이미 종료된 게임입니다.');
    const before=this.MYGetState();
    if(before.monthPlan.activities[before.completedWeeks%4]!==activityId)throw new Error('이번 주 계획과 선택한 활동이 다릅니다.');
    const msg=await this.MYCommand('RUN_WEEK',{activityId:activityId==='work'?'partTime':activityId});
    this.MYNormalizeMeta();const after=this.MYGetState();
    const actualActivityId=before.bState.restrictedNextWeek?'rest':activityId;
    return {state:after,result:{weekId:before.completedWeeks,activityId:actualActivityId,actualActivityId,
      monthActivities:before.monthPlan.activities,before:before.player,after:after.player,
      examResult:msg.result?.examResult,
      logs:msg.result?.logs || (after.ending||[]).map(e=>e.description)}};
  }
  MYSave() {
    if(!this.raw)return {ok:false,message:'저장할 게임이 없습니다.'};
    const res=this.controller.saveRepo.MYSaveCheckpoint({...this.raw,ui:this.meta});
    return {...res,message:res.reason};
  }
  MYHasSave(){return this.controller.saveRepo.MYLoadCheckpoint().ok;}
  async MYLoad() {
    const saved=this.controller.saveRepo.MYLoadCheckpoint();
    if(!saved.ok)return {ok:false,message:saved.reason};
    const ui=saved.data.ui;
    if(ui?.monthPlan && (!Array.isArray(ui.monthPlan.activities)||ui.monthPlan.activities.length!==4||!ui.monthPlan.activities.every(v=>v===null||['study','work','leisure','rest'].includes(v))))return {ok:false,message:'일정 저장 데이터가 올바르지 않습니다.'};
    try {await this.MYCommand('RESTORE',{savedData:saved.data});this.meta=ui||{name:'플레이어'};this.MYNormalizeMeta();return {ok:true,state:this.MYGetState()};}
    catch(e){return {ok:false,message:e.message};}
  }
  async MYRestore(checkpoint) {
    if(!checkpoint?.bState)return;
    await this.MYCommand('RESTORE',{savedData:checkpoint.bState});this.meta=structuredClone(checkpoint.bState.ui);this.MYNormalizeMeta();
  }
  async MYAction(type,payload) {
    if(this.raw?.endingCandidates)throw new Error('이미 종료된 게임입니다.');
    const msg=await this.MYCommand(type,payload);this.MYNormalizeMeta();
    const saved=this.MYSave();return {state:this.MYGetState(),message:(msg.result?.message||'처리했습니다.')+(saved.ok?'':' / '+saved.message)};
  }
}
