import {MYCalendarYearForTurn} from '../logic/MYCalendar.js';
const MY_EVENT_TYPES={competition:{name:'해커톤',icon:'shop-certificate.svg'},rent:{name:'월세 내기',icon:'icon-money.png'},tuition:{name:'학비 납부',icon:'icon-work.png'},mid:{name:'중간고사',icon:'icon-study.png'},final:{name:'기말고사',icon:'icon-study.png'},assignment:{name:'과제 마감',icon:'shop-jokbo.svg'},semester:{name:'학기 시작',icon:'icon-study.png'},summer:{name:'여름방학!',icon:'icon-leisure.png'},winter:{name:'겨울방학!',icon:'icon-rest.png'}};
function MYNode(tag,cls,text){const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function MYIcon(type){const img=MYNode('img','annual-icon');img.src='assets/'+MY_EVENT_TYPES[type].icon;img.alt=MY_EVENT_TYPES[type].name;return img;}
export function MYAnnualEvents(year,month){
 const last=new Date(Date.UTC(year,month,0)).getUTCDate(),events=[{day:last,type:'rent',text:'월세 600,000원 · 수저 지원 적용'}];
 if([3,9].includes(month))events.push({day:1,type:'tuition',text:year===2026&&month===3?'첫 학기 학비 · 입학 전 납부 완료':'학기 시작 · 학비 2,000,000원에서 장학금·수저 지원 적용'});
 if([3,9].includes(month))events.push({day:1,type:'semester',label:month===3?'1학기 시작':'2학기 시작',text:month===3?'3월 1일 · 1학기 시작':'9월 1일 · 2학기 시작'});
 if(month===7)events.push({day:1,type:'summer',text:'7월 1일 · 여름방학 시작 (7~8월)'});
 if(month===1)events.push({day:1,type:'winter',text:'1월 1일 · 겨울방학 시작 (1~2월)'});
 if([4,10].includes(month))events.push({day:last,type:'mid',text:'4주차 활동 실행 시 중간고사'});
 if([6,12].includes(month)){events.push({day:last,type:'final',text:'4주차 활동 실행 시 기말고사'},{day:last,type:'assignment',text:'기말고사 주차 · 과제 마감'});}
 if([5,11].includes(month))events.push({day:15,type:'competition',text:'3주차(15~21일) 해커톤 · 이번 대회 1회 참가 가능'});
 return events;
}
export function MYBuildAnnualCalendar(body,state,initialYear){
 let selectedYear=initialYear??Math.min(4,Math.floor(state.completedWeeks/48)+1);
 let selectedMonth=((Math.floor(Math.min(state.completedWeeks,191)/4)+2)%12)+1;
 const currentTurn=Math.min(state.completedWeeks,191),currentAcademic=Math.floor(currentTurn/48)+1,currentMonth=((Math.floor(currentTurn/4)+2)%12)+1,currentWeek=currentTurn%4+1;
 function MYRender(){
  body.replaceChildren();
  const startYear=2025+selectedYear;
  const details=MYNode('section','annual-details');details.setAttribute('aria-live','polite');details.hidden=true;
  const grid=MYNode('div','annual-months');body.append(grid);
  for(let index=0;index<12;index++){
   const month=(index+2)%12+1,year=MYCalendarYearForTurn((selectedYear-1)*48+index*4+3,state.bState?.militaryLeave),events=MYAnnualEvents(year,month),days=new Date(Date.UTC(year,month,0)).getUTCDate(),offset=new Date(Date.UTC(year,month-1,1)).getUTCDay();
   if(selectedYear===1&&month===3){const tuition=events.find(event=>event.type==='tuition');if(tuition)tuition.text='첫 학기 학비 · 입학 전 납부 완료';}
   if(month!==selectedMonth)continue;
   const card=MYNode('section','annual-month'),header=MYNode('div','annual-month-title');if(selectedYear===currentAcademic&&month===currentMonth)card.classList.add('is-current');
   const previousMonth=MYNode('button','paper-month-arrow','‹'),nextMonth=MYNode('button','paper-month-arrow','›');previousMonth.type=nextMonth.type='button';previousMonth.setAttribute('aria-label','이전 달');nextMonth.setAttribute('aria-label','다음 달');previousMonth.disabled=selectedYear===1&&month===3;nextMonth.disabled=selectedYear===4&&month===2;
   previousMonth.addEventListener('click',()=>{if(selectedMonth===3)selectedYear--;selectedMonth=selectedMonth===1?12:selectedMonth-1;MYRender();});nextMonth.addEventListener('click',()=>{if(selectedMonth===2)selectedYear++;selectedMonth=selectedMonth===12?1:selectedMonth+1;MYRender();});
   const title=MYNode('div','paper-month-name');title.append(MYNode('span','paper-year',String(year)),MYNode('h3','',String(month).padStart(2,'0')),MYNode('span','paper-season', ['겨울','겨울','봄','봄','봄','여름','여름','여름','가을','가을','가을','겨울'][month-1]));header.append(previousMonth,title,nextMonth);card.append(header);
   const dates=MYNode('div','annual-days');for(const name of ['일','월','화','수','목','금','토'])dates.append(MYNode('span','annual-weekday',name));for(let n=0;n<offset;n++)dates.append(MYNode('span','annual-blank'));
   for(let day=1;day<=days;day++){
    const items=events.filter(event=>event.day===day),cell=MYNode(items.length?'button':'span','annual-day');cell.append(MYNode('span','annual-number',String(day)));
    const weekday=(offset+day-1)%7;if(weekday===0)cell.classList.add('is-sunday');if(weekday===6)cell.classList.add('is-saturday');
    if(selectedYear===currentAcademic&&month===currentMonth&&day>=(currentWeek-1)*7+1&&day<=(currentWeek===4?days:currentWeek*7))cell.classList.add('is-current-week');
    if(items.length){cell.type='button';cell.classList.add('has-event');const pictures=MYNode('span','annual-pictures');for(const event of items){const mark=MYNode('span','annual-event-mark '+event.type);mark.append(MYIcon(event.type),MYNode('span','',event.label||MY_EVENT_TYPES[event.type].name));pictures.append(mark);}cell.append(pictures);const label=year+'년 '+month+'월 '+day+'일 · '+items.map(event=>event.label||MY_EVENT_TYPES[event.type].name).join(', ');cell.setAttribute('aria-label',label);cell.title=label;
     cell.addEventListener('click',()=>{body.querySelectorAll('.annual-day.is-selected').forEach(node=>node.classList.remove('is-selected'));cell.classList.add('is-selected');details.hidden=false;details.replaceChildren(MYNode('strong','',year+'년 '+month+'월 '+day+'일'));for(const event of items){const row=MYNode('div','annual-detail-row');row.append(MYIcon(event.type),MYNode('span','',event.text));details.append(row);}});
    }dates.append(cell);
   }card.append(dates,details);grid.append(card);
  }
 }
 MYRender();
}
