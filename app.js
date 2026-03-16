const puzzles = [
  {
    title: '电梯里的血迹',
    story: '一个人每天坐电梯上班，某天看到电梯里有血迹，却松了口气。为什么？',
    answerKeywords: ['盲人', '导盲犬', '狗', '受伤'],
    hintKeywords: ['电梯', '上班', '血']
  },
  {
    title: '海边的脚印',
    story: '海滩上只有一串向海里走去的脚印，却没人回来。后来人却平安无事。',
    answerKeywords: ['倒着走', '后退', '脚印方向', '鞋印'],
    hintKeywords: ['海边', '脚印', '方向']
  },
  {
    title: '半夜的电话',
    story: '他半夜接了一个电话，听完后立刻睡得更香了。为什么？',
    answerKeywords: ['打错', '陌生人', '误会', '确认'],
    hintKeywords: ['电话', '半夜', '睡觉']
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
  confetti: document.getElementById('confetti')
};

let state = {
  player: '',
  round: 0,
  attempts: 0,
  current: null,
  done: false,
  lastPuzzleIndex: -1
};

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
let bgmTimer = null;

function tone(freq, dur = 0.2, type = 'sine', volume = 0.08) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

function playCorrect() {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.15, 'triangle', 0.12), i * 110));
}
function playWrong() {
  tone(180, 0.18, 'sawtooth', 0.18);
  setTimeout(() => tone(120, 0.24, 'sawtooth', 0.15), 140);
}
function playIrrelevant() {
  tone(240, 0.12, 'sine', 0.09);
  setTimeout(() => tone(190, 0.18, 'sine', 0.08), 110);
}
function startBgm() {
  if (bgmTimer) return;
  const seq = [392, 494, 587, 494];
  let i = 0;
  bgmTimer = setInterval(() => {
    tone(seq[i % seq.length], 0.12, 'square', 0.035);
    i += 1;
  }, 260);
}

function shake() {
  document.body.classList.remove('shake');
  requestAnimationFrame(() => document.body.classList.add('shake'));
}

function confettiBurst() {
  const c = el.confetti;
  const ctx = c.getContext('2d');
  c.width = innerWidth;
  c.height = innerHeight;
  const parts = Array.from({ length: 120 }, () => ({
    x: Math.random() * c.width,
    y: -20,
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * 4 + 2,
    color: `hsl(${Math.random() * 360},90%,65%)`
  }));
  let t = 0;
  const id = setInterval(() => {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 5, 5);
    });
    t += 1;
    if (t > 80) { clearInterval(id); ctx.clearRect(0,0,c.width,c.height); }
  }, 16);
}

function getRank() {
  return JSON.parse(localStorage.getItem('turtleSoupRank') || '[]');
}
function saveRank(list) {
  localStorage.setItem('turtleSoupRank', JSON.stringify(list));
}
function updateRank(player, won, attempts) {
  const list = getRank();
  const item = list.find((x) => x.name === player) || { name: player, wins: 0, games: 0, bestAttempts: null };
  if (!list.includes(item)) list.push(item);
  item.games += 1;
  if (won) {
    item.wins += 1;
    if (item.bestAttempts == null || attempts < item.bestAttempts) item.bestAttempts = attempts;
  }
  list.sort((a, b) => b.wins - a.wins || (a.bestAttempts ?? 999) - (b.bestAttempts ?? 999));
  saveRank(list);
  renderRank();
}
function renderRank() {
  const list = getRank();
  el.rankList.innerHTML = list.slice(0, 10).map((x) => `<li>${x.name}｜胜场 ${x.wins}｜局数 ${x.games}｜最佳 ${x.bestAttempts ?? '-'}</li>`).join('') || '<li>暂无记录</li>';
}

function pickPuzzle() {
  if (puzzles.length === 1) {
    state.lastPuzzleIndex = 0;
    return puzzles[0];
  }
  let idx = Math.floor(Math.random() * puzzles.length);
  if (idx === state.lastPuzzleIndex) {
    idx = (idx + 1 + Math.floor(Math.random() * (puzzles.length - 1))) % puzzles.length;
  }
  state.lastPuzzleIndex = idx;
  return puzzles[idx];
}

function startGame() {
  const name = el.playerName.value.trim();
  if (!name) return alert('请先输入玩家姓名');
  state.player = name;
  state.round += 1;
  state.attempts = 0;
  state.current = pickPuzzle();
  state.done = false;

  el.startPanel.classList.add('hidden');
  el.gamePanel.classList.remove('hidden');
  el.replayBox.classList.add('hidden');
  el.roundTitle.textContent = `第 ${state.round} 局：${state.current.title}`;
  el.playerBadge.textContent = `玩家：${state.player}`;
  el.storyText.textContent = state.current.story;
  el.hostText.textContent = '最威主持人：开猜！你可以问细节，也可以直接猜答案。';
  el.feedback.textContent = '';
  el.guessInput.value = '';
  startBgm();
}

function judgeGuess(text) {
  const q = text.toLowerCase();
  const hit = state.current.answerKeywords.some((k) => q.includes(k.toLowerCase()));
  if (hit) return 'correct';
  const maybe = state.current.hintKeywords.some((k) => q.includes(k.toLowerCase()));
  if (maybe || q.length > 6) return 'wrong';
  return 'irrelevant';
}

function submitGuess() {
  if (state.done) return;
  const guess = el.guessInput.value.trim();
  if (!guess) return;
  state.attempts += 1;
  const result = judgeGuess(guess);

  if (result === 'correct') {
    playCorrect();
    confettiBurst();
    state.done = true;
    el.feedback.style.color = 'var(--ok)';
    el.feedback.textContent = `🎉 猜对了！你用了 ${state.attempts} 次。`;
    el.hostText.textContent = `最威主持人：恭喜 ${state.player} 通关！真相就是「${state.current.answerKeywords.join(' / ')}」相关。`;
    updateRank(state.player, true, state.attempts);
    el.replayBox.classList.remove('hidden');
    return;
  }

  if (result === 'wrong') {
    playWrong();
    shake();
    el.feedback.style.color = 'var(--bad)';
    el.feedback.textContent = '❌ 不对哦，再想想逻辑哪里还差一点。';
    el.hostText.textContent = '最威主持人：这个方向接近，但还没击中关键真相。';
  } else {
    playIrrelevant();
    el.feedback.style.color = '#ffd38a';
    el.feedback.textContent = '😮‍💨 这个问题和真相关系不大。';
    el.hostText.textContent = '最威主持人：遗憾叹息~ 这个线索暂时无关。';
  }
}

el.startBtn.addEventListener('click', async () => {
  await audioCtx.resume();
  startGame();
});
el.guessBtn.addEventListener('click', submitGuess);
el.guessInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitGuess(); });
el.replayYes.addEventListener('click', startGame);
el.replayNo.addEventListener('click', () => {
  el.hostText.textContent = '最威主持人：下次再战，祝你好运！';
  updateRank(state.player, false, state.attempts || 1);
  el.startPanel.classList.remove('hidden');
  el.gamePanel.classList.add('hidden');
});

renderRank();
