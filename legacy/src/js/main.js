// Main entry point - event binding and initialization

import { el } from './dom.js';
import { startGame, submitGuess, replayYes, replayNo, setPuzzles, getState } from './game.js';
import { resumeAudio } from './sound.js';
import { renderRank } from './rank.js';

async function init() {
  // Load puzzles from JSON
  try {
    const response = await fetch('./src/data/puzzles.json');
    const puzzles = await response.json();
    setPuzzles(puzzles);
  } catch (e) {
    console.error('Failed to load puzzles:', e);
  }

  // Bind events
  el.startBtn.addEventListener('click', async () => {
    await resumeAudio();
    startGame();
  });

  el.guessBtn.addEventListener('click', submitGuess);
  el.guessInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitGuess();
  });

  el.replayYes.addEventListener('click', replayYes);
  el.replayNo.addEventListener('click', replayNo);

  // Render initial leaderboard
  renderRank(html => {
    el.rankList.innerHTML = html;
  });
}

init();
