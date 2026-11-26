function MYNode(tag,cls,text){const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node;}
export function MYPlayExamIntro(exam,reduceMotion=false){
 if(!['mid','final'].includes(exam.examType)||!['easy','hard'].includes(exam.difficulty))return Promise.resolve();
 return new Promise(resolve=>{
  const dialog=MYNode('dialog','exam-intro-dialog'),panel=MYNode('div','exam-intro-panel');dialog.setAttribute('aria-label','시험 난이도 결정');
  const eyebrow=MYNode('p','exam-intro-eyebrow',exam.semesterId.replace('-','학년 ')+'학기 · '+(exam.examType==='mid'?'중간고사':'기말고사'));
  const book=MYNode('img','exam-intro-book');book.src='assets/icon-study.png';book.alt='';
  const heading=MYNode('h2','','시험지를 준비하고 있어요');
  const compare=MYNode('div','exam-intro-compare');
  for(const [label,value]of [['현재 지능',exam.intelligence],['시험 기준',exam.threshold]]){const item=MYNode('div','');item.append(MYNode('span','',label),MYNode('strong','',String(value)));compare.append(item);}
  const scale=Math.max(1,exam.threshold,exam.intelligence)*1.15,track=MYNode('div','exam-intro-track'),fill=MYNode('div','exam-intro-fill'),marker=MYNode('span','exam-intro-marker');marker.style.left=Math.min(96,exam.threshold/scale*100)+'%';marker.title='시험 기준 '+exam.threshold;track.append(fill,marker);
  const status=MYNode('p','exam-intro-status','지능을 확인하는 중…');status.setAttribute('role','status');
  const options=MYNode('div','exam-intro-options'),easy=MYNode('div','exam-difficulty easy','쉬움'),hard=MYNode('div','exam-difficulty hard','어려움');options.append(easy,hard);
  const scene=MYNode('figure','exam-realm'),scenery=MYNode('img','exam-realm-picture'),seal=MYNode('figcaption','exam-realm-seal',exam.difficulty==='easy'?'쉬움':'어려움');scenery.src='assets/exam-'+(exam.difficulty==='easy'?'heaven':'hell')+'.png';scenery.alt=exam.difficulty==='easy'?'구름 위 황금 문과 햇빛이 있는 천국':'용암과 불길이 있는 지옥';scene.append(scenery,seal);
  const reason=MYNode('p','exam-intro-reason','지능과 기준을 비교해 난이도가 결정돼요.');
  const controls=MYNode('div','exam-intro-controls'),skip=MYNode('button','','연출 건너뛰기'),start=MYNode('button','primary-button','시험 시작');skip.type=start.type='button';start.disabled=true;controls.append(skip,start);
  panel.append(eyebrow,book,heading,compare,track,status,options,scene,reason,controls);dialog.append(panel);document.body.append(dialog);
  let revealed=false,closed=false;const timers=[];let animationFrame;
  function MYReveal(){if(revealed||closed)return;revealed=true;timers.forEach(clearTimeout);dialog.dataset.phase='revealed';dialog.dataset.difficulty=exam.difficulty;fill.style.width=Math.min(100,exam.intelligence/scale*100)+'%';(exam.difficulty==='easy'?easy:hard).classList.add('chosen');heading.textContent='시험 난이도가 결정됐어요';status.textContent=exam.difficulty==='easy'?'기준 지능 도달!':'기준 지능 미달';reason.textContent='지능 '+exam.intelligence+(exam.difficulty==='easy'?' ≥ ':' < ')+exam.threshold+' · '+(exam.difficulty==='easy'?'쉬운 문제로 출제됩니다.':'어려운 문제로 출제됩니다.');start.disabled=false;skip.hidden=true;start.focus();}
  function MYFinish(){if(closed||!revealed)return;closed=true;timers.forEach(clearTimeout);cancelAnimationFrame(animationFrame);dialog.close();dialog.remove();resolve();}
  skip.addEventListener('click',MYReveal);start.addEventListener('click',MYFinish);dialog.addEventListener('cancel',event=>{event.preventDefault();MYReveal();});dialog.showModal();
  if(reduceMotion){dialog.classList.add('reduce-motion');MYReveal();}else{animationFrame=requestAnimationFrame(()=>{dialog.dataset.phase='scanning';fill.style.width=Math.min(100,exam.intelligence/scale*100)+'%';});timers.push(setTimeout(()=>{status.textContent='시험 기준과 비교하는 중…';},850),setTimeout(MYReveal,2000));}
 });
}
