let MYShopCategory='supplies';
const MY_SHOP_ART={gpt_plus:"assets/chatgpt-logo.svg",gemini_sub:"assets/gemini-logo.svg"};
function MYProductArt(id,className){const img=MYElement("img",className);img.src=MY_SHOP_ART[id]||"assets/shop-"+id+".svg";img.alt=id==="gemini_sub"?"Google Gemini 공식 로고":id==="gpt_plus"?"OpenAI 공식 로고":"";return img;}
const MY_SPECIAL_EFFECTS={gpt_plus:[['study','과제 성공','자동','good'],['rest','지속 기간','4주','neutral']],jokbo:[['intelligence','시험 요구 지능','−10','good'],['study','적용 시험','다음 1회','neutral']],gemini_sub:[['intelligence','공부 지능 획득','+20%','good']],living_set:[['health','휴식 체력 회복','+20%','good']],herman_miller:[['health','체력 소모','−20%','good']],new_pc:[['intelligence','공부 지능 획득','+30%','good'],['stress','스트레스 증가','−15%','good']],ai_glasses:[['study','정답 표시','모든 시험','good'],['stress','적발 시 퇴학','10%','bad']],toeic_ticket:[['study','영어 시험','응시권','neutral'],['rest','응시 시점','방학 말','neutral']]};
function MYElement(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function MYIcon(key){const img=MYElement('img','');img.src='assets/icon-'+key+'.png';img.alt='';return img;}
function MYEffects(item){
 if(['cert_ticket','vacation_ticket'].includes(item.type)){
  const note=MYElement('div','shop-exam-note');
  const rows=item.type==='cert_ticket'?[['응시',item.minYear+'학년부터'],['합격','3 / 4 정답']]:[['응시','방학 말']];
  for(const [label,value] of rows){const row=MYElement('div','shop-exam-line');row.append(MYElement('span','',label),MYElement('strong','',value));note.append(row);}return note;
 }
 const effects=item.effect?Object.entries(item.effect).map(([key,value])=>[key,{health:'체력',intelligence:'지능',stress:'스트레스'}[key]||key,(value>0?'+':'')+value,(key==='stress'?value<0:value>0)?'good':'bad']):MY_SPECIAL_EFFECTS[item.id]||[['study','합격 기준','3 / 4 정답','neutral'],['intelligence','응시 학년',item.minYear+'학년부터','neutral']];
 const root=MYElement('div','shop-effects');
 for(const [key,label,value,tone] of effects){const chip=MYElement('div','shop-effect-chip '+tone),copy=MYElement('span','effect-copy');copy.append(MYElement('span','',label),MYElement('strong','',value));chip.append(MYIcon(key),copy);root.append(chip);}return root;
}
let MYShopSelected=null;
export function MYBuildShop(body,state,items,onAction,hiddenUnlocked){
 const raw=state.bState,year=Math.min(4,Math.floor(state.completedWeeks/48)+1),month=((Math.floor(state.completedWeeks/4)+2)%12)+1,vacation=[7,8,1,2].includes(month);
 body.replaceChildren();
 const host=body.parentElement;host.querySelector('.shop-checkout')?.remove();
 const wallet=MYElement('div','shop-wallet'),walletLabel=MYElement('span','wallet-label');walletLabel.append(MYIcon('money'),MYElement('span','','소지금'));wallet.append(walletLabel,MYElement('strong','',state.player.money.toLocaleString('ko-KR')+'원'));body.append(wallet);
 const tabs=MYElement('nav','shop-tabs');tabs.setAttribute('aria-label','상품 분류');
 for(const [id,name,artIndex] of [['supplies','소모품·구독','energy_drink'],['equipment','생활 장비','new_pc'],['exams','시험 접수','certificate']]){
  const b=MYElement('button',''),art=MYProductArt(artIndex,'shop-category-art');art.setAttribute('aria-hidden','true');b.append(art,MYElement('span','',name));b.type='button';b.setAttribute('aria-pressed',String(MYShopCategory===id));b.addEventListener('click',()=>{MYShopCategory=id;MYShopSelected=null;MYBuildShop(body,state,items,onAction,hiddenUnlocked);});tabs.append(b);
 }body.append(tabs);
 const grid=MYElement('div','shop-item-grid'),checkout=MYElement('div','shop-checkout');
 const selection=MYElement('div','shop-selection'),selectedName=MYElement('span','','상품을 선택해주세요'),total=MYElement('strong','','0원');selection.append(selectedName,total);
 const purchase=MYElement('button','shop-purchase','구매하기');purchase.type='button';purchase.disabled=true;checkout.append(selection,purchase);
 const cards=[];
 function MYChoose(item,price,blocked,card){
  MYShopSelected=item.id;for(const node of cards){node.classList.toggle('is-selected',node===card);node.querySelector('.shop-select')?.setAttribute('aria-pressed',String(node===card));}
  selectedName.textContent=item.name.replace('👓 ','');total.textContent=price.toLocaleString('ko-KR')+'원';purchase.textContent=blocked||'구매하기';purchase.disabled=!!blocked;purchase.onclick=()=>onAction('BUY',{itemId:item.id});
 }
 for(const item of Object.values(items)){
  if(item.isHidden&&!hiddenUnlocked)continue;
  const category=item.type==='permanent'?'equipment':['cert_ticket','vacation_ticket'].includes(item.type)?'exams':'supplies';if(category!==MYShopCategory)continue;
  const price=raw.permanentPrices?.[item.id]??item.price,owned=raw.inventory?.[item.id]||0,permanent=(raw.permanentItems||[]).includes(item.id);
  const card=MYElement('article','shop-item-card'),select=MYElement('button','shop-select'),art=MYProductArt(MY_SHOP_ART[item.id]?item.id:(['cert_ticket'].includes(item.type)?'certificate':item.id),'shop-item-art');select.type='button';select.setAttribute('aria-label',item.name.replace('👓 ','')+' 선택');select.setAttribute('aria-pressed','false');
  if(!['gemini_sub','gpt_plus'].includes(item.id))art.setAttribute('aria-hidden','true');
  const well=MYElement('div','shop-art-well');well.append(art);if(['gemini_sub','gpt_plus'].includes(item.id)){well.classList.add('gemini-brand');well.append(MYElement('span','gemini-wordmark',item.id==='gpt_plus'?'ChatGPT':'Gemini'));}select.append(well,MYElement('h3','',item.name.replace('👓 ','')),MYElement('strong','shop-price',price.toLocaleString('ko-KR')+'원'));card.append(select,MYEffects(item));
  const ownedText=item.type==='consumable'?'보유 '+owned+'개 · 주 '+item.weeklyLimit+'회':permanent?'보유 중':category==='exams'?'방학 접수':item.type==='permanent'?'영구 효과':'';
  card.append(MYElement('p','shop-owned',ownedText));
  const blocked=state.ending?'게임 종료':permanent?'보유 중':category==='exams'&&!vacation?'방학 전용':item.minYear>year?item.minYear+'학년부터':(raw.awards||[]).includes(item.id)?'취득 완료':item.type==='cert_ticket'&&raw.activeEffects?.pendingCertId?'접수 중':item.id==='toeic_ticket'&&raw.activeEffects?.toeicPending?'접수 중':item.id==='jokbo'&&raw.activeEffects?.jokboActive?'적용 중':state.player.money<price?'금액 부족':'';
  select.addEventListener('click',()=>MYChoose(item,price,blocked,card));cards.push(card);
  if(item.type==='consumable'){
   const use=MYElement('button','shop-use','보유 아이템 사용');use.type='button';use.disabled=!!state.ending||!owned||(raw.weeklyUseCount?.[item.id]||0)>=item.weeklyLimit;use.addEventListener('click',()=>onAction('USE_ITEM',{itemId:item.id}));card.append(use);
  }
  grid.append(card);if(MYShopSelected===item.id)MYChoose(item,price,blocked,card);
 }
 body.append(grid);host.insertBefore(checkout,host.querySelector('#b-content-close'));
}



export function MYShopChanges(before,after,item,type){
 const rows=[];
 for(const [key,label,icon] of [['money','소지금','money'],['health','체력','health'],['intelligence','지능','intelligence'],['stress','스트레스','stress']]){
  const from=Number(before.player[key]),to=Number(after.player[key]);
  if(key==='money'||from!==to)rows.push({label,icon,from,to,delta:to-from,unit:key==='money'?'원':'',good:key==='stress'?to<=from:to>=from});
 }
 if(item?.type==='consumable') {const from=before.bState.inventory?.[item.id]||0,to=after.bState.inventory?.[item.id]||0;rows.push({label:'보유 수량',icon:'work',from,to,delta:to-from,unit:'개',good:to>=from});}
 return rows;
}

export function MYShowShopReceipt(body,before,after,item,type,message){
 const receipt=MYElement('section','shop-receipt shop-loot-result');receipt.setAttribute('role','status');receipt.setAttribute('aria-label',type==='BUY'?'구매 완료':'아이템 사용 완료');
 const head=MYElement('div','loot-header');head.append(MYElement('span','loot-eyebrow',type==='BUY'?'PURCHASE COMPLETE':'ITEM USED'),MYElement('h3','',type==='BUY'?'구매 완료!':'아이템 사용!'));receipt.append(head);
 const hero=MYElement('div','loot-hero');if(item)hero.append(MYProductArt(item.type==='cert_ticket'?'certificate':item.id,'loot-item'));hero.append(MYElement('strong','',item?.name.replace('👓 ','')||''));receipt.append(hero);
 const rows=MYShopChanges(before,after,item,type).filter(r=>type==='BUY'||r.label!=='소지금');
 if(type==='USE_ITEM')for(const key of Object.keys(item?.effect||{})){if(!rows.some(r=>r.icon===key)){const value=Number(after.player[key]);rows.unshift({label:{health:'체력',stress:'스트레스',intelligence:'지능'}[key],icon:key,from:value,to:value,delta:0,unit:'',good:true});}}
 const grid=MYElement('div','loot-counters'),animations=[];
 for(const [index,row] of rows.entries()){
  const card=MYElement('div','loot-counter '+(row.delta===0?'neutral':row.good?'gain':'loss'));card.style.setProperty('--loot-delay',(index*160)+'ms');
  const label=MYElement('div','loot-counter-label');label.append(row.label==='보유 수량'&&item?MYProductArt(item.id,''):MYIcon(row.icon),MYElement('strong','',row.label));card.append(label);
  const number=MYElement('strong','loot-number',row.from.toLocaleString('ko-KR')+row.unit);card.append(number);
  const delta=MYElement('span','loot-floating',(row.delta>0?'+':'')+row.delta.toLocaleString('ko-KR')+row.unit);card.append(delta);
  let fill=null,max=100;if(['health','stress'].includes(row.icon)){max=row.icon==='health'?Number(after.player.maxHealth||after.bState.player.maxHealth||100):100;const meter=MYElement('div','loot-meter');fill=MYElement('span','');meter.append(fill);card.append(meter);}
  animations.push({number,fill,row,max,delay:index*160});grid.append(card);
 }
 receipt.append(grid);
 if(type==='BUY'&&item?.type==='consumable')receipt.append(MYElement('p','loot-note','보관함에 추가됐어요. 사용 버튼을 누르면 효과가 적용돼요.'));
 else if(item?.type!=='consumable'){receipt.append(MYEffects(item));receipt.append(MYElement('p','loot-note',message));}
 const button=MYElement('button','shop-receipt-dismiss','확인');button.type='button';receipt.append(button);body.prepend(receipt);receipt.scrollIntoView?.({block:'start',behavior:'smooth'});
 let frame=null,finished=false;const start=performance.now(),reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||document.querySelector('#reduce-motion')?.checked;
 function MYDraw(elapsed){for(const {number,fill,row,max,delay} of animations){const t=Math.min(1,Math.max(0,(elapsed-delay)/1000)),ease=1-Math.pow(1-t,3),value=Math.round(row.from+(row.to-row.from)*ease);number.textContent=value.toLocaleString('ko-KR')+row.unit;if(fill)fill.style.width=Math.max(0,Math.min(100,value/max*100))+'%';} }
 function MYTick(now){if(!receipt.isConnected)return;MYDraw(now-start);if(now-start<1500)frame=requestAnimationFrame(MYTick);else{finished=true;receipt.classList.add('loot-settled');}}
 button.onclick=()=>{if(!finished){if(frame)cancelAnimationFrame(frame);MYDraw(2000);finished=true;receipt.classList.add('loot-settled');}else receipt.remove();};
 if(reduced){MYDraw(2000);finished=true;receipt.classList.add('loot-settled');}else{MYDraw(0);frame=requestAnimationFrame(MYTick);}
}
