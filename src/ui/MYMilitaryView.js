function MYNode(tag,cls,text){const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node;}
export function MYMilitaryTimeline(ms){
 if(ms<1000)return {frame:0,step:0,title:'훈련소 생활',line:'삭발한 훈련생이 되어 동료들과 훈련을 시작했다.'};
 if(ms<9500)return {frame:Math.floor((ms-1000)/550)%4,step:1,title:'목봉체조',line:'하나, 둘! 동료들과 호흡을 맞춰 목봉을 들어 올린다.'};
 if(ms<11000)return {frame:3,step:2,title:'2년의 군 복무',line:'훈련과 복무를 마치고, 다시 학교로 돌아갈 시간.'};
 return {frame:1,step:3,title:'군 복무 완료 · 복학',line:'2년 뒤, 멈춰 두었던 대학 생활을 이어간다.'};
}
export function MYMilitaryReturnInfo(leave={}){
 const week=leave?.week??0,month=leave?.month??((Math.floor(week/4)+2)%12)+1,academicYear=leave?.academicYear??Math.floor(week/48)+1;
 const age=20+Math.floor(week/48),semester=month>=3&&month<=6?`${academicYear}학년 1학기`:month>=9?`${academicYear}학년 2학기`:[7,8].includes(month)?`${academicYear}학년 2학기 준비`:academicYear<4?`${academicYear+1}학년 1학기 준비`:'4학년 졸업 준비';
 return {enlistYear:leave?.enlistYear,returnYear:leave?.returnYear,month,age,returnAge:age+2,semester};
}
export function MYPlayMilitaryEvent(event={},reduceMotion=false){
 const info=MYMilitaryReturnInfo(event.militaryLeave);
 return new Promise(resolve=>{
  const dialog=MYNode('dialog','military-cinematic');dialog.setAttribute('aria-label','군 복무와 복학');if(reduceMotion)dialog.classList.add('reduce-motion');
  const header=MYNode('header','military-heading');header.append(MYNode('span','','군 휴학 · 2년'),MYNode('h2','','군 복무 완료 · 복학'));
  const stage=MYNode('section','military-stage'),canvas=MYNode('canvas','military-canvas');canvas.width=720;canvas.height=430;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','삭발한 주인공과 동료들이 같은 구도에서 목봉을 내렸다 들어 올리는 훈련');
  const line=MYNode('p','military-load-error');line.hidden=true;stage.append(canvas,line);
  const time=MYNode('div','military-time');time.append(MYNode('strong','',info.enlistYear?`${info.enlistYear}년 ${info.month}월 → ${info.returnYear}년 ${info.month}월`:'군 복무 · 2년 경과'),MYNode('span','',`${info.age}세 → ${info.returnAge}세 · 복학: ${info.semester}`));
  const effects=MYNode('div','military-final-effects');for(const [icon,label,value]of [['money','군 적금','+6,000,000원'],['health','체력','최대 120 · 전부 회복'],['stress','스트레스','0'],['intelligence','지능','−30%']]){const card=MYNode('div','military-effect'),image=MYNode('img','');image.src='assets/icon-'+icon+'.png';image.alt='';const copy=MYNode('div','');copy.append(MYNode('span','',label),MYNode('strong','',value));card.append(image,copy);effects.append(card);}
  const controls=MYNode('div','military-controls'),skip=MYNode('button','','연출 건너뛰기'),confirm=MYNode('button','primary-button','복학하기');skip.type=confirm.type='button';confirm.disabled=true;confirm.hidden=true;controls.append(skip,confirm);dialog.append(header,stage,time,effects,controls);document.body.append(dialog);
  const ctx=canvas.getContext('2d'),image=new Image();let loaded=false,failed=false,start,raf,done=false,revealed=false;
  function MYDraw(frame){ctx.fillStyle='#24362b';ctx.fillRect(0,0,720,430);if(!loaded)return;const w=image.naturalWidth/2,h=image.naturalHeight/2,x=(frame%2)*w,y=Math.floor(frame/2)*h;ctx.save();ctx.globalAlpha=.35;ctx.filter='blur(18px)';ctx.drawImage(image,x+1,y+1,w-2,h-2,-20,-20,760,470);ctx.restore();const scale=Math.min(720/w,430/h),dw=w*scale,dh=h*scale;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,x+1,y+1,w-2,h-2,(720-dw)/2,(430-dh)/2,dw,dh);}
  function MYPaint(ms){MYDraw(MYMilitaryTimeline(ms).frame);}
  function MYReveal(){if(done||revealed)return;revealed=true;cancelAnimationFrame(raf);dialog.dataset.phase='result';MYPaint(12500);confirm.disabled=false;confirm.hidden=false;skip.hidden=true;confirm.focus();}
  function MYTick(now){if(done||revealed)return;start??=now;const ms=now-start;MYPaint(ms);if(ms>=12500){MYReveal();return;}raf=requestAnimationFrame(MYTick);}
  function MYFinish(){if(done||!revealed)return;done=true;cancelAnimationFrame(raf);dialog.close();dialog.remove();resolve();}
  image.onload=()=>{loaded=true;MYPaint(revealed?12500:0);};image.onerror=()=>{failed=true;line.hidden=false;line.textContent='훈련 장면을 불러오지 못했어요. 연출을 건너뛰고 복학할 수 있어요.';};image.src='assets/military-log-training.png';
  skip.addEventListener('click',MYReveal);confirm.addEventListener('click',MYFinish);dialog.addEventListener('cancel',event=>{event.preventDefault();MYReveal();});dialog.showModal();if(reduceMotion)MYReveal();else raf=requestAnimationFrame(MYTick);
 });
}
