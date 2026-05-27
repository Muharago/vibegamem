// ── 효과음 ──────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}
function playSound(freq, type, duration, vol = 0.3) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}
function sfxBrick()   { playSound(440, 'square',   0.08, 0.25); }
function sfxPaddle()  { playSound(220, 'sine',     0.1,  0.2);  }
function sfxPowerup() { playSound(880, 'sine',     0.3,  0.4);  }
function sfxLose()    { playSound(120, 'sawtooth', 0.5,  0.3);  }
function sfxClear()   { playSound(660, 'sine',     0.6,  0.5);  }

/* ── LEVEL DATA ───────────────────────────── */
const LEVELS = [
  [[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1]],
  [[2,1,1,1,1,1,1,1,1,2],[1,2,1,1,1,1,1,1,2,1],[1,1,2,1,1,1,1,2,1,1],[1,1,1,2,1,1,2,1,1,1],[1,1,1,1,2,2,1,1,1,1]],
  [[0,1,0,1,0,1,0,1,0,1],[1,0,1,0,1,0,1,0,1,0],[2,2,2,2,2,2,2,2,2,2],[1,0,1,0,1,0,1,0,1,0],[0,1,0,1,0,1,0,1,0,1]],
  [[3,1,1,1,1,1,1,1,1,3],[1,3,1,1,1,1,1,1,3,1],[1,1,2,2,2,2,2,2,1,1],[1,3,1,1,1,1,1,1,3,1],[3,1,1,1,1,1,1,1,1,3]],
  [[0,0,2,2,2,2,2,2,0,0],[0,2,3,1,1,1,1,3,2,0],[2,3,1,1,1,1,1,1,3,2],[0,2,3,1,1,1,1,3,2,0],[0,0,2,2,2,2,2,2,0,0]],
  [[1,0,1,0,3,3,0,1,0,1],[0,1,0,3,1,1,3,0,1,0],[1,0,3,1,2,2,1,3,0,1],[0,1,0,3,1,1,3,0,1,0],[1,0,1,0,3,3,0,1,0,1]],
  [[2,2,2,2,2,2,2,2,2,2],[2,0,0,0,0,0,0,0,0,2],[2,0,3,3,3,3,3,3,0,2],[2,0,0,0,0,0,0,0,0,2],[2,2,2,2,2,2,2,2,2,2]],
  [[3,2,1,2,3,3,2,1,2,3],[2,3,2,1,2,2,1,2,3,2],[1,2,3,2,1,1,2,3,2,1],[2,3,2,1,2,2,1,2,3,2],[3,2,1,2,3,3,2,1,2,3]],
  [[0,3,0,3,0,0,3,0,3,0],[3,2,3,2,3,3,2,3,2,3],[0,3,2,3,2,2,3,2,3,0],[3,2,3,2,3,3,2,3,2,3],[0,3,0,3,0,0,3,0,3,0]],
  [[3,3,3,3,3,3,3,3,3,3],[3,2,2,2,2,2,2,2,2,3],[3,2,3,3,3,3,3,3,2,3],[3,2,2,2,2,2,2,2,2,3],[3,3,3,3,3,3,3,3,3,3]],
];

const BRICK_TYPES = {
  1:{ colors:['#00f5ff'], glow:'rgba(0,245,255,0.5)',   pts:10, hp:1 },
  2:{ colors:['#ff2d78'], glow:'rgba(255,45,120,0.5)',  pts:25, hp:2 },
  3:{ colors:['#aaaaaa'], glow:'rgba(180,180,180,0.4)', pts:50, hp:3 },
};

const PU_TYPES  = ['multiball','widebar','fastball'];
const PU_LABELS = { multiball:'+B', widebar:'+W', fastball:'+S' };
const PU_COLORS = { multiball:'#00f5ff', widebar:'#ffe600', fastball:'#ff8c00' };

/* ── 무한모드 점수 배율 ───────────────────────
   레벨 10개를 한 라운드로 보고, 라운드마다 배율 증가
   round 0(1~10): ×1  round 1(11~20): ×2
   round 2(21~30): ×4  round 3+(31~): ×8 이후 ×2씩 추가
─────────────────────────────────────────── */
function getMultiplier(lvl) {
  const round = Math.floor(lvl / 10);
  if (round === 0) return 1;
  if (round === 1) return 2;
  if (round === 2) return 4;
  return Math.pow(2, round + 1); // round3=16, round4=32 ...
}

const LW = 480, LH = 520;
function getScale(){ return area.getBoundingClientRect().width / LW; }

const BRICK_W=40, BRICK_H=14, BRICK_GAP=4;
const BRICK_OX=20, BRICK_OY=40;
const PADDLE_W_BASE=80;
const BALL_R=5;
const SPEED_BASE=4, SPEED_INC=0.3;
const MAX_SCORES=10;

const area      = document.getElementById('game-area');
const padEl     = document.getElementById('paddle');
const overlay   = document.getElementById('overlay');
const puHud     = document.getElementById('powerup-hud');
const lbBtn     = document.getElementById('leaderboard-btn');
const lbPanel   = document.getElementById('lb-panel');
const lbList    = document.getElementById('lb-list');
const nameModal = document.getElementById('name-modal');
const nameInput = document.getElementById('name-input');
const emailInput= document.getElementById('email-input');
const privacyChk= document.getElementById('privacy-check');
const privacyErr= document.getElementById('privacy-error');
const nameSubmit= document.getElementById('name-submit');
const scoreEl   = document.getElementById('score-val');
const bestEl    = document.getElementById('best-val');
const livesEl   = document.getElementById('lives-val');
const levelEl   = document.getElementById('level-val');
const multBadge = document.getElementById('multiplier-badge');
const multVal   = document.getElementById('mult-val');
const startBtn  = document.getElementById('start-btn');
const btnLeft   = document.getElementById('btn-left');
const btnRight  = document.getElementById('btn-right');
const btnPause  = document.getElementById('btn-pause');

let state='idle', score=0, lives=3, level=0;
let bricks=[], balls=[], powerups=[];
let px, paddleW, baseSpeed;
let keys={}, paused=false, raf;
let puActive={ multiball:false, widebar:false, fastball:false };
let puTimers ={ multiball:null,  widebar:null,  fastball:null };

/* ── LEADERBOARD (로컬 fallback) ─────────── */
function loadScores(){ try{ return JSON.parse(localStorage.getItem('bk_scores')||'[]'); }catch(e){ return []; } }
function saveScoreLocal(name,pts){
  const arr=loadScores();
  arr.push({name:(name.toUpperCase().slice(0,8)||'ANON'), score:pts});
  arr.sort((a,b)=>b.score-a.score); arr.splice(MAX_SCORES);
  localStorage.setItem('bk_scores',JSON.stringify(arr));
}
function isHighScore(pts){ const arr=loadScores(); return arr.length<MAX_SCORES||pts>(arr[arr.length-1]||{score:-1}).score; }

lbBtn.addEventListener('click',()=>{
  lbPanel.classList.toggle('open');
  lbBtn.textContent=lbPanel.classList.contains('open')?'RANKING ▴':'RANKING ▾';
  if(lbPanel.classList.contains('open')){
    if(window.loadOnlineLeaderboard) window.loadOnlineLeaderboard();
  }
});

/* ── HELPERS ─────────────────────────────── */
function livesStr(n){ return Array(Math.max(0,n)).fill('♥').join(' ')||'---'; }
function updateHUD(){
  scoreEl.textContent=score;
  livesEl.textContent=livesStr(lives);
  levelEl.textContent=level+1;
  bestEl.textContent=(loadScores()[0]||{score:0}).score.toLocaleString();
  const mult=getMultiplier(level);
  if(mult>1){
    multBadge.style.display='block';
    multVal.textContent=mult;
  } else {
    multBadge.style.display='none';
  }
}

function spawnParticles(lx,ly,color){
  const s=getScale();
  for(let i=0;i<6;i++){
    const p=document.createElement('div'); p.className='particle';
    const angle=(i/6)*Math.PI*2, dist=(20+Math.random()*20)*s;
    p.style.cssText=`left:${lx*s}px;top:${ly*s}px;width:${4*s}px;height:${4*s}px;background:${color};--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;`;
    area.appendChild(p); setTimeout(()=>p.remove(),400);
  }
}

function makeBall(lx,ly,vx,vy,fast=false){
  const s=getScale();
  const el=document.createElement('div'); el.className='ball-el'+(fast?' fast':'');
  const d=BALL_R*2*s;
  el.style.cssText=`left:${lx*s}px;top:${ly*s}px;width:${d}px;height:${d}px;`;
  area.appendChild(el);
  return {x:lx,y:ly,vx,vy,el,fast};
}
function updateBallEl(b){
  const s=getScale(), d=BALL_R*2*s;
  b.el.style.left=(b.x*s)+'px'; b.el.style.top=(b.y*s)+'px';
  b.el.style.width=d+'px'; b.el.style.height=d+'px';
}

/* ── POWERUP ─────────────────────────────── */
function activatePowerup(type){
  sfxPowerup();
  if(puTimers[type]) clearTimeout(puTimers[type]);
  puActive[type]=true;
  if(type==='widebar'){ paddleW=Math.min(LW-20,(PADDLE_W_BASE-(level%10)*4)*2); applyPaddleEl(); padEl.classList.add('powered'); }
  if(type==='fastball'){ balls.forEach(b=>{ if(!b.fast){ const spd=baseSpeed*2,m=Math.hypot(b.vx,b.vy); b.vx=b.vx/m*spd; b.vy=b.vy/m*spd; b.fast=true; b.el.classList.add('fast'); }}); }
  if(type==='multiball'){ [...balls].forEach(b=>{ const spd=Math.hypot(b.vx,b.vy),a=Math.atan2(b.vy,b.vx)+0.4; balls.push(makeBall(b.x,b.y,Math.cos(a)*spd,Math.sin(a)*spd,b.fast)); }); }
  renderPuHud();
  puTimers[type]=setTimeout(()=>deactivatePowerup(type),8000);
}
function deactivatePowerup(type){
  puActive[type]=false; puTimers[type]=null;
  if(type==='widebar'){ paddleW=Math.max(40,PADDLE_W_BASE-(level%10)*4); applyPaddleEl(); padEl.classList.remove('powered'); }
  if(type==='fastball'){ balls.forEach(b=>{ if(b.fast){ const spd=baseSpeed,m=Math.hypot(b.vx,b.vy); b.vx=b.vx/m*spd; b.vy=b.vy/m*spd; b.fast=false; b.el.classList.remove('fast'); }}); }
  renderPuHud();
}
function renderPuHud(){
  puHud.innerHTML='';
  const labels={multiball:'멀티볼',widebar:'바 확장',fastball:'스피드'};
  PU_TYPES.forEach(t=>{ if(puActive[t]){ const d=document.createElement('div'); d.className='pu-badge '+t; d.textContent=labels[t]+' ON'; puHud.appendChild(d); }});
}
function applyPaddleEl(){ const s=getScale(); padEl.style.width=(paddleW*s)+'px'; padEl.style.left=(px*s)+'px'; }

/* ── BUILD LEVEL (무한 루프) ─────────────── */
function buildLevel(){
  area.querySelectorAll('.brick,.powerup-el').forEach(e=>e.remove());
  powerups=[]; bricks=[];
  const s=getScale();
  const map=LEVELS[level % LEVELS.length]; // 10레벨 순환
  map.forEach((row,r)=>{
    row.forEach((t,c)=>{
      if(!t) return;
      const cfg=BRICK_TYPES[t];
      const lx=BRICK_OX+c*(BRICK_W+BRICK_GAP), ly=BRICK_OY+r*(BRICK_H+BRICK_GAP);
      const el=document.createElement('div'); el.className='brick';
      el.style.cssText=`left:${lx*s}px;top:${ly*s}px;width:${BRICK_W*s}px;height:${BRICK_H*s}px;background:${cfg.colors[0]};box-shadow:0 0 6px ${cfg.glow},inset 0 1px 0 rgba(255,255,255,0.2);`;
      area.appendChild(el);
      bricks.push({x:lx,y:ly,w:BRICK_W,h:BRICK_H,el,pts:cfg.pts,hp:cfg.hp,maxHp:cfg.hp,type:t,alive:true});
    });
  });
}

function resetRound(){
  balls.forEach(b=>b.el.remove()); balls=[];
  paddleW=Math.max(40, PADDLE_W_BASE-(level%10)*4);
  px=(LW-paddleW)/2;
  padEl.classList.remove('powered');
  applyPaddleEl();
  // 라운드가 높을수록 기본 속도 증가
  const round=Math.floor(level/10);
  baseSpeed=SPEED_BASE + (level%10)*SPEED_INC + round*0.8;
  const angle=(Math.random()*60+60)*Math.PI/180;
  balls.push(makeBall(LW/2-BALL_R, LH-80, baseSpeed*Math.cos(angle)*(Math.random()<0.5?1:-1), -baseSpeed*Math.sin(angle)));
  PU_TYPES.forEach(t=>{ if(puTimers[t]) clearTimeout(puTimers[t]); puActive[t]=false; });
  renderPuHud();
}

/* ── START / OVER ────────────────────────── */
function startGame(){
  score=0; lives=3; level=0;
  overlay.style.display='none'; nameModal.style.display='none';
  updateHUD(); buildLevel(); resetRound();
  state='playing'; paused=false;
  area.focus(); cancelAnimationFrame(raf); loop();
}
function nextLevel(){ level++; updateHUD(); buildLevel(); resetRound(); state='playing'; loop(); }
function gameOver(){
  state='over'; cancelAnimationFrame(raf);
  saveScoreLocal(nameInput.value||'ANON', score);
  nameModal.style.display='flex';
  nameInput.value=''; emailInput.value='';
  privacyChk.checked=false; privacyErr.style.display='none';
  nameInput.focus();
}
function showGameOverOverlay(){
  const mult=getMultiplier(level);
  overlay.innerHTML=`
    <h1 style="color:var(--pink);font-size:clamp(14px,4vw,20px);">GAME OVER</h1>
    <p class="sub">SCORE&nbsp;<em>${score.toLocaleString()}</em><br>LEVEL&nbsp;<em>${level+1}</em>${mult>1?`<br>최고배율&nbsp;<em>×${mult}</em>`:''}</p>
    <button class="ov-btn" id="start-btn">RETRY</button>`;
  overlay.style.display='flex';
  document.getElementById('start-btn').addEventListener('click',startGame);
  if(window.loadOnlineLeaderboard){
    if(!lbPanel.classList.contains('open')){ lbPanel.classList.add('open'); lbBtn.textContent='RANKING ▴'; }
    window.loadOnlineLeaderboard();
  }
}

nameSubmit.addEventListener('click', async ()=>{
  const name  = nameInput.value.trim() || 'ANON';
  const email = emailInput.value.trim();
  if(!privacyChk.checked){
    privacyErr.style.display='block'; return;
  }
  privacyErr.style.display='none';
  nameModal.style.display='none';
  // Firebase에 저장 (이메일 포함)
  if(window.saveScoreOnline){
    await window.saveScoreOnline(name, email, score, level+1);
  }
  showGameOverOverlay();
});
nameInput.addEventListener('keydown',e=>{ if(e.key==='Enter') emailInput.focus(); });
emailInput.addEventListener('keydown',e=>{ if(e.key==='Enter') nameSubmit.click(); });

/* ── MAIN LOOP ───────────────────────────── */
const PADDLE_Y = LH - 20 - 10;

function loop(){
  if(state!=='playing') return;
  if(paused){ raf=requestAnimationFrame(loop); return; }

  const MV=7;
  if(keys['ArrowLeft']||keys['a'])  px=Math.max(0,px-MV);
  if(keys['ArrowRight']||keys['d']) px=Math.min(LW-paddleW,px+MV);
  applyPaddleEl();

  const s=getScale();
  for(let i=powerups.length-1;i>=0;i--){
    const pu=powerups[i]; pu.y+=2.5;
    pu.el.style.top=(pu.y*s)+'px';
    if(pu.y+18>=PADDLE_Y && pu.y<=PADDLE_Y+14 && pu.x+18>=px && pu.x<=px+paddleW){
      activatePowerup(pu.type); pu.el.remove(); powerups.splice(i,1); continue;
    }
    if(pu.y>LH){ pu.el.remove(); powerups.splice(i,1); }
  }

  let alive=0;
  for(let bi=balls.length-1;bi>=0;bi--){
    const b=balls[bi];
    b.x+=b.vx; b.y+=b.vy;
    if(b.x<=0){              b.x=0;           b.vx=Math.abs(b.vx); }
    if(b.x>=LW-BALL_R*2){   b.x=LW-BALL_R*2; b.vx=-Math.abs(b.vx); }
    if(b.y<=0){              b.y=0;           b.vy=Math.abs(b.vy); }
    if(b.y>=LH){ b.el.remove(); balls.splice(bi,1); continue; }
    alive++;

    if(b.y+BALL_R*2>=PADDLE_Y && b.y+BALL_R*2<=PADDLE_Y+16 && b.x+BALL_R*2>=px && b.x<=px+paddleW && b.vy>0){
      b.vy=-Math.abs(b.vy);
      sfxPaddle();
      const rel=(b.x+BALL_R-px)/paddleW;
      const spd=puActive.fastball?baseSpeed*2:baseSpeed;
      b.vx=(rel-0.5)*2*spd*1.4;
      b.y=PADDLE_Y-BALL_R*2-1;
    }

    for(const br of bricks){
      if(!br.alive) continue;
      if(b.x+BALL_R*2>br.x&&b.x<br.x+br.w&&b.y+BALL_R*2>br.y&&b.y<br.y+br.h){
        br.hp--;
        if(br.hp<=0){
          br.alive=false; br.el.remove();
          sfxBrick();
          const mult=getMultiplier(level);
          score+=br.pts*(level+1)*mult; updateHUD();
          spawnParticles(br.x+br.w/2, br.y+br.h/2, BRICK_TYPES[br.type].colors[0]);
          if(Math.random()<0.20){
            const pt=PU_TYPES[Math.floor(Math.random()*3)];
            const pel=document.createElement('div'); pel.className='powerup-el';
            const pw=18*s, ph=18*s;
            pel.style.cssText=`left:${(br.x+br.w/2-9)*s}px;top:${br.y*s}px;width:${pw}px;height:${ph}px;background:${PU_COLORS[pt]};color:#000;font-size:${6*s}px;`;
            pel.textContent=PU_LABELS[pt];
            area.appendChild(pel);
            powerups.push({x:br.x+br.w/2-9, y:br.y, type:pt, el:pel});
          }
        } else {
          br.el.style.opacity=0.5+(br.hp/br.maxHp)*0.5;
          br.el.style.boxShadow=`0 0 4px ${BRICK_TYPES[br.type].glow}`;
        }
        const ol=(b.x+BALL_R*2)-br.x, or2=br.x+br.w-b.x, ot=(b.y+BALL_R*2)-br.y, ob=br.y+br.h-b.y;
        if(Math.min(ol,or2)<Math.min(ot,ob)) b.vx=-b.vx; else b.vy=-b.vy;
        break;
      }
    }
    updateBallEl(b);
  }

  if(alive===0){
    sfxLose();
    lives--;
    if(lives<=0){ gameOver(); return; }
    updateHUD(); resetRound();
    raf=requestAnimationFrame(loop); return;
  }

  if(bricks.filter(b=>b.alive).length===0){
    sfxClear();
    state='clear'; cancelAnimationFrame(raf);
    score+=500*(level+1)*getMultiplier(level); updateHUD();
    setTimeout(nextLevel,700); return;
  }

  raf=requestAnimationFrame(loop);
}

/* ── INPUT ───────────────────────────────── */
document.addEventListener('keydown',e=>{ keys[e.key]=true; if(e.key===' '&&state==='playing'){ paused=!paused; e.preventDefault(); }});
document.addEventListener('keyup',e=>{ keys[e.key]=false; });

area.addEventListener('mousemove',e=>{
  if(state!=='playing') return;
  const rect=area.getBoundingClientRect();
  px=Math.max(0,Math.min(LW-paddleW,(e.clientX-rect.left)/getScale()-paddleW/2));
  applyPaddleEl();
});

let lastTouchX=null;
area.addEventListener('touchstart',e=>{ e.preventDefault(); lastTouchX=e.touches[0].clientX; },{ passive:false });
area.addEventListener('touchmove',e=>{
  e.preventDefault();
  if(state!=='playing'||lastTouchX===null) return;
  const dx=(e.touches[0].clientX-lastTouchX)/getScale();
  lastTouchX=e.touches[0].clientX;
  px=Math.max(0,Math.min(LW-paddleW,px+dx));
  applyPaddleEl();
},{ passive:false });
area.addEventListener('touchend',()=>{ lastTouchX=null; });

let leftHeld=false, rightHeld=false;
function holdLoop(){
  if(state==='playing'&&!paused){
    if(leftHeld){  px=Math.max(0,px-9);          applyPaddleEl(); }
    if(rightHeld){ px=Math.min(LW-paddleW,px+9); applyPaddleEl(); }
  }
  if(leftHeld||rightHeld) requestAnimationFrame(holdLoop);
}
btnLeft.addEventListener('touchstart', e=>{ e.preventDefault(); leftHeld=true;  holdLoop(); },{ passive:false });
btnLeft.addEventListener('touchend',   e=>{ e.preventDefault(); leftHeld=false; },{ passive:false });
btnRight.addEventListener('touchstart',e=>{ e.preventDefault(); rightHeld=true; holdLoop(); },{ passive:false });
btnRight.addEventListener('touchend',  e=>{ e.preventDefault(); rightHeld=false;},{ passive:false });
btnLeft.addEventListener('mousedown',  ()=>{ leftHeld=true;  holdLoop(); });
btnLeft.addEventListener('mouseup',    ()=>{ leftHeld=false; });
btnRight.addEventListener('mousedown', ()=>{ rightHeld=true; holdLoop(); });
btnRight.addEventListener('mouseup',   ()=>{ rightHeld=false;});
btnPause.addEventListener('click',()=>{ if(state==='playing'){ paused=!paused; btnPause.textContent=paused?'▶':'II'; }});

window.addEventListener('resize',()=>{
  if(state==='playing'||state==='clear'){
    buildLevel(); applyPaddleEl();
    balls.forEach(b=>updateBallEl(b));
  }
});

startBtn.addEventListener('click', startGame);
startBtn.addEventListener('touchend', e => {
  e.preventDefault();
  startGame();
});