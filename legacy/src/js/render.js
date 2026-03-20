// UI rendering functions

function addLog(el, role, text) {
  const p = document.createElement('p');
  p.textContent = `${role}：${text}`;
  el.chatLog.appendChild(p);
  el.chatLog.scrollTop = el.chatLog.scrollHeight;
}

function setFeedback(el, text, color) {
  el.feedback.style.color = color;
  el.feedback.textContent = text;
}

function showPanel(panel, show = true) {
  if (show) {
    panel.classList.remove('hidden');
  } else {
    panel.classList.add('hidden');
  }
}

function shake() {
  document.body.classList.remove('shake');
  requestAnimationFrame(() => document.body.classList.add('shake'));
}

function renderConfetti(el) {
  const c = el.confetti;
  const ctx = c.getContext('2d');
  c.width = innerWidth;
  c.height = innerHeight;

  const parts = Array.from({ length: 120 }, () => ({
    x: Math.random() * c.width,
    y: -20,
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * 4 + 2,
    color: `hsl(${Math.random() * 360}, 90%, 65%)`
  }));

  let t = 0;
  const id = setInterval(() => {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 5, 5);
    });
    if (++t > 80) {
      clearInterval(id);
      ctx.clearRect(0, 0, c.width, c.height);
    }
  }, 16);
}

export { addLog, setFeedback, showPanel, shake, renderConfetti };
