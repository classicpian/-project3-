// 엔진의 배정 결과를 슬롯으로 공개한다. 재추첨·스탯 변경은 하지 않는다.
const MY_SPOONS={diamond:{name:'다이아 수저',index:0,tuition:true,rent:true},gold:{name:'금수저',index:1,tuition:false,rent:true},silver:{name:'은수저',index:2,tuition:true,rent:false},dirt:{name:'흙수저',index:3,tuition:false,rent:false}};
export function MYShowSpoonResult(spoon,reduced=false,saveMessage=''){
 const info=MY_SPOONS[spoon?.id];if(!info)throw new Error('수저 정보를 확인할 수 없습니다.');
 const dialog=document.querySelector('#spoon-dialog'),start=document.querySelector('#spoon-start'),confirm=document.querySelector('#spoon-confirm');
 const reels=[...dialog.querySelectorAll('.spoon-reel')],title=document.querySelector('#spoon-result-name'),status=document.querySelector('#spoon-result-status');
 const note=document.querySelector('#spoon-save-note');note.textContent=saveMessage;note.hidden=!saveMessage;
 dialog.dataset.phase='ready';dialog.dataset.spoon=spoon.id;title.textContent='';status.textContent='수저 뽑기 버튼을 눌러주세요.';start.disabled=false;start.hidden=false;confirm.hidden=true;
 document.querySelector('#spoon-tuition').textContent=info.tuition?'전액 지원':'직접 납부';document.querySelector('#spoon-rent').textContent=info.rent?'전액 지원':'직접 납부';
 function MYFrame(reel,index){reel.style.backgroundPosition=(index*100/3)+'% center';}
 reels.forEach((reel,i)=>{reel.classList.remove('is-spinning','is-stopped');MYFrame(reel,i);});dialog.showModal();
 return new Promise(resolve=>{
  let running=false,closed=false;const timers=new Set();
  function MYLater(fn,ms){const id=setTimeout(()=>{timers.delete(id);if(!closed)fn();},ms);timers.add(id);}
  function MYReveal(){dialog.dataset.phase='result';title.textContent=info.name;status.textContent=info.name+' 배정';start.hidden=true;confirm.hidden=false;confirm.focus();}
  function MYStart(){
   if(running)return;running=true;start.disabled=true;dialog.dataset.phase='spinning';status.textContent='추첨 중';
   if(reduced){reels.forEach(reel=>MYFrame(reel,info.index));MYReveal();return;}
   let stopped=0;
   reels.forEach((reel,i)=>{
    let elapsed=0,step=i;const stopAt=3700+i*850;reel.classList.add('is-spinning');
    function MYTick(){
     if(elapsed>=stopAt){MYFrame(reel,info.index);reel.classList.remove('is-spinning');reel.classList.add('is-stopped');if(++stopped===reels.length)MYLater(MYReveal,550);return;}
     MYFrame(reel,[0,2,1,3,1,0,3,2][step++%8]);const delay=elapsed<2200?80:Math.min(530,100+Math.pow((elapsed-2200)/(stopAt-2200),2)*430);elapsed+=delay;reel.style.setProperty('--reel-speed',delay+'ms');MYLater(MYTick,delay);
    }MYTick();
   });
  }
  function MYConfirm(){if(dialog.dataset.phase!=='result')return;closed=true;timers.forEach(clearTimeout);start.removeEventListener('click',MYStart);confirm.removeEventListener('click',MYConfirm);dialog.removeEventListener('cancel',MYPrevent);dialog.close();resolve();}
  function MYPrevent(e){e.preventDefault();}
  start.addEventListener('click',MYStart);confirm.addEventListener('click',MYConfirm);dialog.addEventListener('cancel',MYPrevent);
 });
}

