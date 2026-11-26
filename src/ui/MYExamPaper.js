function MYNode(tag,cls,text){const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node;}
export function MYExamTitle(exam){return exam.examType==='cert'?exam.certName+' 시험':exam.examType==='toeic'?'토익 시험':(exam.semesterId||'').replace('-','학년 ')+'학기 '+(exam.examType==='mid'?'중간고사':'기말고사');}
function MYHeader(exam,name,label){
 const header=MYNode('header','exam-paper-header'),top=MYNode('div','paper-header-top');top.append(MYNode('span','','컴공생 키우기 · '+label),MYNode('b','','EXAMINATION'));header.append(top,MYNode('h2','',MYExamTitle(exam)));
 const meta=MYNode('div','exam-paper-meta');for(const [key,value]of [['성명',name],['문항','4문제'],['난이도',exam.difficulty==='easy'?'쉬움':exam.difficulty==='hard'?'어려움':'공통']]){const field=MYNode('span','paper-meta-field');field.append(MYNode('small','',key),MYNode('strong','',value));meta.append(field);}header.append(meta);return header;
}
export function MYSolveExamPaper(exam,name){
 return new Promise(resolve=>{
  const dialog=MYNode('dialog','exam-paper-dialog'),form=MYNode('form','exam-paper');dialog.setAttribute('aria-label','시험지');form.append(MYHeader(exam,name,'전공 및 역량 평가'));
  const questions=MYNode('div','exam-paper-questions');
  exam.questions.forEach((question,index)=>{const field=MYNode('fieldset','paper-question'),legend=MYNode('legend','');legend.append(MYNode('b','paper-question-number',String(index+1).padStart(2,'0')),document.createTextNode(question.prompt));field.append(legend);
   question.options.forEach((option,answer)=>{const label=MYNode('label','paper-option'),radio=MYNode('input','');radio.type='radio';radio.name='paper-answer-'+index;radio.value=String(answer);const number=MYNode('span','paper-option-number',['①','②','③','④','⑤'][answer]||String(answer+1));label.append(radio,number,MYNode('span','',option));if(question.aiAnswerIndex===answer)label.append(MYNode('b','paper-ai','AI 정답'));field.append(label);});questions.append(field);
  });form.append(questions);
  const footer=MYNode('footer','exam-paper-footer'),progress=MYNode('span','paper-answer-count','0 / '+exam.questions.length+'문제 작성'),error=MYNode('p','paper-answer-error'),submit=MYNode('button','paper-submit','답안 제출');submit.type='submit';error.setAttribute('role','alert');footer.append(progress,submit,error);form.append(footer);dialog.append(form);document.body.append(dialog);
  form.addEventListener('change',()=>{progress.textContent=form.querySelectorAll('input:checked').length+' / '+exam.questions.length+'문제 작성';error.textContent='';});
  let submitted=false;form.addEventListener('submit',event=>{event.preventDefault();if(submitted)return;const answers=exam.questions.map((_,index)=>form.querySelector('input[name="paper-answer-'+index+'"]:checked'));const missing=answers.findIndex(answer=>!answer);if(missing>=0){error.textContent=(missing+1)+'번 문제의 답을 선택해주세요.';questions.children[missing].querySelector('input').focus();return;}submitted=true;submit.disabled=true;dialog.close();dialog.remove();resolve(answers.map(answer=>Number(answer.value)));});
  dialog.addEventListener('cancel',event=>event.preventDefault());dialog.showModal();
 });
}
export function MYPlayExamScore(result,name,reduceMotion=false){
 return new Promise(resolve=>{
  const dialog=MYNode('dialog','exam-paper-dialog exam-score-dialog'),paper=MYNode('div','exam-paper');dialog.setAttribute('aria-label','시험 채점 결과');paper.append(MYHeader(result,name,'채점 결과'));
  const scoreBox=MYNode('div','paper-score-box'),score=MYNode('strong','paper-score-number','0'),unit=MYNode('span','',result.examType==='toeic'?'/ 990점':result.examType==='cert'?'':'/ 100점'),count=MYNode('small','','채점 중…');scoreBox.append(score,unit,count);paper.append(scoreBox);
  const reviews=MYNode('div','paper-reviews'),rows=[];
  (result.reviews||[]).forEach((review,index)=>{const row=MYNode('article','paper-review'),mark=MYNode('strong','paper-review-mark','·'),content=MYNode('div','paper-review-content'),title=MYNode('h3','',(index+1)+'. '+(result.questions?.[index]?.prompt||'문항')),detail=MYNode('div','paper-review-detail');detail.hidden=true;const question=result.questions?.[index],answer=result.answers?.[index];detail.append(MYNode('p','', '내 답: '+(question?.options?.[answer]??'—')),MYNode('p','', '정답: '+review.correctOption));if(review.explanation)detail.append(MYNode('small','',review.explanation));content.append(title,detail);row.append(mark,content);reviews.append(row);rows.push({row,mark,detail,correct:review.isCorrect});});paper.append(reviews);
  const controls=MYNode('div','paper-score-controls'),skip=MYNode('button','','채점 연출 건너뛰기'),confirm=MYNode('button','paper-submit','점수 확인');skip.type=confirm.type='button';confirm.disabled=true;controls.append(skip,confirm);paper.append(controls);dialog.append(paper);document.body.append(dialog);
  let revealed=false,closed=false;const timers=[];
  function MYMark(index){const item=rows[index];item.row.classList.add('is-marked',item.correct?'is-correct':'is-wrong');item.mark.textContent=item.correct?'○':'×';item.detail.hidden=false;}
  function MYReveal(){if(revealed||closed)return;revealed=true;timers.forEach(clearTimeout);rows.forEach((_,index)=>MYMark(index));score.textContent=result.examType==='cert'?(result.passed?'합격':'불합격'):String(result.score);count.textContent=result.correctCount+' / '+rows.length+'문제 정답';dialog.dataset.phase='revealed';confirm.disabled=false;skip.hidden=true;confirm.focus();}
  function MYFinish(){if(!revealed||closed)return;closed=true;timers.forEach(clearTimeout);dialog.close();dialog.remove();resolve();}
  skip.addEventListener('click',MYReveal);confirm.addEventListener('click',MYFinish);dialog.addEventListener('cancel',event=>{event.preventDefault();MYReveal();});dialog.showModal();
  if(reduceMotion){dialog.classList.add('reduce-motion');MYReveal();return;}
  rows.forEach((item,index)=>timers.push(setTimeout(()=>{if(closed||revealed)return;MYMark(index);count.textContent=(index+1)+' / '+rows.length+'문제 채점';if(result.examType!=='cert'){const correct=rows.slice(0,index+1).filter(row=>row.correct).length;score.textContent=result.examType==='toeic'?'…':String(Math.round(correct/rows.length*100));}},350+index*450)));timers.push(setTimeout(MYReveal,350+rows.length*450));
 });
}
