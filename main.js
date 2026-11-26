import { MYBuildShop } from './src/ui/MYShopView.js';
import { MYBuildAnnualCalendar } from './src/ui/MYAnnualCalendar.js';
import { MYPlayExamIntro } from './src/ui/MYExamIntro.js';
import { MYPlaySemesterResult } from './src/ui/MYSemesterResult.js';
import { MYSolveExamPaper, MYPlayExamScore } from './src/ui/MYExamPaper.js';
import { MYNewSuddenEvents, MYPlaySuddenEvent, MYPlayMilitaryEvent } from './src/ui/MYSuddenEvent.js';
import { MYBuildEndingMenu } from './src/ui/MYEndingView.js';
import { MYRunEntrance } from './src/ui/MYEntranceView.js';
import { MYShowSpoonResult } from './src/ui/MYSpoonView.js';
import { MYUIEngine } from './src/ui/MYUIEngine.js';
import { MY_SHOP_ITEMS } from './src/logic/MYShopService.js';
import { MY_ACTIVITY_RULES } from './src/logic/MYActivityService.js';
import { MYCalendarYearForTurn } from './src/logic/MYCalendar.js';
/* [1주차] 도트 배경·캐릭터·활동 그림. [2주차] app.js에서 프레임을 전달해 활동 연출에 사용. */
(() => {
  const C = { ink:'#30354b', hair:'#383342', hairLight:'#514554', skin:'#f0cbb1', shadow:'#d7a98c', jacket:'#203e49', sleeve:'#eee8d8', sleeveShadow:'#c9c8bc', gold:'#c5a267', pants:'#41495e', mint:'#a3c4a7' };
  function MYRect(ctx,x,y,w,h,color) { ctx.fillStyle=color; ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
  function MYPoly(ctx,points,color) { ctx.fillStyle=color; ctx.beginPath(); points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill(); }
  // [1주차] 학과 과잠의 공통 도트 리소스. [2주차] 기본 화면·초상화·활동에 동일하게 사용.
  
  function MYVarsityJacket(ctx) {
    MYRect(ctx, -11, 22, 22, 19, C.jacket);
    MYRect(ctx, -14, 24, 4, 15, C.sleeve);
    MYRect(ctx, 11, 24, 3, 15, C.sleeve);
    MYRect(ctx, -14, 29, 1, 9, C.sleeveShadow);
    MYRect(ctx, 13, 29, 1, 9, C.sleeveShadow);
    MYPoly(ctx, [[-8, 20], [-4, 20], [0, 24], [4, 20], [8, 20], [2, 27], [-2, 27]], C.ink);
    MYPoly(ctx, [[-7, 20], [-5, 20], [0, 25], [5, 20], [7, 20], [0, 27]], C.sleeve);
    MYRect(ctx, 0, 28, 1, 12, '#38535b');
    for (const y of [28, 32, 36, 40]) {
      MYRect(ctx, 0, y, 1, 1, C.sleeve);
    }
    
    MYRect(ctx, 5, 27, 1, 6, C.gold);
    MYRect(ctx, 6, 29, 1, 2, C.gold);
    MYRect(ctx, 7, 28, 1, 1, C.gold);
    MYRect(ctx, 8, 27, 1, 1, C.gold);
    MYRect(ctx, 7, 31, 1, 1, C.gold);
    MYRect(ctx, 8, 32, 1, 1, C.gold);
    MYRect(ctx, -13, 25, 3, 3, C.gold);
    MYRect(ctx, -12, 26, 1, 1, C.sleeve);
    // [1주차] 26학번 소매 자수. 플레이어 나이(20세)와 구분하는 고정 의상 문양.
    MYRect(ctx, 10, 24, 8, 8, C.ink);
    MYRect(ctx, 10, 24, 7, 7, C.sleeve);
    const admissionYearPixels = [
      '1110111',
      '0010100',
      '1110111',
      '1000101',
      '1110111'
    ];
    admissionYearPixels.forEach((row, y) => {
      [...row].forEach((pixel, x) => {
        if (pixel === '1') MYRect(ctx, 10 + x, 25 + y, 1, 1, C.gold);
      });
    });
    MYRect(ctx, -9, 35, 1, 4, C.sleeve);
    MYRect(ctx, 8, 35, 1, 4, C.sleeve);
    for (const y of [38, 40]) {
      MYRect(ctx, -14, y, 4, 1, C.jacket);
      MYRect(ctx, 11, y, 3, 1, C.jacket);
    }
    MYRect(ctx, -10, 40, 21, 1, C.sleeve);
    MYRect(ctx, -10, 42, 21, 1, C.sleeve);
    MYRect(ctx, -14, 41, 4, 3, C.skin);
    MYRect(ctx, 11, 41, 3, 3, C.skin);
  }
  function MYCharacter(ctx,x,y,scale=1,pose='stand',frame=0) {
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
    if(pose==='sleep'){
      MYRect(ctx,-21,13,44,15,C.ink);MYRect(ctx,-19,11,40,13,'#92a9be');MYRect(ctx,-19,11,14,7,'#eee8df');MYRect(ctx,-16,8,12,9,C.hair);MYRect(ctx,-14,11,10,6,C.skin);MYRect(ctx,-10,13,3,1,C.ink);MYRect(ctx,-3,13,23,10,'#a4b9ce');MYRect(ctx,4,13,3,10,'#c0ced9');MYRect(ctx,-21,28,3,4,'#8e7c72');MYRect(ctx,20,28,3,4,'#8e7c72');
    } else {
      const seated=pose!=='stand', blink=frame%46>43;
      if(!seated){MYRect(ctx,-9,38,8,23,C.ink);MYRect(ctx,2,38,8,23,C.ink);MYRect(ctx,-8,39,6,21,C.pants);MYRect(ctx,3,39,6,21,C.pants);MYRect(ctx,-11,60,11,4,C.ink);MYRect(ctx,1,60,12,4,C.ink);MYRect(ctx,-10,61,9,2,'#e4e2df');MYRect(ctx,2,61,10,2,'#e4e2df');}
      MYPoly(ctx,[[-11,19],[-15,22],[-16,41],[-11,43],[11,43],[16,41],[15,22],[10,19]],C.ink);
      MYRect(ctx,-4,17,9,7,C.shadow);
      MYVarsityJacket(ctx);
      MYRect(ctx,-10,1,21,18,C.ink);MYRect(ctx,-9,3,19,15,C.skin);MYRect(ctx,-12,7,3,6,C.skin);MYRect(ctx,10,7,3,6,C.skin);MYRect(ctx,-10,0,21,6,C.hair);MYRect(ctx,-13,3,5,8,C.hair);MYRect(ctx,8,3,5,8,C.hair);MYRect(ctx,-9,-3,15,5,C.hair);MYRect(ctx,-5,-5,7,3,C.hair);MYRect(ctx,-12,-1,5,5,C.hair);MYRect(ctx,7,-1,6,5,C.hair);MYRect(ctx,-9,4,4,5,C.hair);MYRect(ctx,-2,3,4,5,C.hair);MYRect(ctx,5,3,4,6,C.hair);MYRect(ctx,-6,-1,8,2,C.hairLight);MYRect(ctx,-11,2,5,2,C.hairLight);
      MYRect(ctx,-6,11,2,blink?1:3,C.ink);MYRect(ctx,5,11,2,blink?1:3,C.ink);MYRect(ctx,-1,17,4,1,'#b77f74');MYRect(ctx,-9,15,3,1,'#e6aa9f');MYRect(ctx,8,15,2,1,'#e6aa9f');
      if(pose==='game'){MYRect(ctx,-14,5,3,10,'#74718c');MYRect(ctx,12,5,3,10,'#74718c');MYRect(ctx,-10,-5,20,2,'#74718c');}
      if(seated){MYRect(ctx,-20,37,41,3,C.ink);MYRect(ctx,-22,39,45,3,'#ad9276');MYRect(ctx,-18,42,3,14,'#7d716b');MYRect(ctx,17,42,3,14,'#7d716b');
        if(pose==='work'){MYRect(ctx,-9,34,18,3,'#6b9686');MYRect(ctx,-5,20,2,5,'#6b9686');MYRect(ctx,5,20,2,5,'#6b9686');MYRect(ctx,4,34,14,3,'#d7d9c8');MYRect(ctx,8,26,8,8,C.ink);MYRect(ctx,9,27,6,5,'#92b9b5');MYRect(ctx,-21,30,6,7,'#e1c27a');}
        else if(pose==='game'){MYRect(ctx,3,22,19,14,C.ink);MYRect(ctx,5,24,15,10,'#7e9fa4');MYRect(ctx,10,27,4,4,'#b1d8a4');MYRect(ctx,-12,35,18,2,'#d6d2c5');}
        else {MYPoly(ctx,[[-14,32],[-2,30],[0,32],[3,30],[16,32],[15,37],[1,35],[-1,37],[-14,36]],'#ece6d7');MYRect(ctx,0,32,1,5,'#b7b2a3');MYRect(ctx,-11,33,7,1,'#b8b6aa');MYRect(ctx,5,33,7,1,'#b8b6aa');MYRect(ctx,-21,24,6,4,'#718b96');MYRect(ctx,-22,28,7,4,'#d4b97e');MYRect(ctx,-22,32,7,4,'#9aa899');MYRect(ctx,9+frame%2,30,1,5,'#b27d58');}
      }
    }
      // [2주차] 활동별 손·사물의 프레임 변화.
      const beat = frame % 2;
      if (pose === 'study') {
        MYRect(ctx, 6 + beat * 2, 30, 4, 3, C.skin);
        MYRect(ctx, 9 + beat * 2, 28, 1, 6, '#b27d58');
      }
      if (pose === 'work') {
        MYRect(ctx, -4 + beat * 4, 32 - beat * 2, 5, 3, C.skin);
        MYRect(ctx, 10, 28, 4, 2, beat ? '#b8d5af' : '#789b99');
        MYRect(ctx, -15 + beat * 3, 33, 5, 4, '#d8b76e');
      }
      if (pose === 'game') {
        MYRect(ctx, -9 + beat * 2, 33, 4, 3, C.skin);
        MYRect(ctx, 11, 27 + beat * 2, 4, 3, '#b1d8a4');
      }
      if (pose === 'sleep') {
        MYRect(ctx, -2, 12 - beat, 24, 12, '#a4b9ce');
        MYRect(ctx, 4, 13 - beat, 3, 10, '#c0ced9');
      }
ctx.restore();
  }
  function MYRoom(canvas,frame=0){
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    MYRect(ctx,0,0,640,400,'#d5d4d2');MYRect(ctx,0,0,270,284,'#c1c1c8');MYRect(ctx,270,0,370,284,'#d5d1d1');MYRect(ctx,0,284,640,116,'#b8a28a');
    MYPoly(ctx,[[0,284],[270,270],[640,284],[640,400],[0,400]],'#baa48f');MYRect(ctx,0,280,640,5,'#8d8588');MYRect(ctx,0,285,640,4,'#d0bca4');
    for(let y=302;y<400;y+=24){MYRect(ctx,0,y,640,1,'#aa9686');for(let x=(y%3)*73;x<640;x+=162)MYRect(ctx,x,y-21,1,21,'#ad9785');}
    MYRect(ctx,292,45,145,123,'#918f9e');MYRect(ctx,296,49,137,115,'#ede6d9');MYRect(ctx,302,55,125,103,'#b8d3df');MYRect(ctx,306,59,117,95,'#c3dce2');
    MYRect(ctx,305,132,117,21,'#adc1c9');MYRect(ctx,315,112,20,41,'#9eafb9');MYRect(ctx,339,123,25,30,'#a5b6be');MYRect(ctx,373,103,21,50,'#acb9c2');MYRect(ctx,393,126,28,27,'#9fadb7');
    for(let x=320;x<420;x+=11){MYRect(ctx,x,135,4,5,'#d3d4ce');MYRect(ctx,x,145,4,4,'#d3d4ce');}MYRect(ctx,362,53,5,106,'#e4dfd6');MYRect(ctx,301,102,126,4,'#e4dfd6');MYRect(ctx,289,165,151,5,'#a9a0a0');
    MYRect(ctx,285,38,155,5,'#8f8b9c');MYRect(ctx,286,43,12,133,'#b4b1ba');MYRect(ctx,432,43,10,133,'#b9b3bc');for(let y=46;y<170;y+=8){MYRect(ctx,289,y,2,6,'#a8a4b2');MYRect(ctx,436,y,2,6,'#aaa4b1');}
    MYPoly(ctx,[[302,170],[365,170],[282,307],[173,313]],'#d8c9aa70');
    MYRect(ctx,140,132,104,6,'#8c807c');MYRect(ctx,146,138,4,17,'#999190');MYRect(ctx,234,138,4,17,'#999190');
    const books=['#73878a','#c3b69a','#8c8e9f','#b2927e'];for(let i=0;i<8;i++){MYRect(ctx,151+i*7,106+(i%3)*4,5,26-(i%3)*4,books[i%4]);MYRect(ctx,152+i*7,111+(i%3)*4,3,1,'#e5d8be');}
    MYRect(ctx,211,113,25,18,'#b19b8d');MYRect(ctx,213,115,21,4,'#c8b4a0');MYRect(ctx,219,121,6,2,'#8d7d72');
    MYRect(ctx,136,234,133,8,'#806e66');MYRect(ctx,134,228,137,7,'#c4aa89');MYRect(ctx,141,242,7,60,'#8e7e71');MYRect(ctx,255,242,7,60,'#8e7e71');MYRect(ctx,141,246,35,40,'#ab9783');MYRect(ctx,144,249,29,15,'#bfa88d');MYRect(ctx,156,255,7,2,'#85776d');MYRect(ctx,144,268,29,14,'#bfa88d');MYRect(ctx,156,272,7,2,'#85776d');
    MYRect(ctx,193,195,47,30,'#555d72');MYRect(ctx,196,198,41,24,'#7b8e9d');MYRect(ctx,199,201,11,2,'#b6c9b1');MYRect(ctx,204,206,24,1,'#c9b8b2');MYRect(ctx,204,210,18,1,'#a3bec4');MYRect(ctx,199,215,27,1,'#b7c9ad');MYPoly(ctx,[[190,225],[243,225],[250,229],[185,229]],'#8e95a3');
    MYRect(ctx,151,215,18,4,'#b49a75');MYRect(ctx,151,211,17,4,'#879996');MYRect(ctx,153,207,15,4,'#d5c9aa');MYRect(ctx,178,219,7,9,'#e9e0d0');MYRect(ctx,185,221,3,4,'#d5c8b6');
    MYRect(ctx,172,245,23,31,'#8d919b');MYRect(ctx,170,250,27,22,'#777e8c');MYRect(ctx,180,271,5,26,'#676d7e');MYRect(ctx,169,295,26,3,'#666a79');MYRect(ctx,167,298,4,3,'#626777');MYRect(ctx,193,298,4,3,'#626777');
    MYRect(ctx,409,225,183,11,'#9a877b');MYRect(ctx,413,216,175,35,'#a28e81');MYRect(ctx,419,222,163,20,'#bcaa98');MYPoly(ctx,[[407,250],[563,234],[610,280],[441,310]],'#e4ded0');MYPoly(ctx,[[412,263],[568,248],[610,280],[441,310]],'#8fa6b8');MYPoly(ctx,[[441,310],[610,280],[610,313],[441,342]],'#899eaf');MYPoly(ctx,[[441,310],[610,280],[610,287],[441,317]],'#adbdc7');MYPoly(ctx,[[435,248],[472,242],[490,253],[451,261]],'#f3eadd');
    for(let j=0;j<4;j++){MYPoly(ctx,[[430+j*36,263-j*3],[434+j*36,262-j*3],[460+j*36,295-j*5],[456+j*36,297-j*5]],'#b7c6cf');}MYRect(ctx,438,341,7,9,'#8c7a6e');MYRect(ctx,601,313,7,13,'#8c7a6e');MYPoly(ctx,[[445,336],[610,308],[610,315],[445,343]],'#998779');
    MYRect(ctx,459,101,38,45,'#9b8b82');MYRect(ctx,462,104,32,39,'#d6c6af');MYRect(ctx,466,109,13,12,'#e8ddc9');MYRect(ctx,480,125,10,12,'#a6b6b0');MYRect(ctx,466,128,9,10,'#b9a7ab');
    MYRect(ctx,384,208,9,18,'#b39b80');MYRect(ctx,380,204,17,6,'#c0ab90');MYRect(ctx,387,184,2,21,'#6f8b6f');for(const [x,y]of[[380,185],[387,178],[391,190],[378,196]]){MYRect(ctx,x,y,7,5,'#849b79');MYRect(ctx,x+1,y-2,5,2,'#91a784');}
    MYPoly(ctx,[[256,340],[335,330],[391,367],[305,379]],'#d4ceba');MYPoly(ctx,[[265,342],[332,334],[379,366],[306,374]],'#c7c6b2');
    MYRect(ctx,374,282,20,27,'#596576');MYRect(ctx,377,278,14,6,'#596576');MYRect(ctx,377,284,14,19,'#687485');MYRect(ctx,379,293,10,7,'#788492');MYRect(ctx,379,309,12,2,'#797d85');
    MYCharacter(ctx,296,176,2.25,'stand',frame);
    MYRect(ctx,5,5,630,2,'#ffffff13');
  }
  function MYActivity(canvas,action,frame=0){const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);const scale=Math.min(canvas.width/68,canvas.height/62);ctx.save();ctx.translate(canvas.width/2,canvas.height*.19);MYCharacter(ctx,0,0,scale,action==='rest'?'sleep':action==='work'?'work':action==='leisure'?'game':'study',frame);ctx.restore();}
  function MYScene(canvas,action,frame=0){const ctx=canvas.getContext('2d');MYRect(ctx,0,0,240,140,'#d4dbd0');MYRect(ctx,0,104,240,36,'#b7a48b');MYRect(ctx,0,102,240,3,'#8e9387');MYRect(ctx,24,24,48,48,'#939f9b');MYRect(ctx,27,27,42,42,'#c0d9d8');MYRect(ctx,47,27,3,42,'#dce5d5');MYRect(ctx,27,47,42,3,'#dce5d5');MYRect(ctx,166,49,48,4,'#a38e79');for(let i=0;i<6;i++)MYRect(ctx,172+i*5,32+(i%2)*4,4,17-(i%2)*4,['#879c96','#c5b38b','#a2a1b2'][i%3]);MYCharacter(ctx,120,48,1.5,action==='rest'?'sleep':action==='work'?'work':action==='leisure'?'game':'study',frame);if(action==='rest'){ctx.fillStyle='#70869b';ctx.font='bold 11px monospace';ctx.fillText('z',148,59-(frame%4));ctx.fillText('Z',161,48-(frame%4));}else{MYRect(ctx,141,43-(frame%2)*2,2,5,'#b5a677');MYRect(ctx,147,46-(frame%2)*2,2,3,'#b5a677');}}
  window.MYArt={MYRoom,MYCharacter,MYActivity,MYScene};
})();

/* 고정 고해상도 방 + 창밖 이미지 + 캐릭터 프레임 합성 */
(function (root) {
  function MYCreateRenderer(canvas, images, createCanvas) {
    const ctx = canvas.getContext('2d');
    const width = 1672;
    const height = 941;
    canvas.width = width;
    canvas.height = height;
    const mask = createCanvas(width, height);
    const maskContext = mask.getContext('2d');
    maskContext.drawImage(images.room, 0, 0, width, height);
    if (images.mask) {
      maskContext.clearRect(0, 0, width, height);
      maskContext.drawImage(images.mask, 0, 0, width, height);
    } else {
    const pixels = maskContext.getImageData(0, 0, width, height);
    // 생성된 방의 파란 창 안쪽만 선택. 흰 반사광·초록 창틀은 보존.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = pixels.data[i];
        const g = pixels.data[i + 1];
        const b = pixels.data[i + 2];
        const sky = x > 940 && x < 1345 && y > 65 && y < 403 &&
          b > 180 && g > 155 && r < 192 && b - r > 25;
        pixels.data[i] = 255;
        pixels.data[i + 1] = 255;
        pixels.data[i + 2] = 255;
        pixels.data[i + 3] = sky ? 255 : 0;
      }
    }
    maskContext.putImageData(pixels, 0, 0);
    }
    const outside = createCanvas(width, height);
    const outdoorContext = outside.getContext('2d');
    const placements = [
      {x: 750, y: 350, w: 560, h: 420},
      {x: 1442, y: 478, w: 272, h: 285},
      {x: 1150, y: 440, w: 512, h: 384},
      {x: 750, y: 350, w: 560, h: 420}
    ];

    function MYRender(season, weather, action, frame, time) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(images.room, 0, 0, width, height);
      outdoorContext.clearRect(0, 0, width, height);
      outdoorContext.globalCompositeOperation = 'source-over';
      const scenery = weather==='sun' ? images.seasons : (images.overcast||images.seasons);
      const sourceWidth = scenery.width / 2;
      const sourceHeight = scenery.height / 2;
      outdoorContext.drawImage(scenery,
        (season % 2) * sourceWidth, Math.floor(season / 2) * sourceHeight,
        sourceWidth, sourceHeight, 939, 65, 407, 340);
      if (weather !== 'sun') {
        outdoorContext.fillStyle = weather === 'cloud' ? '#354b6010' : '#23394e40';
        outdoorContext.fillRect(939, 65, 407, 340);
      }
      const rain = weather === 'rain';
      const snow = weather === 'snow';
      if (rain || snow || season === 0 || season === 2) {
        const count = rain || snow ? 60 : 14;
        for (let i = 0; i < count; i++) {
          const speed = rain ? 0.42 : 0.028;
          const x = 939 + ((i * 73 + time * 0.012) % 407);
          const y = 65 + ((i * 49 + time * speed) % 340);
          if (rain) {
            outdoorContext.strokeStyle = '#e5eef4cc';
            outdoorContext.lineWidth = 2;
            outdoorContext.beginPath();
            outdoorContext.moveTo(x, y);
            outdoorContext.lineTo(x - 6, y + 17);
            outdoorContext.stroke();
          } else {
            outdoorContext.fillStyle = snow ? '#fffdfa' : season === 0 ? '#f4c3d3' : '#c47b38';
            outdoorContext.fillRect(Math.floor(x), Math.floor(y), snow ? 4 : 6, 4);
          }
        }
      }
      outdoorContext.globalCompositeOperation = 'destination-in';
      outdoorContext.drawImage(mask, 0, 0);
      ctx.drawImage(outside, 0, 0);

      if ((action === 0 || action === 3) && images.seated) {
        // The student and chair are drawn together in one coherent illustration.
        // Keep the seasonal window layer above the room, but below the hair.
        ctx.save();ctx.beginPath();
        ctx.moveTo(870,405);ctx.lineTo(913,405);ctx.lineTo(921,386);
        ctx.lineTo(938,369);ctx.lineTo(956,360);ctx.lineTo(976,354);
        ctx.lineTo(987,350);ctx.lineTo(1001,354);ctx.lineTo(1015,351);
        ctx.lineTo(1023,361);ctx.lineTo(1042,365);ctx.lineTo(1057,378);
        ctx.lineTo(1070,395);ctx.lineTo(1065,405);ctx.lineTo(1180,405);
        ctx.lineTo(1180,825);ctx.lineTo(870,825);ctx.closePath();ctx.clip();
        ctx.drawImage(action===3&&images.dozing?images.dozing:images.seated,0,0,width,height);ctx.restore();
        if(action===3){ctx.save();ctx.fillStyle='#395b67';ctx.font='bold 22px monospace';const rise=(time%4000)/4000;ctx.globalAlpha=.85;ctx.fillText('z',1100,430-rise*18);ctx.font='bold 28px monospace';ctx.fillText('Z',1122,410-rise*20);ctx.restore();}
      } else {
        const placement = placements[action];
        const cellWidth = images.actor.width / 2;
        const cellHeight = images.actor.height / 4;
        ctx.save();
        if (action === 1) {
          ctx.beginPath();ctx.moveTo(1540,490);ctx.lineTo(1672,480);
          ctx.lineTo(1672,865);ctx.lineTo(1495,710);ctx.lineTo(1520,600);
          ctx.closePath();ctx.clip();
        }
        ctx.drawImage(images.actor,frame*cellWidth,action*cellHeight,
          cellWidth,cellHeight,placement.x,placement.y,placement.w,placement.h);
        ctx.restore();
      }
      if (weather !== 'sun') {
        ctx.fillStyle = weather==='rain' ? '#24394d25' : '#354b6015';
        ctx.fillRect(0, 0, width, height);
      }
    }
    return {MYRender, mask};
  }
  root.MYCreateRenderer = MYCreateRenderer;
})(typeof module !== 'undefined' ? module.exports : window);


// [2주차] 주간 환경 데이터. 저장 데이터에 월별 계절에 맞는 날씨를 보존합니다.
function MYSeasonIndex(month) {
  if (month >= 3 && month <= 5) return 0;
  if (month >= 6 && month <= 8) return 1;
  if (month >= 9 && month <= 11) return 2;
  return 3;
}
function MYAllowedWeather(weeks) {
  return MYSeasonIndex(MYGetDate(weeks).month) === 3 ? ['sun','cloud','snow'] : ['sun','cloud','rain'];
}

function MYCreateEnvironment(weeks, legacy = false, previous = null) {
  // 입학 첫 주의 기본 장면. 2는 가방 정리 프레임이며 활동/스탯에는 영향 없음.
  if (weeks === 0) return {weekId:0,weather:'sun',action:2};
  const choices = MYAllowedWeather(weeks).filter(function (weather) {
    return !previous || weather !== previous.weather;
  });
  const weatherIndex = legacy ? weeks % choices.length : Math.floor(Math.random() * choices.length);
  const actions = [0,1,2,3].filter(function (action) {
    return !previous || action !== previous.action;
  });
  const actionIndex = legacy ? weeks % actions.length : Math.floor(Math.random() * actions.length);
  return {weekId:weeks,weather:choices[weatherIndex],action:actions[actionIndex]};
}

"use strict";

/*
 * [1주차]
 * 화면 요소 조회, 초기 화면과 시작 메뉴 이동
 *
 * [2주차]
 * 이름 입력, 활동 선택, 주간 처리 요청,
 * 결과 표시, 날짜·능력치 갱신, 저장·이어하기
 */

// ---------- 화면 요소 ----------

const screens = document.querySelectorAll(".screen");

const nameForm = document.querySelector("#name-form");
const nameInput = document.querySelector("#player-name");
const nameError = document.querySelector("#name-error");

const scheduleDialog = document.querySelector("#schedule-dialog");
const resultDialog = document.querySelector("#result-dialog");
const runWeekButton = document.querySelector("#run-week-button");

const activityButtons = document.querySelectorAll("[data-activity]");

// 기존 HTML의 이어하기 버튼에는 id가 없어서 여기서 찾는다.
const continueButton =
  document.querySelector("#continue-button") ||
  document.querySelector("#menu-screen button[disabled]");

continueButton.id = "continue-button";
continueButton.textContent = "이어하기";

let state = null;
let selectedActivity = null;
let isRunning = false;
let isComposingName = false;

// ---------- 활동 표시 자료 ----------

const activities = {
  study: {
    name: "공부",
    description:
      "공부를 진행합니다. 지능이 오르고 체력이 소모되며 스트레스가 증가합니다."
  },

  work: {
    name: "아르바이트",
    description:
      "생활비를 법니다. 소지금이 오르고 체력이 소모되며 스트레스가 증가합니다."
  },

  leisure: {
    name: "여가",
    description:
      "취미 생활로 스트레스를 낮춥니다. 체력과 소지금이 소모됩니다."
  },

  rest: {
    name: "휴식",
    description:
      "충분히 쉬면서 체력을 회복하고 스트레스를 낮춥니다."
  }
};

// ---------- [1주차] 화면 전환 ----------

function MYShowScreen(screenId) {
  screens.forEach(function (screen) {
    screen.hidden = screen.id !== screenId;
  });
  if(screenId === "game-screen") requestAnimationFrame(MYFitGameScreen);
}

function MYShowMenu() { if(isRunning)return;
  continueButton.disabled = !game.MYHasSave();
  MYShowScreen("menu-screen");
}

function MYShowTitle() { if(isRunning)return;
  MYShowScreen("title-screen");
}

// ---------- [2주차] 이름 설정 ----------

function MYClearNameError() {
  nameError.textContent = "";
  nameInput.removeAttribute("aria-invalid");
}

function MYShowNameInput() { if(isRunning)return;
  nameForm.reset();
  MYClearNameError();
  MYShowScreen("name-screen");
  nameInput.focus();
}

function MYValidateName(name) {
  if (name.length === 0) {
    return "이름을 입력해주세요.";
  }

  if (!/^[가-힣a-zA-Z0-9]{1,10}$/.test(name)) {
    return "한글·영문·숫자로 1~10자를 입력해주세요.";
  }

  return "";
}

async function MYStartGame(event) {
  event.preventDefault();

  if (isComposingName || isRunning) {
    return;
  }

  const playerName = nameInput.value.trim();
  const error = MYValidateName(playerName);

  if (error) {
    nameError.textContent = error;
    nameInput.setAttribute("aria-invalid", "true");
    nameInput.focus();
    return;
  }

  if(game.MYHasSave() && !window.confirm('새 게임을 시작하면 기존 저장이 교체됩니다. 계속할까요?'))return;
  isRunning = true;
  try {state = await game.MYNewGame(playerName);}catch(error){nameError.textContent=error.message;isRunning=false;return;}

  MYRenderGame();
  state=game.MYSetIntroPhase('spoon');
  try{await MYCompleteIntro();}catch(error){nameError.textContent='시작 연출 오류: '+error.message;return;}finally{isRunning=false;}
  MYShowScreen("game-screen");

  const saved = game.MYSave();

  document.querySelector("#game-message").textContent =
    saved.ok ? "" : saved.message;
}

// ---------- [2주차] 날짜와 능력치 표시 ----------

// 3월에 학년 시작.
// 3~6월 1학기, 7~8월 여름방학,
// 9~12월 2학기, 1~2월 겨울방학.
function MYGetDate(completedWeeks) {
  completedWeeks=Math.min(completedWeeks,191);
  const monthIndex = Math.floor(completedWeeks / 4) % 12;

  let term = "1학기";

  if (monthIndex >= 10) {
    term = "겨울방학";
  } else if (monthIndex >= 6) {
    term = "2학기";
  } else if (monthIndex >= 4) {
    term = "여름방학";
  }

  return {
    year: Math.floor(completedWeeks / 48) + 1,
    month: (monthIndex + 2) % 12 + 1,
    week: completedWeeks % 4 + 1,
    term
  };
}

function MYHomeDialogue(value){
 const date=MYGetDate(value.completedWeeks),p=value.player,raw=value.bState||{},vacation=[1,2,7,8].includes(date.month);
 if(value.ending)return '대학 생활의 결과를 확인해보자.';
 if(raw.militaryLeave?.week===value.completedWeeks)return '2년 만에 돌아왔네. 멈춰 두었던 대학 생활을 다시 이어가보자.';
 if(value.completedWeeks===0)return '입학 첫 주네. 이번 달 계획부터 세워볼까?';
 if(raw.restrictedNextWeek)return '몸이 많이 지쳤어. 이번 주는 무리하지 말고 쉬어야겠어.';
 if(p.health<=30)return '체력이 많이 떨어졌네. 쉬면서 회복할 시간이 필요해.';
 if(p.stress>=70)return '머리가 복잡하네. 잠깐 쉬거나 여가를 즐겨볼까?';
 if(date.week===4&&!['diamond','gold'].includes(p.spoon?.id)&&p.money<600000)return '이번 주가 월세 내는 주야. 생활비부터 마련해야겠어.';
 if([5,11].includes(date.month)&&date.week===3&&!raw.competitionRecords?.some(r=>r.id===`HACKATHON:${date.year}:${date.month}`))return '이번 주에 해커톤이 열린대. 참가 조건을 확인해볼까?';
 if([4,6,10,12].includes(date.month)&&date.week>=3){const final=[6,12].includes(date.month);return final?'기말고사가 얼마 안 남았네. 시험과 과제 점수를 확인해보자.':'중간고사가 얼마 안 남았네. 배운 내용을 복습해볼까?';}
 if(vacation&&raw.activeEffects?.toeicPending)return '토익은 이번 방학 마지막 주에 보네. 접수한 일정부터 확인해보자.';
 if(vacation)return date.month<=2?'겨울방학이네. 다음 학기 준비도 조금씩 해둬야겠어.':'여름방학이네. 쉬면서 자격증 준비도 해볼까?';
 if([3,9].includes(date.month)&&date.week===1)return '새 학기가 시작됐네. 이번 학기는 어떻게 보내볼까?';
 const lines={sun:'날이 맑네. 이번 주 계획대로 차근차근 해보자.',cloud:'오늘은 흐리네. 방에서 이번 주 계획을 정리해볼까?',rain:'밖에 비가 오네. 빗소리 들으면서 할 일을 정리해보자.',snow:'밖에 눈이 오네. 따뜻하게 지내면서 이번 주를 보내야겠어.'};
 return lines[value.environment?.weather]||'이번 주에는 무엇을 해볼까?';
}

function MYFormatNumber(value, key) {
  const formatted = value.toLocaleString("ko-KR");

  return key === "money" ? `${formatted}원` : formatted;
}
window.MYHomeDialogue=MYHomeDialogue;

function MYRenderGame() {
  MYRoomView.MYSetState(state);
  const player = state.player;
  document.querySelector("#profile-age").textContent=player.age;
  const date = MYGetDate(state.completedWeeks);

  document.querySelector("#profile-name").textContent = player.name + (player.spoon ? ' · '+player.spoon.label : '');
  document.querySelector("#dialogue-name").textContent = player.name;

  document.querySelector("#health-text").textContent =
    `${player.health} / ${player.maxHealth}`;

  const healthGauge = document.querySelector("#health-gauge");
  healthGauge.max = player.maxHealth;
  healthGauge.value = player.health;

  document.querySelector("#intelligence-text").textContent =
    MYFormatNumber(player.intelligence, "intelligence");

  document.querySelector("#stress-text").textContent =
    `${player.stress} / 100`;

  document.querySelector("#stress-gauge").value = player.stress;

  document.querySelector("#money-text").textContent =
    MYFormatNumber(player.money, "money");

  document.querySelector("#semester-text").textContent =
    `${date.year}학년 ${date.term}`+(state.bState?.militaryLeave?.week===state.completedWeeks?' · 복학':'');

  document.querySelector("#month-text").textContent = `${date.month}월`;
  document.querySelector("#week-text").textContent = `${date.week}주차`;

  MYRenderCalendar();
  MYRenderStatTiles();
}

// ---------- [2주차] 활동 선택 ----------

async function MYRunWeek() {
  if (isRunning || !MYCommitMonthPlan()) return;
  selectedActivity = state.monthPlan.activities[state.completedWeeks % 4];
  if (!selectedActivity || isRunning) {
    return;
  }

  isRunning = true;
  runWeekButton.disabled = true;
  runWeekButton.textContent = "처리 중…";
  const checkpoint=game.MYGetState();

  try {
    // 활동 식별값을 보내고 처리 결과를 받습니다.
    await MYActivityView.MYPrepare(); // 상태 변경 전에 이미지 누락 확인
    const response = await game.MYRunWeek(selectedActivity);
    scheduleDialog.close();
    if(response.result.examResult)await MYPlayExamScore(response.result.examResult,state.player.name,MYReduceMotion());
    await MYActivityView.MYPlay(response.result.actualActivityId || selectedActivity);

    state = response.state;

    MYRenderGame();
    MYRenderResult(response.result);

    scheduleDialog.close();
    for(const event of MYNewSuddenEvents(checkpoint.bState,state.bState))await MYPlaySuddenEvent(event,MYReduceMotion());
    for(const event of (state.bState.eventHistory||[]).slice((checkpoint.bState.eventHistory||[]).length).filter(e=>e.type==='MILITARY'))await MYPlayMilitaryEvent(event,MYReduceMotion());
    const previousSemesters=new Set((checkpoint.bState?.academicRecords||[]).map(record=>record.semesterId));
    for(const record of state.bState.academicRecords||[]){if(!previousSemesters.has(record.semesterId))await MYPlaySemesterResult(record,MYReduceMotion());}
    resultDialog.showModal();
  } catch (error) {
    try {await game.MYRestore(checkpoint);state=game.MYGetState();game.MYSave();MYRenderGame();}catch(restoreError){document.querySelector('#game-message').textContent='복원에 실패했습니다. 이어하기로 마지막 저장을 불러오세요.';}
    if (!scheduleDialog.open) scheduleDialog.showModal();
    document.querySelector("#schedule-error").textContent =
      "활동 실행 오류: " + (error.message || "다시 시도해주세요.");
  } finally {
    isRunning = false;
    runWeekButton.disabled = false;
    runWeekButton.textContent = (state.completedWeeks%4+1)+'주차 시작';
  }
}

async function MYContinueGame() {
  if(isRunning)return;isRunning=true;
  let loaded;try{loaded=await game.MYLoad();}finally{isRunning=false;}

  if (!loaded.ok) {
    window.alert(loaded.message);
    return;
  }

  state = loaded.state;
  MYRenderGame();
  if(['spoon','entrance'].includes(game.meta?.introPhase)){
    isRunning=true;
    try{await MYCompleteIntro();state=game.MYGetState();}finally{isRunning=false;}
  }
  MYShowScreen("game-screen");
  if(state.ending)MYShowBEnding();
}


const game = new MYUIEngine({onExam:MYShowBExam,onExamResult:result=>MYPlayExamScore(result,state.player.name,MYReduceMotion()),onAdvice:MYShowBAdvice,createEnvironment:MYCreateEnvironment}); 

// ---------- 사용자 입력 연결 ----------

document.querySelector("#back-button").addEventListener(
  "click",
  MYShowTitle
);

// [2주차] 이름 입력과 새 게임
document.querySelector("#new-game-button").addEventListener(
  "click",
  MYShowNameInput
);

document.querySelector("#name-back-button").addEventListener(
  "click",
  MYShowMenu
);

document.querySelector("#menu-button").addEventListener(
  "click",
  MYShowMenu
);

nameForm.addEventListener("submit", MYStartGame);
nameInput.addEventListener("input", MYClearNameError);

nameInput.addEventListener("compositionstart", function () {
  isComposingName = true;
});

nameInput.addEventListener("compositionend", function () {
  isComposingName = false;
});

// [2주차] 활동 선택과 실행
document.querySelector("#schedule-button").addEventListener(
  "click",
  MYOpenSchedule
);

activityButtons.forEach(function (button) {
  button.addEventListener("click", MYSelectActivity);
});

document.querySelector("#close-schedule-button").addEventListener(
  "click",
  function () {
    if (!isRunning) scheduleDialog.close();
  }
);

scheduleDialog.addEventListener("cancel", function (event) {
  if (isRunning) event.preventDefault();
});

runWeekButton.addEventListener("click", MYRunWeek);

document.querySelector("#next-week-button").addEventListener(
  "click",
  MYFinishResult
);

resultDialog.addEventListener("cancel", function (event) {
  event.preventDefault();
});

// [2주차] 이어하기
continueButton.addEventListener("click", MYContinueGame);
continueButton.disabled = !game.MYHasSave();

// 후속 화면 연결 전 안내
document.querySelector("#events-button").addEventListener(
  "click",
  function () {
    MYShowBSchedule();
  }
);

document.querySelector("#records-button").addEventListener(
  "click",
  function () {
    MYShowBRecords();
  }
);
/* [2주차] 게임 상태와 기본 화면 연출 연결. 시각 연출은 능력치를 바꾸지 않습니다. */
const MYRoomView = (() => {
  const canvas = document.querySelector('#home-scene');
  const label = document.querySelector('#environment-label');
  let renderer = null;
  let current = null;
  let action = 0;
  let elapsed = 0;
  let clock = 0;
  let lastTime = null;
  let lastPaint = 0;
  let dirty = true;
  let reduced = MYReduceMotion();

  function MYLoadImage(name) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () { resolve(image); };
      image.onerror = function () { reject(new Error('assets/' + name + '.png를 불러오지 못했습니다.')); };
      image.src = 'assets/' + name + '.png';
    });
  }

  function MYSetState(value) {
    const changed = !current || current.completedWeeks !== value.completedWeeks;
    current = value;
    action = current.environment.action;
    if (changed) elapsed = 0;
    const season = MYSeasonIndex(MYGetDate(value.completedWeeks).month);
    const seasonNames = ['봄', '여름', '가을', '겨울'];
    const weatherNames = {sun:'맑음',cloud:'흐림',rain:'비',snow:'눈'};
    const seasonIcons=['🌸','🌿','🍂','❄'];
    const weatherIcons={sun:'☀',cloud:'☁',rain:'🌧',snow:'🌨'};
    label.replaceChildren();
    for(const [kind,icon,text] of [['season',seasonIcons[season],seasonNames[season]],['weather',weatherIcons[value.environment.weather],weatherNames[value.environment.weather]]]){
      const chip=document.createElement('span');chip.className='environment-chip '+kind;
      const art=document.createElement('span');art.className='environment-icon';art.setAttribute('aria-hidden','true');art.textContent=icon;
      chip.append(art,document.createTextNode(text));label.append(chip);
    }
    label.dataset.weather=value.environment.weather;
    label.setAttribute('aria-label',seasonNames[season]+' · '+weatherNames[value.environment.weather]);

    dirty = true;
  }

  function MYAnimate(now) { reduced = MYReduceMotion();
    const delta = lastTime === null ? 0 : Math.min(now - lastTime, 100);
    lastTime = now;
    const visible = !document.querySelector('#game-screen').hidden && !document.hidden;
    const waiting = !!document.querySelector('dialog[open]');
    if (visible && !waiting && current && renderer) {
      if (!reduced) {
        elapsed += delta;
        clock += delta;

      }
      if (dirty || (!reduced && now - lastPaint > 50)) {
        // [2주차] 같은 주의 행동 자세는 10초에 한 번 변경합니다.
        const sequence = [0,1];
        const frame = reduced ? 0 : sequence[Math.floor(elapsed / 10000) % sequence.length];
        renderer.MYRender(MYSeasonIndex(MYGetDate(current.completedWeeks).month),
          current.environment.weather, action, frame, clock);
        dirty = false;
        lastPaint = now;
      }
    }
    requestAnimationFrame(MYAnimate);
  }

  Promise.all(['room','actor','seasons','window-mask','seasons-overcast','seated-room','dozing-room'].map(MYLoadImage)).then(function (loaded) {
    renderer = window.MYCreateRenderer(canvas,
      {room:loaded[0],actor:loaded[1],seasons:loaded[2],mask:loaded[3],overcast:loaded[4],seated:loaded[5],dozing:loaded[6]},
      function (width,height) {
        const layer = document.createElement('canvas');
        layer.width = width;
        layer.height = height;
        return layer;
      });
    dirty = true;
  }).catch(function (error) {
    document.querySelector('#game-message').textContent = error.message;
  });
  requestAnimationFrame(MYAnimate);
  return {MYSetState};
})();
/* [2주차] 새 게임에서 입학 이미지를 보여준 후 기본 화면으로 이동합니다. */
function MYPlayEntrance(name) { return MYRunEntrance(name,MYReduceMotion()); }

async function MYCompleteIntro(){
  if(game.meta.introPhase==='spoon'){
    const saved=game.MYSave();
    await MYShowSpoonResult(state.player.spoon,MYReduceMotion(),saved.ok?'':'저장에 실패했어요. 브라우저를 닫기 전에 저장 상태를 확인해주세요.');
    state=game.MYSetIntroPhase('entrance');game.MYSave();
  }
  await MYPlayEntrance(state.player.name);
  state=game.MYSetIntroPhase('done');game.MYSave();
}

/* [2주차] 주간 활동 실행 장면. 결과 계산은 한 번만 호출합니다. */
const MYActivityView = (() => {
  const dialog = document.querySelector('#activity-run-dialog');
  const canvas = document.querySelector('#activity-canvas');
  let finish = null;
  let fast = false;


  let sheet = null;
  function MYLoadSheet() {
    if (sheet) return Promise.resolve(sheet);
    return new Promise(function(resolve,reject){
      const image = new Image();
      image.onload = function(){sheet=image;resolve(image);};
      image.onerror = function(){reject(new Error('assets/activity-frames.png를 불러오지 못했습니다.'));};
      image.src = 'assets/activity-frames.png';
      if(image.complete && image.naturalWidth){sheet=image;resolve(image);}
    });
  }
  function MYDrawActivity(image, activityId, frame) {
    const row = {study:0,work:1,leisure:2,rest:3}[activityId];
    const cellWidth = image.naturalWidth / 2;
    const cellHeight = image.naturalHeight / 4;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image, (frame % 2)*cellWidth+1, row*cellHeight+1,
      cellWidth-2, cellHeight-2, 0,0,canvas.width,canvas.height);
  }
  async function MYPlay(activityId) {
    const image = await MYLoadSheet();
    canvas.width = Math.round(image.naturalWidth / 2);
    canvas.height = Math.round(image.naturalHeight / 4);

    const names = {study:'공부',work:'아르바이트',leisure:'여가',rest:'휴식'};
    document.querySelector('#activity-run-title').textContent = names[activityId] + '하는 한 주';
    document.querySelector('#activity-speed').textContent = '배속 ×1';
    document.querySelector('#activity-progress').value = 0;
    document.querySelector('#activity-speed').setAttribute('aria-pressed','false');
    fast = MYReadSettings().speed === 3;
    document.querySelector('#activity-speed').textContent = fast ? '배속 ×3' : '배속 ×1';
    document.querySelector('#activity-speed').setAttribute('aria-pressed',String(fast));
    dialog.showModal();
    let reduced = MYReduceMotion();
    return new Promise(function (resolve) {
      let lastTime = null;
      let progress = 0;
      let frameId = null;
      let done = false;
      function MYFinish() {
        if (done) return;
        done = true;
        cancelAnimationFrame(frameId);
        document.querySelector('#activity-progress').value = 100;
        dialog.close();
        finish = null;
        resolve();
      }
      function MYFrame(now) {
        const delta = lastTime === null ? 0 : Math.min(now-lastTime,100);
        lastTime = now;
        progress = Math.min(1,progress + delta/6000*(fast ? 3 : 1));
        const frame = reduced ? 0 : Math.floor(now/800);
        MYDrawActivity(image,activityId,frame);
        document.querySelector('#activity-progress').value = progress*100;
        if (progress === 1) MYFinish();
        else frameId = requestAnimationFrame(MYFrame);
      }
      finish = MYFinish;
      MYDrawActivity(image,activityId,0);
      frameId = requestAnimationFrame(MYFrame);
    });
  }
  document.querySelector('#activity-speed').addEventListener('click',function(){
    fast = !fast;
    document.querySelector('#activity-speed').textContent = fast ? '배속 ×3' : '배속 ×1';
    document.querySelector('#activity-speed').setAttribute('aria-pressed',String(fast));
  });
  document.querySelector('#activity-skip').addEventListener('click',function(){if(finish)finish();});
  dialog.addEventListener('cancel',function(event){event.preventDefault();if(finish)finish();});
  return {MYPlay,MYPrepare:MYLoadSheet};
})();

/* [2주차] 실제 달력 표시. 한 달의 게임 턴은 기존과 같이 4개입니다. */
function MYCalendarDate(completedWeeks,militaryLeave=state?.bState?.militaryLeave) {
  const date = MYGetDate(completedWeeks);
  const calendarYear = MYCalendarYearForTurn(completedWeeks,militaryLeave);
  const days = new Date(Date.UTC(calendarYear, date.month, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(calendarYear, date.month - 1, 1)).getUTCDay();
  const start = (date.week - 1) * 7 + 1;
  const end = date.week === 4 ? days : date.week * 7;
  return {...date, calendarYear, days, firstDay, start, end};
}

function MYRenderCalendar() {
  const date = MYCalendarDate(state.completedWeeks);
  const root = document.querySelector('#calendar');
  root.replaceChildren();
  root.setAttribute('aria-label', date.calendarYear + '년 ' + date.month + '월 달력');
  document.querySelector('#calendar-heading').textContent = date.calendarYear + '년 ' + date.month + '월';
  for (const label of ['월','화','수','목','금','토','일']) {
    const day = document.createElement('span');
    day.className = 'calendar-heading';
    day.textContent = label;
    root.append(day);
  }
  const offset = (date.firstDay + 6) % 7;
  const cellCount = Math.ceil((offset + date.days) / 7) * 7;
  root.style.setProperty('--calendar-weeks',String(cellCount/7));
  for (let index = 0; index < cellCount; index++) {
    const dayNumber = index - offset + 1;
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    if (dayNumber < 1 || dayNumber > date.days) {
      cell.setAttribute('aria-hidden','true');
      root.append(cell);
      continue;
    }
    const number = document.createElement('span');
    number.textContent = dayNumber;
    cell.append(number);
    if (index % 7 === 6) cell.classList.add('sunday');
    if (index % 7 === 5) cell.classList.add('saturday');
    if (dayNumber >= date.start && dayNumber <= date.end) cell.classList.add('current-days');
    if (dayNumber === date.days) {
      const badge = document.createElement('small');
      badge.textContent = '월세';
      cell.classList.add('rent-day');
      cell.append(badge);
      cell.title = '매월 말일 · 월세 600,000원';
      cell.setAttribute('aria-label', '월말, 월세 납부일');
      const coin=document.createElement('img');coin.src='assets/icon-money.png';coin.alt='';cell.prepend(coin);
    }
    root.append(cell);
  }
  const note=document.querySelector('#calendar-rent-note');note.replaceChildren();
  const icon=document.createElement('img');icon.src='assets/icon-money.png';icon.alt='';
  const supported=['diamond','gold'].includes(state.player.spoon?.id),text=document.createElement('span');text.textContent=date.month+'월 '+date.days+'일 · 월세 '+(supported?'전액 지원':'600,000원');note.dataset.supported=String(supported);note.append(icon,text);
}

function MYRenderStatTiles() {
  document.querySelector('#dialogue-text').textContent=MYHomeDialogue(state);
  const player=state.player,healthRatio=player.health/player.maxHealth;
  const threshold=state.bState?.examThreshold;
  const descriptors={health:[healthRatio<=.4?'부족':healthRatio<=.7?'보통':'양호',healthRatio<=.4?'danger':healthRatio<=.7?'caution':'good'],stress:[player.stress>=70?'높음':player.stress>=40?'보통':'안정',player.stress>=70?'danger':player.stress>=40?'caution':'good'],intelligence:[Number.isFinite(threshold)?'시험 기준 '+threshold:'', 'neutral'],money:[['diamond','gold'].includes(player.spoon?.id)?'월세 지원':player.money<600000?'월세 주의':'월세 확보',!['diamond','gold'].includes(player.spoon?.id)&&player.money<600000?'caution':'good']};
  for(const [key,[text,tone]] of Object.entries(descriptors)){
    const target=document.querySelector('#'+key+'-status');if(target){target.textContent=text;target.dataset.tone=tone;}
    const tile=document.querySelector('#'+key+'-text').parentElement;
    if(tile)tile.dataset.tone=tone;
  }
  for (const key of ['health','stress']) {
    const maximum = key === 'health' ? state.player.maxHealth : 100;
    const filled = Math.ceil(state.player[key] / maximum * 10);
    const root = document.querySelector('#' + key + '-segments');
    root.replaceChildren();
    for (let index = 0; index < 10; index++) {
      const block = document.createElement('span');
      block.classList.toggle('filled', index < filled);
      root.append(block);
    }
  }
}

// [2주차] 해상도와 브라우저 창 높이에 맞춰 기본 화면 전체를 축소합니다.

function MYFitGameScreen() {
  const viewport=document.querySelector('.game-viewport');
  const screen=document.querySelector('#game-screen');
  if(screen.hidden)return;
  const width=viewport.clientWidth;
  const height=viewport.clientHeight;
  if(width<=0||height<=0)return;
  const scale=Math.min(width/1672,height/941);
  // 확대/축소 후의 실제 크기를 기준으로 위치를 계산합니다.
  screen.style.left=Math.max(0,(width-1672*scale)/2)+'px';
  screen.style.top=Math.max(0,(height-941*scale)/2)+'px';
  screen.style.transform='scale('+scale+')';
}
window.addEventListener('resize',MYFitGameScreen);
const MYGameViewportObserver=new ResizeObserver(MYFitGameScreen);
MYGameViewportObserver.observe(document.querySelector('.game-viewport'));
requestAnimationFrame(MYFitGameScreen);

/* 월초 4주 계획, 남은 주 수정, 주별 실행 */
let MYDraftPlan = [];
let MYEditingWeek = 0;
const MYActionIcons = {study:'📖',work:'🪙',leisure:'🎮',rest:'🛏'};

function MYEnsureMonthPlan(value) {
  const monthIndex = Math.floor(value.completedWeeks / 4);
  if (!value.monthPlan || value.monthPlan.monthIndex !== monthIndex) {
    value.monthPlan = {monthIndex, activities:[null,null,null,null]};
  }
}

function MYOpenSchedule() {
  if(isRunning)return;
  if(state?.ending){MYShowBEnding();return;}
  MYDraftPlan = [...state.monthPlan.activities];
  MYEditingWeek = state.completedWeeks % 4;
  document.querySelector('#schedule-error').textContent = '';
  MYRenderMonthPlan();
  scheduleDialog.showModal();
}

function MYRenderMonthPlan() {
  const date = MYGetDate(state.completedWeeks);
  document.querySelector('#schedule-date').textContent =
    date.year + '학년 ' + date.term + ' · ' + MYCalendarDate(state.completedWeeks).calendarYear + '년 ' + date.month + '월';
  const currentWeek = state.completedWeeks % 4;
  const root = document.querySelector('#month-plan-weeks');
  root.replaceChildren();
  for (let week = 0; week < 4; week++) {
    const id = MYDraftPlan[week];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'plan-week';
    button.disabled = week < currentWeek;
    button.setAttribute('aria-pressed',String(week === MYEditingWeek));
    const heading = document.createElement('strong');
    heading.textContent = (week+1) + '주차';
    const image = document.createElement('span');
    image.className = 'plan-picture' + (id ? ' picture-'+id : '');
    if (!id) image.textContent = week < currentWeek ? '✓' : '+';
    const name = document.createElement('span');
    name.textContent = id ? activities[id].name : week < currentWeek ? '완료' : '활동 선택';
    const status = document.createElement('small');
    status.textContent = week < currentWeek ? '완료' : week === currentWeek ? '이번 주' : '예정';
    button.append(heading,image,name,status);
    button.addEventListener('click',function(){MYEditingWeek=week;MYRenderMonthPlan();});
    root.append(button);
  }
  const id = MYDraftPlan[MYEditingWeek];
  activityButtons.forEach(function(button){
    const on = button.dataset.activity === id;
    button.classList.toggle('is-selected',on);
    button.setAttribute('aria-pressed',String(on));
  });
  document.querySelector('#selected-activity-name').textContent =
    (MYEditingWeek+1)+'주차 · '+(id ? activities[id].name : '활동을 골라주세요');
  MYRenderActivityEffects(id);
  const ready = MYDraftPlan.slice(currentWeek).every(function(action){return Object.hasOwn(activities,action);});
  runWeekButton.disabled = !ready;
  document.querySelector('#save-plan-button').disabled = !ready;
  runWeekButton.textContent = (currentWeek+1)+'주차 시작';
}

function MYSelectActivity(event) {
  MYDraftPlan[MYEditingWeek] = event.currentTarget.dataset.activity;
  document.querySelector('#schedule-error').textContent = '';
  MYRenderMonthPlan();
}

function MYRenderActivityEffects(id){
 const root=document.querySelector('#selected-activity-description');root.replaceChildren();if(!id)return;
 const rule=MY_ACTIVITY_RULES[id==='work'?'partTime':id],labels={health:'체력',intelligence:'지능',stress:'스트레스',money:'소지금'};
 const heading=document.createElement('div');heading.className='activity-effects-heading';heading.textContent='기본 효과';root.append(heading);
 const grid=document.createElement('div');grid.className='activity-effects-grid';
 for(const [key,value]of Object.entries(rule).filter(([,v])=>v!==0)){
  const card=document.createElement('div');card.className='activity-effect-card';card.dataset.tone=(key==='stress'?value<0:value>0)?'good':'cost';
  const image=document.createElement('img');image.src='assets/icon-'+key+'.png';image.alt='';
  const copy=document.createElement('div'),label=document.createElement('span'),amount=document.createElement('strong');label.textContent=labels[key];amount.textContent=(value>0?'+':'−')+Math.abs(value).toLocaleString('ko-KR')+(key==='money'?'원':'');copy.append(label,amount);card.append(image,copy);grid.append(card);
 }
 const note=document.createElement('p');note.className='activity-effects-note';note.textContent='캐릭터 상태와 아이템에 따라 실제 변화량은 달라질 수 있어요.';root.append(grid,note);
}

function MYCommitMonthPlan() {
  try {
    state = game.MYSetMonthPlan(MYDraftPlan);
    const saved = game.MYSave();
    document.querySelector('#schedule-error').textContent = saved.ok ? '' : saved.message;
    return true;
  } catch(error) {
    document.querySelector('#schedule-error').textContent = error.message;
    return false;
  }
}

function MYNextExamReminder(completedWeeks,threshold,intelligence,militaryLeave=null){
 if(completedWeeks>=192)return null;
 const position=turn=>{const month=((Math.floor(turn/4)+2)%12)+1,year=MYCalendarYearForTurn(turn,militaryLeave);return {month,year,week:turn%4+1};};
 const now=position(completedWeeks),today=Date.UTC(now.year,now.month-1,(now.week-1)*7+1);
 for(let turn=completedWeeks;turn<192;turn++){const date=position(turn);if(date.week!==4||![4,6,10,12].includes(date.month))continue;
  return {name:[4,10].includes(date.month)?'중간고사':'기말고사',days:Math.max(0,Math.round((Date.UTC(date.year,date.month-1,22)-today)/86400000)),month:date.month,last:new Date(Date.UTC(date.year,date.month,0)).getUTCDate(),threshold,intelligence};
 }return null;
}
function MYRenderResult(result) {
  const date = MYGetDate(result.weekId);
  document.querySelector('#result-summary').textContent =
    date.year+'학년 '+date.term+' · '+MYCalendarDate(result.weekId).calendarYear+'년 '+date.month+'월 '+date.week+'주차';
  const picture = document.querySelector('#result-picture');
  picture.className = 'result-picture picture-'+result.activityId;
  picture.setAttribute('aria-label',activities[result.activityId].name+' 활동 장면');
  document.querySelector('#result-activity').textContent = activities[result.activityId].name+' 완료';
  const messages = {study:'이번 주에 쌓은 공부가 성장으로 이어졌어요.',work:'이번 주 근무를 마치고 생활비를 마련했어요.',leisure:'좋아하는 일을 하며 기분을 전환했어요.',rest:'충분히 쉬며 다음 주를 준비했어요.'};
  document.querySelector('#result-caption').textContent = messages[result.activityId];
  const root = document.querySelector('#result-cards');
  root.replaceChildren();
  const labels = {health:'체력',intelligence:'지능',stress:'스트레스'};
  Object.entries(labels).forEach(function([key,label]){
    const before = result.before[key];
    const after = result.after[key];
    const delta = after-before;
    const card = document.createElement('div');
    card.className = 'growth-card';
    
    const heading = document.createElement('span');
    const icon = document.createElement('img');icon.src='assets/icon-'+key+'.png';icon.alt='';
    heading.append(icon,document.createTextNode(label));
    const value = document.createElement('strong');value.textContent=MYFormatNumber(after,key);const valueRow=document.createElement('div');valueRow.className='result-value-row';
    const badge = document.createElement('b');
    badge.textContent = delta===0 ? '변화 없음' : (delta>0?'+':'')+MYFormatNumber(delta,key);
    badge.className = delta===0 ? 'delta-neutral' : (key==='stress' ? delta<0 : delta>0) ? 'delta-positive' : 'delta-negative';
    const comparison=document.createElement('div');comparison.className='stat-comparison';
    const previous=document.createElement('div'),current=document.createElement('div'),arrow=document.createElement('span');
    previous.className='stat-previous';current.className='stat-current';arrow.className='stat-arrow';arrow.textContent='→';
    const beforeLabel=document.createElement('small'),afterLabel=document.createElement('small'),beforeValue=document.createElement('strong');beforeLabel.textContent='활동 전';afterLabel.textContent='활동 후';beforeValue.textContent=MYFormatNumber(before,key);
    previous.append(beforeLabel,beforeValue);current.append(afterLabel,value);comparison.append(previous,arrow,current);
    const direction=document.createElement('small');direction.className='stat-direction';direction.textContent=delta===0?'이번 주 변화 없음':key==='stress'?(delta<0?'스트레스 완화':'스트레스 증가'):key==='health'?(delta>0?'체력 회복':'체력 소모'):'지능 성장';
    valueRow.append(badge);card.append(heading,valueRow,direction,comparison);
    if(key!=='intelligence'){
      
      const bar=document.createElement('div');bar.className='result-segments '+key;
      const maximum=key==='health'?result.after.maxHealth:100;
      bar.setAttribute('role','meter');bar.setAttribute('aria-label',label);
      bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',String(maximum));bar.setAttribute('aria-valuenow',String(after));
      for(let block=0;block<10;block++){const item=document.createElement('i');item.classList.toggle('filled',block<Math.ceil(after/maximum*10));item.classList.toggle('was-filled',block<Math.ceil(before/maximum*10));item.classList.toggle('gained',block>=Math.ceil(before/maximum*10)&&block<Math.ceil(after/maximum*10));item.classList.toggle('lost',block>=Math.ceil(after/maximum*10)&&block<Math.ceil(before/maximum*10));bar.append(item);}
      card.append(bar);
    }
    root.append(card);
  });
  document.querySelector('#result-money-balance').textContent=MYFormatNumber(result.after.money,'money');
  const moneyDelta=result.after.money-result.before.money;
  document.querySelector('#result-money-change').textContent = moneyDelta===0 ? '변화 없음' : (moneyDelta>0?'+':'')+MYFormatNumber(moneyDelta,'money');
  document.querySelector('#result-money-change').className=moneyDelta===0?'delta-neutral':moneyDelta>0?'delta-positive':'delta-negative';
  document.querySelector('#result-money-total').textContent=MYFormatNumber(result.before.money,'money')+' → '+MYFormatNumber(result.after.money,'money');
  document.querySelector('#result-money-total').hidden=false;
  const timeline=document.querySelector('#result-month-timeline');timeline.replaceChildren();
  for(let week=0;week<4;week++){
    const id=result.monthActivities[week];
    const cell=document.createElement('div');cell.className='result-week'+(week<=date.week-1?' done':'');
    const title=document.createElement('small');title.textContent=(week+1)+'주차';
    const icon=document.createElement('span');icon.className='result-plan-activity';if(id){const image=document.createElement('img');image.src='assets/icon-'+id+'.png';image.alt='';icon.append(image,document.createTextNode(activities[id].name));}else{icon.textContent='미설정';}
    const text=document.createElement('b');text.textContent=week<=date.week-1?'완료':'예정';
    cell.append(title,icon,text);timeline.append(cell);
  }
  MYFitResultDialog();
  const saved=game.MYSave();
  const reminder=MYNextExamReminder(state.completedWeeks,state.bState?.examThreshold,result.after.intelligence,state.bState?.militaryLeave),notice=document.querySelector('#save-message');notice.replaceChildren();
  if(reminder){
    function MYExamNode(tag,cls,text){const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node;}
    const header=MYExamNode('div','exam-quest-head'),icon=MYExamNode('img','exam-quest-icon');icon.src='assets/icon-study.png';icon.alt='';
    const title=MYExamNode('div','exam-quest-title');title.append(MYExamNode('small','','다가오는 시험'),MYExamNode('strong','',reminder.name));
    const countdown=MYExamNode('div','exam-countdown');countdown.append(MYExamNode('small','','시험 주간까지'),MYExamNode('b','',reminder.days?'D−'+reminder.days:'이번 주!'));header.append(icon,title,countdown);
    const date=MYExamNode('div','exam-quest-date',reminder.month+'월 22~'+reminder.last+'일 · 4주차');
    const target=Number(reminder.threshold),valid=Number.isFinite(target),shortage=valid?Math.max(0,Math.ceil(target-reminder.intelligence)):null;
    const labels=MYExamNode('div','exam-quest-labels');labels.append(MYExamNode('span','','지능'),MYExamNode('strong','',reminder.intelligence+' / '+(valid?target:'—')));
    const gauge=MYExamNode('progress','exam-quest-gauge');gauge.max=valid&&target>0?target:1;gauge.value=valid&&target>0?Math.min(target,reminder.intelligence):0;gauge.setAttribute('aria-label','시험 요구 지능 대비 현재 지능');
    const status=MYExamNode('div','exam-quest-status'+(shortage===0?' is-ready':''),valid?(shortage?'목표까지 '+shortage+' 더!':'준비 완료!'):'시험 기준 확인 중');
    notice.append(header,date,labels,gauge,status);
  }else notice.textContent='남은 학기 시험이 없습니다.';
  if(!saved.ok){const error=document.createElement('small');error.textContent=saved.message;notice.append(error);}
  const monthEnded=state.completedWeeks%4===0;
  document.querySelector('#next-week-button').textContent=monthEnded?'다음 달 계획하기':'다음 주 계획 확인';
  if(state.ending)document.querySelector('#next-week-button').textContent='엔딩 확인';
  const details=document.querySelector('#weekly-details');details.replaceChildren();
  for(const message of result.logs||[]){const row=document.createElement('div');row.className='weekly-log';const icon=document.createElement('img');icon.alt='';icon.src='assets/icon-'+(/월세|학비|원|상금|장학/.test(message)?'money':/과로|휴식/.test(message)?'rest':/이별|스트레스/.test(message)?'stress':'study')+'.png';const text=document.createElement('span');text.textContent=message;row.append(icon,text);details.append(row);}
}

function MYFinishResult() {
  resultDialog.close();
  document.querySelector('#dialogue-text').textContent = MYHomeDialogue(state);
  if(state.ending)MYShowBEnding();else MYOpenSchedule();
}

document.querySelector('#save-plan-button').addEventListener('click',function(){
  if(MYCommitMonthPlan())document.querySelector('#schedule-error').textContent='계획을 저장했습니다.';
});

// [2주차] 목업 비율을 유지하면서 결과 창도 브라우저 안에 맞춥니다.
function MYFitResultDialog() {
 const dialog=document.querySelector('#result-dialog');
 dialog.style.width='';dialog.style.height='';
 document.querySelector('.result-stage').style.transform='none';
}
window.addEventListener('resize',MYFitResultDialog);

// 초기 화면의 새 게임/이어하기를 기존 입력·저장 흐름에 연결한다.
function MYRefreshTitleMenu() {
  const hasSave=game.MYHasSave();
  document.querySelector('#title-continue-button').disabled=!hasSave;
  document.querySelector('#title-save-note').textContent=hasSave?'저장된 대학 생활을 이어갈 수 있어요.':'새 게임을 눌러 대학 생활을 시작하세요.';
}
document.querySelector('#title-new-button').addEventListener('click',MYShowNameInput);
document.querySelector('#title-continue-button').addEventListener('click',MYContinueGame);
document.querySelector('#back-button').addEventListener('click',MYRefreshTitleMenu);
MYRefreshTitleMenu();

// 설정은 게임 저장과 별도로 보관한다. 게임 진행 기록은 변경하지 않는다.
function MYReadSettings() {
  try {const v=JSON.parse(localStorage.getItem('college-ui-settings')||'{}');return {speed:v.speed===3?3:1,reduceMotion:v.reduceMotion===true};}
  catch {return {speed:1,reduceMotion:false};}
}
function MYReduceMotion() {return MYReadSettings().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;}
function MYOpenSettings() {
 const s=MYReadSettings();document.querySelector('#setting-speed').value=String(s.speed);
 document.querySelector('#setting-motion').checked=s.reduceMotion;
 document.querySelector('#settings-status').textContent='설정은 자동으로 저장됩니다.';document.querySelector('#settings-dialog').showModal();
}
function MYSaveSettings() {
 const s={speed:Number(document.querySelector('#setting-speed').value)===3?3:1,reduceMotion:document.querySelector('#setting-motion').checked};
 try {localStorage.setItem('college-ui-settings',JSON.stringify(s));document.querySelector('#settings-status').textContent='설정을 저장했어요. 다음 연출부터 적용됩니다.';}
 catch {document.querySelector('#settings-status').textContent='설정을 저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.';}
}
document.querySelector('#title-settings-button').addEventListener('click',MYOpenSettings);
document.querySelector('#setting-speed').addEventListener('change',MYSaveSettings);
document.querySelector('#setting-motion').addEventListener('change',MYSaveSettings);


// 게임 판단은 Worker에 요청하고 화면은 결과만 표시한다.
function MYBParagraph(text) {const p=document.createElement('p');p.textContent=text;return p;}
function MYBContent(title) {
 const dialog=document.querySelector('#b-content-dialog');dialog.classList.remove('shop-dialog','paper-calendar-dialog');dialog.querySelector('.shop-checkout')?.remove();document.querySelector('#b-content-title').textContent=title;
 const body=document.querySelector('#b-content-body');body.classList.remove('ending-content','ending-gallery','growth-records','schedule-board','annual-calendar');body.replaceChildren();
 if(!dialog.open)dialog.showModal();return body;
}
function MYShowBAdvice(advice) {
 if(state && !isRunning)document.querySelector('#game-message').textContent=(advice||[]).join(' / ');
}
function MYShowAnnualCalendar(){
 if(!state||isRunning)return;
 const body=MYBContent('연간 학사 달력');body.classList.add('annual-calendar');
 document.querySelector('#b-content-dialog').classList.add('paper-calendar-dialog');
 MYBuildAnnualCalendar(body,state);
}
document.querySelector('#calendar-panel').addEventListener('click',MYShowAnnualCalendar);
document.querySelector('#calendar-panel').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();MYShowAnnualCalendar();}});
let MYBExamResolve=null;
async function MYShowBExam(exam) {
 await MYPlayExamIntro(exam,MYReduceMotion());
 return MYSolveExamPaper(exam,state.player.name);
}
document.querySelector('#b-content-close').addEventListener('click',()=>document.querySelector('#b-content-dialog').close());
function MYShowBEnding() {
 if(!state?.ending)return;
 try{localStorage.setItem('MY_GAME_CLEARED','true');}catch{}
 const body=MYBContent('대학 생활 결과');
 MYBuildEndingMenu(body,state,MYReduceMotion());
}
function MYHiddenUnlocked(){try{return localStorage.getItem('MY_GAME_CLEARED')==='true';}catch{return false;}}
async function MYBAction(type,payload,refresh) {
 if(isRunning)return;isRunning=true;
 try {const response=await game.MYAction(type,{...payload,hiddenUnlocked:MYHiddenUnlocked()});state=response.state;MYRenderGame();if(type==='MILITARY')await MYPlayMilitaryEvent({type:'MILITARY',militaryLeave:state.bState?.militaryLeave},MYReduceMotion());isRunning=false;refresh?.();document.querySelector('#b-content-body').prepend(MYBParagraph(response.message));}
 catch(error){document.querySelector('#b-content-body').prepend(MYBParagraph(error.message));}
 finally{isRunning=false;}
}
function MYShowBShop() {
 if(!state || (isRunning&&!document.querySelector('#b-content-dialog').open))return;
 const body=MYBContent('캠퍼스 상점');
 document.querySelector('#b-content-dialog').classList.add('shop-dialog');
 MYBuildShop(body,state,MY_SHOP_ITEMS,(type,payload)=>MYBAction(type,payload,MYShowBShop),MYHiddenUnlocked());
}
function MYShowBSchedule() {
 if(!state || isRunning)return;
 const body=MYBContent('주요 일정');
 body.classList.add('schedule-board');
 function MYNode(tag,cls,text){const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;}
 function MYArt(file){const img=MYNode('img','schedule-art');img.src='assets/'+file;img.alt='';return img;}
 function MYCard(icon,title,tag){const card=MYNode('section','schedule-card'),head=MYNode('div','schedule-card-head');head.append(MYArt(icon),MYNode('h3','',title));if(tag)head.append(MYNode('span','schedule-tag',tag));card.append(head);return card;}
 function MYRow(card,label,value){const row=MYNode('div','schedule-detail');row.append(MYNode('span','',label),MYNode('strong','',value));card.append(row);}
 const turn=Math.min(state.completedWeeks,191),year=Math.floor(turn/48)+1,month=((Math.floor(turn/4)+2)%12)+1,week=turn%4+1,vacation=[1,2,7,8].includes(month),raw=state.bState;
 const banner=MYNode('div','schedule-banner');banner.append(MYArt('icon-study.png'),MYNode('strong','',state.ending?'대학 생활 종료':year+'학년 · '+month+'월 '+week+'주차'),MYNode('span','',vacation?'방학':'학기 중'));body.append(banner);
 const grid=MYNode('div','schedule-grid');body.append(grid);
 const exam=MYCard('icon-study.png','시험·과제','학사 일정');
 MYRow(exam,'중간고사','4월·10월 / 4주차');MYRow(exam,'기말·과제 마감','6월·12월 / 4주차');
 MYRow(exam,'다음 시험 요구 지능',String(raw.examThreshold));grid.append(exam);
 const finance=MYCard('icon-money.png','생활비·학비','정기 납부');MYRow(finance,'월세','매월 말일 · 600,000원');MYRow(finance,'학비','새 학기 · 2,000,000원');
 finance.append(MYNode('p','schedule-note','첫 학기 학비 납부 완료 · 이후 장학금·수저 지원 적용'));
 if(state.player.spoon){const support=MYNode('div','schedule-support');support.append(MYNode('strong','',state.player.spoon.label),MYNode('span','',state.player.spoon.desc));finance.append(support);}grid.append(finance);
 const competitionId=`HACKATHON:${year}:${month}`,competitionOpen=[5,11].includes(month)&&week===3,competitionDone=(raw.competitionRecords||[]).some(record=>record.id===competitionId);
 const contest=MYCard('shop-certificate.svg','대회·해커톤',competitionOpen?'이번 주 개최':'개최 예정');
 MYRow(contest,'개최 일정','매년 5월·11월 3주차');MYRow(contest,'수상 요구 지능',competitionOpen?String(raw.hackathonThreshold):'개최 주차에 확인');contest.append(MYNode('p','schedule-note','매회 한 번 참가할 수 있어요. 수상 결과와 관계없이 다음 대회에 다시 도전할 수 있어요.'));
 const competition=document.createElement('button');competition.textContent='대회 / 해커톤 참가';competition.disabled=!!state.ending || state.bState.hackathonThreshold===null;competition.addEventListener('click',()=>MYBAction('COMPETITION',{compId:'HACKATHON'},MYShowBSchedule));body.append(competition);
 competition.disabled=!!state.ending||!competitionOpen||competitionDone;if(competitionDone)competition.textContent='참가 완료';else if(!competitionOpen)competition.textContent='개최 주차에 참가';contest.append(competition);grid.append(contest);
 const militaryCard=MYCard('icon-health.png','군 복무',state.player.isMilitaryDone?'복무 완료':'선택 이벤트');militaryCard.append(MYNode('p','schedule-note','2년간 군 휴학 후 복학합니다. 나이·달력은 2년 증가하고, 학업 진도는 유지돼요. 복무 보상과 지능 30% 감소가 적용됩니다.'));
 const military=document.createElement('button');military.textContent='군대 이벤트';military.disabled=!!state.ending || state.player.gender!=='male'||state.player.isMilitaryDone;
 military.addEventListener('click',()=>{if(window.confirm('2년간 군 휴학 후 복학할까요? 나이와 달력이 2년 증가합니다. 지능이 30% 감소하고 군 적금·체력 효과가 적용됩니다.'))MYBAction('MILITARY',{},MYShowBSchedule);});militaryCard.append(military);grid.append(militaryCard);
}
function MYShowBRecords() {
 if(!state || isRunning)return;
 const body=MYBContent('성장 기록');const raw=state.bState;
 body.classList.add('growth-records');
 function MYNode(tag,cls,text){const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;}
 function MYArt(src){const img=MYNode('img','record-art');img.src='assets/'+src;img.alt='';return img;}
 function MYSection(title){const section=MYNode('section','record-section');section.append(MYNode('h3','',title));body.append(section);return section;}
 const records=raw.academicRecords||[],awards=raw.awards||[],gpa=records.length?records.reduce((sum,r)=>sum+Number(r.gradePoint),0)/records.length:null;
 const summary=MYNode('div','record-summary');
 for(const [icon,label,value] of [['icon-study.png','누적 학점',gpa===null?'—':gpa.toFixed(2)+' / 4.5'],['icon-intelligence.png','지능',String(state.player.intelligence)],['shop-certificate.svg','수상·자격증',awards.length+'개'],['shop-toeic_ticket.svg','토익',raw.player.toeicScore?raw.player.toeicScore+'점':'미응시']]){const card=MYNode('div','record-summary-card');card.append(MYArt(icon),MYNode('span','',label),MYNode('strong','',value));summary.append(card);}body.append(summary);
 const academic=MYSection('학기별 성적');const chart=MYNode('div','record-chart');chart.setAttribute('aria-label','8개 학기 성적');
 for(let year=1;year<=4;year++)for(let term=1;term<=2;term++){const rec=records.find(r=>r.semesterId===year+'-'+term),col=MYNode('div','record-column'),track=MYNode('div','record-bar-track'),fill=MYNode('div','record-bar-fill');fill.style.height=rec?Math.max(0,Math.min(100,Number(rec.gradePoint)/4.5*100))+'%':'0%';track.append(fill);col.append(MYNode('strong','',rec?rec.grade:'—'),track,MYNode('span','',year+'-'+term));col.title=rec?rec.gradePoint+' / 4.5 · '+rec.weightedScore+'점':'아직 확정된 성적 없음';chart.append(col);}academic.append(chart);
 if(!records.length)academic.append(MYNode('p','record-caption','학기가 끝나면 성적이 기록됩니다.'));
 const assignment=MYNode('div','record-assignment');assignment.append(MYArt('icon-study.png'),MYNode('span','','이번 학기 과제'),MYNode('strong','',(raw.assignmentScore??0)+' / 100'));const meter=MYNode('progress','');meter.max=100;meter.value=Number(raw.assignmentScore)||0;meter.setAttribute('aria-label','이번 학기 과제 점수');assignment.append(meter);academic.append(assignment);
 const collection=MYSection('수상·자격증');const badges=MYNode('div','record-badges');
 if(!awards.length){const empty=MYNode('div','record-empty');empty.append(MYArt('shop-certificate.svg'),MYNode('span','','아직 획득한 기록이 없어요'));badges.append(empty);}
 for(const id of awards){const badge=MYNode('div','record-badge'),name=id.startsWith('HACKATHON:')?id.split(':')[1]+'학년 '+id.split(':')[2]+'월 해커톤 수상':id==='cert_security_bonus'?'정보보안기사 추가 실적':MY_SHOP_ITEMS[id]?.name||({HACKATHON:'해커톤 수상'}[id])||id;badge.append(MYArt('shop-certificate.svg'),MYNode('strong','',name));badges.append(badge);}collection.append(badges);
 const events=MYSection('대학 생활 발자취');const timeline=MYNode('div','record-timeline');
 const entries=raw.eventHistory||[];
 if(!entries.length)timeline.append(MYNode('p','record-caption','이벤트를 경험하면 이곳에 남아요.'));
 for(const record of entries.slice().reverse()){const labels={OVERWORK:['icon-rest.png','과로 · 회복이 필요한 한 주'],BREAKUP:['icon-stress.png','이별을 경험했어요'],MILITARY:['icon-health.png','군 복무를 마치고 복학']},[icon,label]=labels[record.type]||['icon-study.png',record.message||record.type||'이벤트 발생'];const entry=MYNode('div','record-timeline-entry');entry.append(MYArt(icon),MYNode('span','',record.type==='MILITARY'&&record.militaryLeave?.enlistYear?label+' ('+record.militaryLeave.enlistYear+'년 → '+record.militaryLeave.returnYear+'년)':label));timeline.append(entry);}events.append(timeline);
}
document.querySelector('#shop-button').addEventListener('click',MYShowBShop);
//  상태별 자율 수행에 따라 실제 변화량은 달라진다.
for(const [uiId,ruleId]of [['study','study'],['work','partTime'],['leisure','leisure'],['rest','rest']]){
 const rule=MY_ACTIVITY_RULES[ruleId],labels={health:'체력',intelligence:'지능',stress:'스트레스',money:'소지금'};
 activities[uiId].description='기본 효과: '+Object.entries(rule).filter(([,v])=>v!==0).map(([key,v])=>labels[key]+' '+(v>0?'+':'')+v.toLocaleString('ko-KR')+(key==='money'?'원':'')).join(', ')+'. 수행 방식·스트레스·아이템에 따라 조정됩니다.';
}










