// Question classification and answer judgment

function isFinalGuess(text) {
  return /^\s*(我猜|答案|guess)\s*[:：]/i.test(text);
}

function classifyQuestion(text, currentPuzzle) {
  const q = text.toLowerCase();

  if (currentPuzzle.yes.some(k => q.includes(k.toLowerCase()))) {
    return 'yes';
  }

  if (currentPuzzle.no.some(k => q.includes(k.toLowerCase()))) {
    return 'no';
  }

  return 'irrelevant';
}

function judgeFinalAnswer(text, currentPuzzle) {
  const guess = text
    .replace(/^\s*(我猜|答案|guess)\s*[:：]\s*/i, '')
    .toLowerCase();

  const hit = currentPuzzle.answerKeywords
    .filter(k => guess.includes(k.toLowerCase()))
    .length;

  return hit >= 1;
}

export { isFinalGuess, classifyQuestion, judgeFinalAnswer };
