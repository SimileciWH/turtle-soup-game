# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**海龟汤像素馆** (Turtle Soup Pixel Museum) - A Chinese riddle puzzle game where players ask yes/no questions to guess the solution to a story puzzle.

## Tech Stack

- Vanilla HTML/CSS/JavaScript (ES Modules)
- Single-page application
- Web Audio API for sound effects
- localStorage for leaderboard persistence

## Commands

No build process required. For local development:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Module Architecture & Data Flow

```
main.js  →  loads puzzles.json → setPuzzles(game.js)
         →  binds DOM events → calls game.js functions

game.js  →  holds game state (player, round, attempts, wrongStreak, hintLevel)
         →  on submitGuess: classifier.js determines yes/no/irrelevant
         →  on final guess ("我猜：xxx"): classifier.judgeFinalAnswer checks answerKeywords
         →  on wrong streak ≥ 3: hint.js.maybeGiveHint fires, resets wrongStreak
         →  on win: rank.js.updateRank persists to localStorage

classifier.js → keyword matching only (no AI):
  - classifyQuestion: checks puzzle.yes[] / puzzle.no[] keyword arrays
  - judgeFinalAnswer: strips "我猜：" prefix, checks puzzle.answerKeywords[]
  - isFinalGuess: regex /^\s*(我猜|答案|guess)\s*[:：]/i
```

## Puzzle JSON Schema

Each entry in `src/data/puzzles.json` must have:

```json
{
  "title": "谜题标题",
  "story": "玩家看到的故事描述",
  "solution": "完整真相说明",
  "yes": ["keyword1", "keyword2"],         // question triggers "是" response
  "no": ["keyword3", "keyword4"],          // question triggers "不是" response
  "answerKeywords": ["key1", "key2"],      // final guess match (≥1 hit = win)
  "hints": ["提示1", "提示2"]              // optional; auto-given after 3 wrong streak
}
```

CI validates that `title`, `story`, `solution` are present for every puzzle.

## CI/CD

- **CI**: `.github/workflows/ci.yml` - Validates JSON schema, JS syntax (`node --check`), HTML panel IDs
- **CD**: `.github/workflows/deploy.yml` - Auto-deploys to GitHub Pages on push to main
- ESLint runs with `continue-on-error: true` (non-blocking)

## Project Tracking

- **Bugs**: `issues/issue_tracking.md` — prepend new entries; mark fixed ones inline
- **Features**: `docs/feature_dev_list.md` — prepend new entries with detailed steps; update status on completion/pause/cancel
- **Tests**: `tests/` folder — one test case per bug fix; added to CI before merge
- **Screenshots**: `validation/MMDDHHММ/` — new folder per validation run

## Development Notes

- CSS uses "Press Start 2P" pixel font (Google Fonts)
- Pixel art scene created with pure CSS (no images)
- Mobile responsive with breakpoint at 680px
- Puzzle data loaded via `fetch('./src/data/puzzles.json')` — requires HTTP server (not `file://`)
- localStorage key: `turtleSoupRank` — array of `{name, wins, bestAttempts}`

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
- `/plan-ceo-review`
- `/plan-eng-review`
- `/plan-design-review`
- `/design-consultation`
- `/review`
- `/ship`
- `/browse`
- `/qa`
- `/qa-only`
- `/qa-design-review`
- `/setup-browser-cookies`
- `/retro`
- `/document-release`

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.
