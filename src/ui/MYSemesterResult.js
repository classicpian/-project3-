function MYNode(tag,cls,text){const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node;}
export function MYPlaySemesterResult(record,reduceMotion=false){
 return new Promise(resolve=>{
  const dialog=MYNode('dialog','semester-result-dialog');dialog.setAttribute('aria-label','학기 성적 발표');
  const paper=MYNode('div','semester-report'),heading=MYNode('header','semester-report-heading'),art=MYNode('img','');art.src='assets/shop-certificate.svg';art.alt='';
  const title=MYNode('div','');title.append(MYNode('small','','SEMESTER REPORT'),MYNode('h2','','학기 성적표'),MYNode('span','',record.semesterId.replace('-','학년 ')+'학기'));heading.append(title,art);paper.append(heading);
  const rows=MYNode('div','semester-score-rows'),steps=[];
  for(const [label,key,weight,icon]of [['중간고사','midScore',40,'icon-study.png'],['기말고사','finalScore',40,'icon-study.png'],['과제','assignmentScore',20,'shop-jokbo.svg']]){
   const row=MYNode('div','semester-score-row'),image=MYNode('img','');image.src='assets/'+icon;image.alt='';const name=MYNode('div','semester-score-name');name.append(MYNode('strong','',label),MYNode('small','',weight+'% 반영'));
   const score=MYNode('strong','semester-raw-score','—'),contribution=MYNode('b','semester-contribution','+0');row.append(image,name,score,MYNode('span','semester-multiply','→'),contribution);rows.append(row);steps.push({row,score,contribution,value:Number(record[key]),weighted:Number(record[key])*weight/100});
  }paper.append(rows);
  const total=MYNode('div','semester-total');total.append(MYNode('span','','최종 점수'));const count=MYNode('strong','','0'),unit=MYNode('small','','/ 100');total.append(count,unit);paper.append(total);
  const seal=MYNode('div','semester-grade-seal');seal.setAttribute('aria-live','polite');seal.append(MYNode('small','','이번 학기 학점'));const grade=MYNode('strong','','?'),point=MYNode('span','','성적을 정리하고 있어요');seal.append(grade,point);paper.append(seal);
  const status=MYNode('p','semester-result-status','중간고사 점수 확인 중…');status.setAttribute('role','status');paper.append(status);
  const buttons=MYNode('div','semester-result-controls'),skip=MYNode('button','','연출 건너뛰기'),confirm=MYNode('button','primary-button','성적 확인');skip.type=confirm.type='button';confirm.disabled=true;buttons.append(skip,confirm);paper.append(buttons);dialog.append(paper);document.body.append(dialog);
  let revealed=false,closed=false,frame;const timers=[];
  function MYReveal(){if(revealed||closed)return;revealed=true;timers.forEach(clearTimeout);cancelAnimationFrame(frame);for(const item of steps){item.row.classList.add('is-counted');item.score.textContent=item.value+'점';item.contribution.textContent='+'+Number(item.weighted.toFixed(1));}count.textContent=String(record.weightedScore);grade.textContent=record.grade;point.textContent=Number(record.gradePoint).toFixed(1)+' / 4.5';seal.dataset.tone=record.gradePoint>=3.5?'gold':record.gradePoint>=2?'green':'rust';dialog.dataset.phase='revealed';status.textContent='이번 학기 성적이 기록됐어요.';confirm.disabled=false;skip.hidden=true;confirm.focus();}
  function MYFinish(){if(!revealed||closed)return;closed=true;timers.forEach(clearTimeout);cancelAnimationFrame(frame);dialog.close();dialog.remove();resolve();}
  function MYCount(from,to){cancelAnimationFrame(frame);let start;function MYTick(time){if(closed||revealed)return;start??=time;const t=Math.min(1,(time-start)/450);count.textContent=String(Math.round(from+(to-from)*t));if(t<1)frame=requestAnimationFrame(MYTick);}frame=requestAnimationFrame(MYTick);}
  skip.addEventListener('click',MYReveal);confirm.addEventListener('click',MYFinish);dialog.addEventListener('cancel',event=>{event.preventDefault();MYReveal();});dialog.showModal();
  if(reduceMotion){dialog.classList.add('reduce-motion');MYReveal();return;}
  let accumulated=0;steps.forEach((item,index)=>{timers.push(setTimeout(()=>{if(revealed||closed)return;item.row.classList.add('is-counted');item.score.textContent=item.value+'점';item.contribution.textContent='+'+Number(item.weighted.toFixed(1));status.textContent=['중간고사 40% 반영 중…','기말고사 40% 반영 중…','과제 20% 반영 중…'][index];const previous=accumulated;accumulated+=item.weighted;MYCount(previous,accumulated);},350+index*650));});timers.push(setTimeout(MYReveal,2600));
 });
}
