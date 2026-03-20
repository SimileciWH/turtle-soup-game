// Hint system - auto-triggers after 3 consecutive wrong/irrelevant responses

const DEFAULT_HINT = '回到题面，抓住最反常的细节。';

function maybeGiveHint(state, addLogFn, setFeedbackFn) {
  if (state.wrongStreak < 3) {
    return false;
  }

  state.wrongStreak = 0;
  const hints = state.current.hints || [];
  const idx = Math.min(state.hintLevel, Math.max(0, hints.length - 1));
  const hint = hints[idx] || DEFAULT_HINT;

  state.hintLevel += 1;

  addLogFn('主持人', `💡 提示：${hint}`);
  setFeedbackFn('💡 提示：hint', '#8bd3dd');

  return true;
}

export { maybeGiveHint };
