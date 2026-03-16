const puzzles = [
  {
    title: '电梯里的血迹',
    story: '一个人每天坐电梯上班，某天看到电梯里有血迹，却松了口气。为什么？',
    solution: '他是盲人，依赖导盲犬。看到血迹说明受伤的是狗而不是自己或家人，所以先松了口气。',
    answerKeywords: ['盲人', '导盲犬', '狗', '受伤'],
    hints: ['和“人的视觉状态”有关。', '关注受伤对象是谁，不是人。'],
    yes: ['狗', '导盲犬', '受伤', '血', '盲'],
    no: ['杀人', '电梯故障', '自残', '抢劫']
  },
  {
    title: '海边的脚印',
    story: '海滩上只有一串向海里走去的脚印，却没人回来。后来人却平安无事。',
    solution: '那个人是倒着走进海里的，离开时顺着原路倒退回来，所以看起来像只有走向海里的脚印。',
    answerKeywords: ['倒着走', '后退', '脚印方向'],
    hints: ['关键在“脚印方向”和“走路方向”不是一回事。', '想想人能不能倒着移动。'],
    yes: ['脚印', '方向', '倒着', '后退'],
    no: ['溺水', '被海浪卷走', '失踪', '谋杀']
  },
  {
    title: '半夜的电话',
    story: '他半夜接了一个电话，听完后立刻睡得更香了。为什么？',
    solution: '电话是打错的，他因此确认真正要担心的事没有发生，于是安心睡了。',
    answerKeywords: ['打错', '误拨', '确认', '没事'],
    hints: ['这通电话不是他本来要等的那通。', '“打错电话”本身就是线索。'],
    yes: ['打错', '误会', '确认', '没事'],
    no: ['中奖', '求救', '表白', '报警']
  }
];

const el = {
  startPanel: document.getElementById('startPanel'),
  gamePanel: document.getElementById('gamePanel'),
  playerName: document.getElementById('playerName'),
  startBtn: document.getElementById('startBtn'),
  roundTitle: document.getElementById('roundTitle'),
  playerBadge: document.getElementById('playerBadge'),
  storyText: document.getElementById('storyText'),
  hostText: document.getElementById('hostText'),
  guessInput: document.getElementById('guessInput'),
  guessBtn: document.getElementById('guessBtn'),
  feedback: document.getElementById('feedback'),
  replayBox: document.getElementById('replayBox'),
  replayYes: document.getElementById('replayYes'),
  replayNo: document.getElementById('replayNo'),
  rankList: document.getElementById('rankList'),
  confetti: document.getElementById('confetti'),
  chatLog: document.getElementById('chatLog')
};

let state = { player: '', round: 0, attempts: 0, current: null, done: false, lastPuzzleIndex: -1, wrongStreak: 0, hintLevel: 0 };

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
function tone(freq, dur = 0.2, type = 'sine', volume = 0.08) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq; gain.gain.value = volume;
  osc.connect(gain).connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + dur);
}
const playCorrect = () => [523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,0.15,'triangle',0.12),i*110));
const playWrong = () => { tone(180,0.18,'sawtooth',0.18); setTimeout(()=>tone(120,0.24,'sawtooth',0.15),140); };
const playIrrelevant = () => { tone(240,0.12,'sine',0.09); setTimeout(()=>tone(190,0.18,'sine',0.08),110); };
const shake = () => { document.body.classList.remove('shake'); requestAnimationFrame(()=>document.body.classList.add('shake')); };

function confettiBurst() {
  const c = el.confetti, ctx = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const parts = Array.from({ length: 120 }, () => ({ x: Math.random()*c.width, y:-20, vx:(Math.random()-0.5)*5, vy:Math.random()*4+2, color:`hsl(${Math.random()*360},90%,65%)`}));
  let t=0; const id=setInterval(()=>{ctx.clearRect(0,0,c.width,c.height); parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.06;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5)}); if(++t>80){clearInterval(id);ctx.clearRect(0,0,c.width,c.height)}},16);
}

function getRank(){ return JSON.parse(localStorage.getItem('turtleSoupRank')||'[]'); }
function saveRank(list){ localStorage.setItem('turtleSoupRank', JSON.stringify(list)); }
function renderRank(){ const list=getRank(); el.rankList.innerHTML=list.slice(0,10).map(x=>`<li>${x.name}｜胜场 ${x.wins}｜局数 ${x.games}｜最佳 ${x.bestAttempts ?? '-'}</li>`).join('')||'<li>暂无记录</li>'; }
function updateRank(player, won, attempts){
  const list=getRank(); let item=list.find(x=>x.name===player); if(!item){ item={name:player,wins:0,games:0,bestAttempts:null}; list.push(item); }
  item.games += 1; if(won){ item.wins += 1; if(item.bestAttempts==null||attempts<item.bestAttempts) item.bestAttempts=attempts; }
  list.sort((a,b)=>b.wins-a.wins||((a.bestAttempts??999)-(b.bestAttempts??999))); saveRank(list); renderRank();
}

function pickPuzzle(){
  if(puzzles.length===1){ state.lastPuzzleIndex=0; return puzzles[0]; }
  let idx=Math.floor(Math.random()*puzzles.length);
  if(idx===state.lastPuzzleIndex) idx=(idx+1+Math.floor(Math.random()*(puzzles.length-1)))%puzzles.length;
  state.lastPuzzleIndex=idx; return puzzles[idx];
}

function addLog(role, text){
  const p=document.createElement('p');
  p.textContent = `${role}：${text}`;
  el.chatLog.appendChild(p);
  el.chatLog.scrollTop = el.chatLog.scrollHeight;
}

function startGame(){
  const name = el.playerName.value.trim(); if(!name) return alert('请先输入玩家姓名');
  state.player=name; state.round+=1; state.attempts=0; state.current=pickPuzzle(); state.done=false; state.wrongStreak=0; state.hintLevel=0;
  el.startPanel.classList.add('hidden'); el.gamePanel.classList.remove('hidden'); el.replayBox.classList.add('hidden');
  el.roundTitle.textContent=`第 ${state.round} 局：${state.current.title}`;
  el.playerBadge.textContent=`玩家：${state.player}`; el.storyText.textContent=state.current.story;
  el.hostText.textContent='最威主持人：先问问题，我只回答“是/不是/无关”。要猜答案请写“我猜：...”。';
  el.feedback.textContent=''; el.guessInput.value=''; el.chatLog.innerHTML='';
  addLog('主持人', '游戏开始，来吧！');
}

function classifyQuestion(text){
  const q=text.toLowerCase();
  if(state.current.yes.some(k=>q.includes(k.toLowerCase()))) return 'yes';
  if(state.current.no.some(k=>q.includes(k.toLowerCase()))) return 'no';
  return 'irrelevant';
}
function isFinalGuess(text){ return /^\s*(我猜|答案|guess)\s*[:：]/i.test(text); }
function judgeFinalAnswer(text){
  const guess=text.replace(/^\s*(我猜|答案|guess)\s*[:：]\s*/i,'').toLowerCase();
  const hit=state.current.answerKeywords.filter(k=>guess.includes(k.toLowerCase())).length;
  return hit>=1;
}

function maybeGiveHint() {
  if (state.wrongStreak < 3) return false;
  state.wrongStreak = 0;
  const hints = state.current.hints || [];
  const idx = Math.min(state.hintLevel, Math.max(0, hints.length - 1));
  const hint = hints[idx] || '回到题面，抓住最反常的细节。';
  state.hintLevel += 1;
  addLog('主持人', `💡 提示：${hint}`);
  el.feedback.style.color = '#8bd3dd';
  el.feedback.textContent = `💡 提示：${hint}`;
  return true;
}

function submitGuess(){
  if(state.done) return;
  const input=el.guessInput.value.trim(); if(!input) return;
  state.attempts += 1; addLog(state.player, input); el.guessInput.value='';

  if(isFinalGuess(input)){
    if(judgeFinalAnswer(input)){
      playCorrect(); confettiBurst(); state.done=true; state.wrongStreak = 0;
      el.feedback.style.color='var(--ok)'; el.feedback.textContent=`🎉 猜对了！你用了 ${state.attempts} 次。`;
      el.hostText.textContent=`最威主持人：恭喜 ${state.player} 通关！`;
      addLog('主持人', `回答正确！真相：${state.current.solution}`);
      updateRank(state.player,true,state.attempts); el.replayBox.classList.remove('hidden');
    }else{
      playWrong(); shake(); state.wrongStreak += 1;
      el.feedback.style.color='var(--bad)'; el.feedback.textContent='还没命中真相，可以继续提问或再次“我猜：...”';
      addLog('主持人', '不是（最终答案未命中关键点）。');
      maybeGiveHint();
    }
    return;
  }

  const result=classifyQuestion(input);
  if(result==='yes'){
    state.wrongStreak = 0;
    el.feedback.style.color='var(--ok)'; el.feedback.textContent='主持人回答：是';
    addLog('主持人','是');
  }else if(result==='no'){
    playWrong(); shake(); state.wrongStreak += 1;
    el.feedback.style.color='var(--bad)'; el.feedback.textContent=`主持人回答：不是（偏离累计 ${state.wrongStreak}/3）`;
    addLog('主持人','不是');
    maybeGiveHint();
  }else{
    playIrrelevant(); state.wrongStreak += 1;
    el.feedback.style.color='#ffd38a'; el.feedback.textContent=`主持人回答：无关（偏离累计 ${state.wrongStreak}/3）`;
    addLog('主持人','无关');
    maybeGiveHint();
  }
}

el.startBtn.addEventListener('click', async ()=>{ await audioCtx.resume(); startGame(); });
el.guessBtn.addEventListener('click', submitGuess);
el.guessInput.addEventListener('keydown', e=>{ if(e.key==='Enter') submitGuess(); });
el.replayYes.addEventListener('click', startGame);
el.replayNo.addEventListener('click', ()=>{
  el.hostText.textContent='最威主持人：下次再战，祝你好运！';
  updateRank(state.player,false,state.attempts||1); el.startPanel.classList.remove('hidden'); el.gamePanel.classList.add('hidden');
});

renderRank();
