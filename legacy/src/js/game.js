// Game state and logic controller

import { el } from './dom.js';
import { playCorrect, playWrong, playIrrelevant } from './sound.js';
import { updateRank } from './rank.js';
import { classifyQuestion, judgeFinalAnswer, isFinalGuess } from './classifier.js';
import { maybeGiveHint } from './hint.js';
import { addLog, setFeedback, showPanel, shake, renderConfetti } from './render.js';

let puzzles = [];
let state = {
  player: '',
  round: 0,
  attempts: 0,
  current: null,
  done: false,
  lastPuzzleIndex: -1,
  wrongStreak: 0,
  hintLevel: 0
};

function setPuzzles(data) {
  puzzles = data;
}

function getState() {
  return state;
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

  if (!name) {
    alert('请先输入玩家姓名');
    return;
  }

  if (!puzzles.length) {
    alert('题库还未加载，请刷新页面重试');
    return;
  }

  state.player = name;
  state.round += 1;
  state.attempts = 0;
  state.current = pickPuzzle();
  state.done = false;
  state.wrongStreak = 0;
  state.hintLevel = 0;

  showPanel(el.startPanel, false);
  showPanel(el.gamePanel, true);
  showPanel(el.replayBox, false);

  el.roundTitle.textContent = `第 ${state.round} 局：${state.current.title}`;
  el.playerBadge.textContent = `玩家：${state.player}`;
  el.storyText.textContent = state.current.story;
  el.hostText.textContent = '最威主持人：先问问题，我只回答"是/不是/无关"。要猜答案请写"我猜：..."。';
  el.feedback.textContent = '';
  el.guessInput.value = '';
  el.chatLog.innerHTML = '';

  addLog(el, '主持人', '游戏开始，来吧！');
}

function handleCorrectAnswer() {
  playCorrect();
  renderConfetti(el);
  state.done = true;
  state.wrongStreak = 0;

  setFeedback(el, `🎉 猜对了！你用了 ${state.attempts} 次。`, 'var(--ok)');
  el.hostText.textContent = `最威主持人：恭喜 ${state.player} 通关！`;

  addLog(el, '主持人', `回答正确！真相：${state.current.solution}`);
  updateRank(state.player, true, state.attempts);
  showPanel(el.replayBox, true);
}

function handleWrongAnswer() {
  playWrong();
  shake();
  state.wrongStreak += 1;

  setFeedback(el, '还没命中真相，可以继续提问或再次"我猜：..."', 'var(--bad)');
  addLog(el, '主持人', '不是（最终答案未命中关键点）。');

  maybeGiveHint(state,
    (role, text) => addLog(el, role, text),
    (text, color) => setFeedback(el, text, color)
  );
}

function handleYesAnswer() {
  state.wrongStreak = 0;
  setFeedback(el, '主持人回答：是', 'var(--ok)');
  addLog(el, '主持人', '是');
}

function handleNoAnswer() {
  playWrong();
  shake();
  state.wrongStreak += 1;

  setFeedback(el, `主持人回答：不是（偏离累计 ${state.wrongStreak}/3）`, 'var(--bad)');
  addLog(el, '主持人', '不是');

  maybeGiveHint(state,
    (role, text) => addLog(el, role, text),
    (text, color) => setFeedback(el, text, color)
  );
}

function handleIrrelevantAnswer() {
  playIrrelevant();
  state.wrongStreak += 1;

  setFeedback(el, `主持人回答：无关（偏离累计 ${state.wrongStreak}/3）`, '#ffd38a');
  addLog(el, '主持人', '无关');

  maybeGiveHint(state,
    (role, text) => addLog(el, role, text),
    (text, color) => setFeedback(el, text, color)
  );
}

function submitGuess() {
  if (state.done) return;

  const input = el.guessInput.value.trim();
  if (!input) return;

  state.attempts += 1;
  addLog(el, state.player, input);
  el.guessInput.value = '';

  if (isFinalGuess(input)) {
    if (judgeFinalAnswer(input, state.current)) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
    return;
  }

  const result = classifyQuestion(input, state.current);

  switch (result) {
    case 'yes':
      handleYesAnswer();
      break;
    case 'no':
      handleNoAnswer();
      break;
    default:
      handleIrrelevantAnswer();
  }
}

function replayYes() {
  startGame();
}

function replayNo() {
  el.hostText.textContent = '最威主持人：下次再战，祝你好运！';
  updateRank(state.player, false, state.attempts || 1);
  showPanel(el.startPanel, true);
  showPanel(el.gamePanel, false);
}

export {
  setPuzzles,
  getState,
  startGame,
  submitGuess,
  replayYes,
  replayNo
};
