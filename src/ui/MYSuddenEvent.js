const MY_EVENTS={OVERWORK:{title:'무리한 한 주',line:'잠깐만 쉬려고 했는데… 몸이 말을 듣지 않는다.',effect:'다음 주 강제 휴식',detail:'선택한 활동 대신 체력 +30 · 스트레스 −10',file:'event-overwork.png',icon:'icon-rest.png'},BREAKUP:{title:'이별, 멀어진 마음',line:'미뤄 둔 연락들. 휴대폰 화면에 마지막 인사가 남았다.',effect:'체력 −30 · 스트레스 +60',detail:'능력치 범위에 따라 실제 변화량이 제한될 수 있어요.',file:'event-breakup.png',icon:'icon-stress.png'}};
function MYNode(tag,cls,text){const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;}
export function MYNewSuddenEvents(before,after){return (after.eventHistory||[]).slice((before.eventHistory||[]).length).filter(event=>Object.hasOwn(MY_EVENTS,event.type));}
function MYPlayEventAnnouncement(reduceMotion){
 if(reduceMotion)return Promise.resolve();
 return new Promise(resolve=>{
  const dialog=MYNode('dialog','event-announcement-dialog');dialog.setAttribute('aria-label','돌발 이벤트 발생 알림');
  const ribbon=MYNode('div','event-announcement-ribbon');ribbon.append(MYNode('span','event-announcement-icon','!'),MYNode('h2','','돌발 이벤트 발생!'));
  const skip=MYNode('button','event-announcement-skip','넘기기');skip.type='button';dialog.append(ribbon,skip);document.body.append(dialog);
  let done=false,timer;function MYFinish(){if(done)return;done=true;clearTimeout(timer);dialog.close();dialog.remove();resolve();}
  skip.addEventListener('click',MYFinish);dialog.addEventListener('cancel',event=>{event.preventDefault();MYFinish();});dialog.showModal();timer=setTimeout(MYFinish,1600);
 });
}
export {MYPlayMilitaryEvent} from './MYMilitaryView.js';
export async function MYPlaySuddenEvent(event,reduceMotion=false){
 const rule=MY_EVENTS[event.type];if(!rule)return Promise.resolve();
 await MYPlayEventAnnouncement(reduceMotion);
 return new Promise(resolve=>{
  const dialog=MYNode('dialog','sudden-event-dialog'),panel=MYNode('div','sudden-event-panel');dialog.setAttribute('aria-label','돌발 이벤트');dialog.dataset.type=event.type;
  const scene=MYNode('section','sudden-event-scene'),canvas=MYNode('canvas','sudden-event-canvas');canvas.width=480;canvas.height=360;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',event.type==='OVERWORK'?'공부하다 지쳐 책상에 엎드리는 캐릭터':'휴대폰을 보다가 고개를 숙이는 캐릭터');
  const title=MYNode('h3','',rule.title),line=MYNode('p','sudden-event-line',rule.line),impact=MYNode('div','sudden-event-impact');impact.append(MYNode('strong','',rule.effect),MYNode('small','',rule.detail));scene.append(canvas,title,line,impact);
  const controls=MYNode('div','sudden-event-controls'),skip=MYNode('button','','연출 건너뛰기'),confirm=MYNode('button','primary-button','확인');skip.type=confirm.type='button';confirm.disabled=true;controls.append(skip,confirm);panel.append(scene,controls);dialog.append(panel);document.body.append(dialog);
  let closed=false,revealed=false,loaded=false,fallback=false,started=false,startTime,frame;const timers=[],image=new Image(),ctx=canvas.getContext('2d');
  function MYDraw(index){ctx.clearRect(0,0,480,360);ctx.fillStyle='#ece4cd';ctx.fillRect(0,0,480,360);if(!loaded)return;ctx.imageSmoothingEnabled=false;if(fallback){ctx.drawImage(image,190,130,100,100);return;}const w=image.naturalWidth/2,h=image.naturalHeight,scale=Math.min(480/w,360/h),dw=w*scale,dh=h*scale;ctx.drawImage(image,index*w,0,w,h,(480-dw)/2,(360-dh)/2,dw,dh);}
  function MYReveal(){if(closed||revealed)return;revealed=true;timers.forEach(clearTimeout);cancelAnimationFrame(frame);dialog.dataset.phase='impact';MYDraw(1);confirm.disabled=false;skip.hidden=true;confirm.focus();}
  function MYTick(time){if(closed||revealed)return;startTime??=time;const elapsed=time-startTime;MYDraw(elapsed<(rule.swap||1050)?0:1);if(elapsed>=(rule.duration||2400)){MYReveal();return;}frame=requestAnimationFrame(MYTick);}
  function MYStartScene(){if(closed||started)return;started=true;dialog.dataset.phase='scene';if(reduceMotion){MYReveal();return;}frame=requestAnimationFrame(MYTick);}
  function MYFinish(){if(closed||!revealed)return;closed=true;timers.forEach(clearTimeout);cancelAnimationFrame(frame);dialog.close();dialog.remove();resolve();}
  image.onload=()=>{loaded=true;MYDraw(revealed?1:0);};image.onerror=()=>{if(fallback)return;fallback=true;image.src='assets/'+rule.icon;};image.src='assets/'+rule.file;
  skip.addEventListener('click',MYReveal);confirm.addEventListener('click',MYFinish);dialog.addEventListener('cancel',event=>{event.preventDefault();MYReveal();});
  dialog.showModal();if(reduceMotion)dialog.classList.add('reduce-motion');MYStartScene();
 });
}

