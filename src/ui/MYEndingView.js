export const MY_ENDING_SCENES={
 big_tech:{file:'ending-big_tech.png',tone:'gold',chapter:'새로운 출발',lines:['최종 합격 통보를 받았다.','대기업 개발자로 첫 출근을 했다.']},
 sme:{file:'ending-sme.png',tone:'green',chapter:'꾸준함의 결실',lines:['IT 기업에 합격했다.','개발팀에 합류해 첫 업무를 시작했다.']},
 startup:{file:'ending-startup.png',tone:'green',chapter:'함께 만드는 내일',lines:['스타트업 개발팀에 합격했다.','팀원들과 함께 서비스를 개발하게 됐다.']},
 grad_school:{file:'ending-grad_school.png',tone:'blue',chapter:'끝나지 않은 탐구',lines:['졸업 후 대학원 진학을 선택했다.','컴퓨터공학 연구실에서 연구를 시작했다.']},
 founder:{file:'ending-founder.png',tone:'gold',chapter:'나만의 첫 서비스',lines:['모아 둔 자금으로 회사를 설립했다.','직접 개발한 서비스를 출시했다.']},
 unemployed:{file:'ending-unemployed.png',tone:'rust',chapter:'아직 끝나지 않은 도전',lines:['졸업까지 취업에 성공하지 못했다.','취업을 준비하며 다음 채용을 기다린다.']},
 bankrupt:{file:'ending-bankrupt.png',tone:'rust',chapter:'멈춰 버린 대학 생활',lines:['학비 또는 월세를 납부할 돈이 부족했다.','생활비를 감당하지 못해 학업을 중단했다.']},
 EXPELLED_CHEATING:{file:'ending-EXPELLED_CHEATING.png',tone:'rust',chapter:'돌이킬 수 없는 선택',lines:['시험 중 AI 안경 사용이 적발됐다.','부정행위로 퇴학 처분을 받았다.']}
};
function MYNode(tag,cls,text){const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function MYStatIcon(label){const image=MYNode('img','ending-stat-icon');image.src='assets/'+({'학점':'icon-intelligence.png','수상·자격증':'shop-certificate.svg','소지금':'icon-money.png'}[label]);image.alt='';return image;}
function MYEndingSummary(state){const records=state.bState?.academicRecords||[],gpa=records.length?records.reduce((sum,record)=>sum+Number(record.gradePoint),0)/records.length:null;return [['학점',gpa===null?'—':gpa.toFixed(2)+' / 4.5'],['수상·자격증',(state.bState?.awards||[]).length+'개'],['소지금',state.player.money.toLocaleString('ko-KR')+'원']];}
function MYPlayTrueEndingAnnouncement(reduceMotion=false){
 return new Promise(resolve=>{
  const dialog=MYNode('dialog','true-ending-announcement');dialog.setAttribute('aria-label','진엔딩 발생');
  if(reduceMotion)dialog.classList.add('reduce-motion');
  const light=MYNode('div','true-ending-light'),card=MYNode('div','true-ending-title');
  card.append(MYNode('span','true-ending-star','✦'),MYNode('small','','TRUE ENDING'),MYNode('h2','','진엔딩 발생!'),MYNode('span','true-ending-line',''));
  const skip=MYNode('button','true-ending-skip','계속');skip.type='button';dialog.append(light,card,skip);document.body.append(dialog);
  let done=false,timer;function MYFinish(){if(done)return;done=true;clearTimeout(timer);dialog.close();dialog.remove();resolve();}
  skip.addEventListener('click',MYFinish);dialog.addEventListener('cancel',event=>{event.preventDefault();MYFinish();});dialog.showModal();timer=setTimeout(MYFinish,reduceMotion?900:2400);
 });
}
export async function MYPlayEnding(ending,state,reduceMotion=false){
 const rule=MY_ENDING_SCENES[ending.id];if(!rule)return Promise.resolve();
 if(ending.id==='grad_school')await MYPlayTrueEndingAnnouncement(reduceMotion);
 return new Promise(resolve=>{
  const dialog=MYNode('dialog','ending-cinematic');dialog.dataset.tone=rule.tone;dialog.setAttribute('aria-label',ending.title+' 엔딩');
  const stage=MYNode('div','ending-cinematic-stage'),canvas=MYNode('canvas','ending-canvas');canvas.width=640;canvas.height=430;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',ending.title+' 장면');
  const curtain=MYNode('div','ending-curtain');curtain.append(MYNode('small','',state.completedWeeks>=192?'GRADUATION':'LAST CHAPTER'),MYNode('strong','',rule.chapter));
  const caption=MYNode('p','ending-story',''),seal=MYNode('div','ending-final-seal');seal.append(MYNode('small','',ending.id==='grad_school'?'TRUE ENDING · 진엔딩':'나의 대학 생활, 그 결말은'),MYNode('h2','',ending.title),MYNode('p','',ending.description.replaceAll('평점','학점')));
  stage.append(canvas,curtain,caption);const panel=MYNode('div','ending-cinematic-panel');panel.append(stage,seal);
  const summary=MYNode('div','ending-final-stats');for(const [label,value]of MYEndingSummary(state)){const item=MYNode('div','');item.append(MYStatIcon(label),MYNode('small','',label),MYNode('strong','',value));summary.append(item);}panel.append(summary);
  const controls=MYNode('div','ending-cinematic-controls'),skip=MYNode('button','','연출 건너뛰기'),confirm=MYNode('button','primary-button','결과 확인');skip.type=confirm.type='button';confirm.disabled=true;controls.append(skip,confirm);panel.append(controls);dialog.append(panel);document.body.append(dialog);
  let loaded=false,missing=false,done=false,revealed=false,startTime,frame;const image=new Image(),ctx=canvas.getContext('2d');let watchdog;
  function MYDraw(index,time=0){ctx.clearRect(0,0,640,430);ctx.fillStyle='#202b26';ctx.fillRect(0,0,640,430);if(!loaded)return;
   const w=missing?image.naturalWidth:image.naturalWidth/2,h=image.naturalHeight;
   // Fill the edge with a subdued blurred extension while preserving the full scene.
   ctx.save();ctx.filter='blur(16px)';ctx.globalAlpha=.5;ctx.drawImage(image,missing?0:index*w,0,w,h,-20,-20,680,470);ctx.restore();
   const scale=Math.min(640/w,430/h),dw=w*scale,dh=h*scale;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,missing?0:index*w,0,w,h,(640-dw)/2,(430-dh)/2,dw,dh);
   if(!reduceMotion&&!revealed&&time>2400){ctx.save();if(rule.tone!=='rust'){const colors=['#f2d783','#d4e9be','#f6f0d6'];for(let i=0;i<22;i++){ctx.fillStyle=colors[i%3];ctx.globalAlpha=.6;const x=(i*89+time*.009)%640,y=(i*57+time*.045)%430;ctx.fillRect(x,y,4,7);}}else{ctx.strokeStyle='#b6c1c1';ctx.globalAlpha=.18;ctx.lineWidth=1;for(let i=0;i<18;i++){const x=(i*83)%640,y=(i*71+time*.09)%430;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+12);ctx.stroke();}}ctx.restore();}
  }
  function MYReveal(){if(done||revealed)return;revealed=true;clearTimeout(watchdog);cancelAnimationFrame(frame);dialog.dataset.phase='result';caption.textContent=rule.lines[1];MYDraw(1);confirm.disabled=false;skip.hidden=true;confirm.focus();}
  function MYTick(time){if(done||revealed)return;startTime??=time;const elapsed=time-startTime;dialog.dataset.phase=elapsed<850?'intro':'story';caption.textContent=elapsed<2400?rule.lines[0]:rule.lines[1];MYDraw(elapsed<2400?0:1,elapsed);if(elapsed>=4800){MYReveal();return;}frame=requestAnimationFrame(MYTick);}
  function MYFinish(){if(done||!revealed)return;done=true;clearTimeout(watchdog);cancelAnimationFrame(frame);dialog.close();dialog.remove();resolve();}
  image.onload=()=>{loaded=true;MYDraw(revealed?1:0);};image.onerror=()=>{if(missing)return;missing=true;image.src='assets/shop-certificate.svg';};image.src='assets/'+rule.file;
  skip.addEventListener('click',MYReveal);confirm.addEventListener('click',MYFinish);dialog.addEventListener('cancel',event=>{event.preventDefault();MYReveal();});dialog.showModal();
  if(reduceMotion){dialog.classList.add('reduce-motion');MYReveal();}else{frame=requestAnimationFrame(MYTick);watchdog=setTimeout(MYReveal,9000);}
 });
}
export function MYBuildEndingMenu(body,state,reduceMotion=false){
 body.classList.add('ending-gallery');
 const intro=MYNode('section','ending-gallery-intro');intro.append(MYNode('small','',state.completedWeeks>=192?'GRADUATION RECORD':'UNIVERSITY LIFE RECORD'),MYNode('h3','',state.player.name+'의 대학 생활'),MYNode('p','',state.ending.length>1?'지금까지의 기록으로 열린 진로예요. 원하는 결말을 선택해 확인하세요.':'대학 생활의 마지막 장을 확인하세요.'));body.append(intro);
 const stats=MYNode('div','ending-menu-stats');for(const [label,value]of MYEndingSummary(state)){const item=MYNode('div','');item.append(MYStatIcon(label),MYNode('small','',label),MYNode('strong','',value));stats.append(item);}body.append(stats);
 const grid=MYNode('div','ending-choice-grid');let playing=false;
 for(const ending of state.ending){const rule=MY_ENDING_SCENES[ending.id],card=MYNode('article','ending-choice');card.dataset.endingId=ending.id;
  if(rule){const art=MYNode('div','ending-choice-art');art.style.backgroundImage='url("assets/'+rule.file+'")';art.setAttribute('role','img');art.setAttribute('aria-label',ending.title+' 장면');card.append(art);}
  const content=MYNode('div','ending-choice-copy');content.append(MYNode('h3','',ending.title),MYNode('p','',ending.description.replaceAll('평점','학점')));const button=MYNode('button','','결말 보기');button.type='button';button.addEventListener('click',async()=>{if(playing)return;playing=true;grid.querySelectorAll('button').forEach(node=>node.disabled=true);try{await MYPlayEnding(ending,state,reduceMotion);card.classList.add('is-viewed');button.textContent='다시 보기';}finally{playing=false;grid.querySelectorAll('button').forEach(node=>node.disabled=false);}});content.append(button);card.append(content);grid.append(card);
 }
 body.append(grid,MYNode('p','ending-unlock','새 회차의 상점에서 AI 안경이 해금됩니다.'));
 if(state.ending.length===1&&MY_ENDING_SCENES[state.ending[0].id])queueMicrotask(()=>grid.querySelector('button')?.click());
}
