// Web Audio API sound effects
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();

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

function resumeAudio() {
  return audioCtx.resume();
}

function playCorrect() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((f, i) => {
    setTimeout(() => tone(f, 0.15, 'triangle', 0.12), i * 110);
  });
}

function playWrong() {
  tone(180, 0.18, 'sawtooth', 0.18);
  setTimeout(() => tone(120, 0.24, 'sawtooth', 0.15), 140);
}

function playIrrelevant() {
  tone(240, 0.12, 'sine', 0.09);
  setTimeout(() => tone(190, 0.18, 'sine', 0.08), 110);
}

export { resumeAudio, playCorrect, playWrong, playIrrelevant };
