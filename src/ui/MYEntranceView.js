export function MYRunEntrance(name,reduced=false){
 const dialog=document.querySelector('#entrance-dialog'),canvas=document.querySelector('#entrance-canvas');
 const ctx=canvas.getContext('2d'),caption=document.querySelector('#entrance-caption'),skip=document.querySelector('#entrance-skip');
 document.querySelector('#entrance-name').textContent=name+' · 26학번';
 caption.textContent='입학 장면을 준비하고 있어요.';
 ctx.fillStyle='#0c1523';ctx.fillRect(0,0,canvas.width,canvas.height);dialog.showModal();
 return new Promise(resolve=>{
  let finished=false,raf=0,start=null;
  function MYFinish(){if(finished)return;finished=true;cancelAnimationFrame(raf);skip.removeEventListener('click',MYFinish);dialog.removeEventListener('cancel',MYCancel);dialog.close();resolve();}
  function MYCancel(e){e.preventDefault();MYFinish();}
  function MYLoad(src){return new Promise((ok,fail)=>{const image=new Image();image.onload=()=>ok(image);image.onerror=()=>fail(new Error(src));image.src=src;});}
  skip.addEventListener('click',MYFinish);dialog.addEventListener('cancel',MYCancel);
  Promise.all([MYLoad('assets/entrance-background.png'),MYLoad('assets/entrance-actor.png')]).then(([background,actor])=>{
   if(finished)return;
   function MYDraw(now){
    if(finished)return;if(start===null)start=now;
    // 이전의 5초 정지 장면으로 복귀. 새 청록색 과잠 리소스는 유지한다.
    const scene={finished:now-start>=5000,x:.72,frame:4,actorOpacity:1,fade:0,caption:'드디어 입학이다! 여기서 내 미래를 만들어 보자.'},w=canvas.width,h=canvas.height;
    ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,w,h);ctx.drawImage(background,0,0,w,h);
    ctx.save();ctx.globalAlpha=scene.actorOpacity;
    const cell=actor.naturalWidth/6,ah=h*.62,aw=ah*cell/actor.naturalHeight;
    ctx.fillStyle='#25324655';ctx.beginPath();ctx.ellipse(w*scene.x,h*.944,aw*.28,8,0,0,Math.PI*2);ctx.fill();
    ctx.drawImage(actor,cell*scene.frame,0,cell,actor.naturalHeight,w*scene.x-aw/2,h*.44,aw,ah);
    ctx.restore();ctx.fillStyle=`rgba(6,12,22,${Math.max(0,Math.min(1,scene.fade))})`;ctx.fillRect(0,0,w,h);
    caption.textContent=scene.caption;
    if(scene.finished){MYFinish();return;}raf=requestAnimationFrame(MYDraw);
   }
   raf=requestAnimationFrame(MYDraw);
  }).catch(()=>{if(!finished){caption.textContent='입학 장면을 불러오지 못했습니다. 건너뛰기를 눌러 진행해주세요.';skip.focus();}});
 });
}
