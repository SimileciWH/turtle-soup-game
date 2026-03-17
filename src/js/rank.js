// Leaderboard management with localStorage
const STORAGE_KEY = 'turtleSoupRank';

function getRank() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveRank(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderRank(renderFn) {
  const list = getRank();
  const html = list.slice(0, 10).map(x =>
    `<li>${x.name}｜胜场 ${x.wins}｜局数 ${x.games}｜最佳 ${x.bestAttempts ?? '-'}</li>`
  ).join('') || '<li>暂无记录</li>';
  renderFn(html);
}

function updateRank(player, won, attempts) {
  const list = getRank();
  let item = list.find(x => x.name === player);

  if (!item) {
    item = { name: player, wins: 0, games: 0, bestAttempts: null };
    list.push(item);
  }

  item.games += 1;

  if (won) {
    item.wins += 1;
    if (item.bestAttempts == null || attempts < item.bestAttempts) {
      item.bestAttempts = attempts;
    }
  }

  list.sort((a, b) =>
    b.wins - a.wins ||
    ((a.bestAttempts ?? 999) - (b.bestAttempts ?? 999))
  );

  saveRank(list);
}

export { getRank, saveRank, renderRank, updateRank };
