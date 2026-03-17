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

## Project Structure

```
src/
├── js/
│   ├── main.js       # Entry point, event binding
│   ├── game.js       # Game state + flow control
│   ├── classifier.js # Question classification + answer judgment
│   ├── hint.js       # Hint system
│   ├── dom.js        # DOM element references
│   ├── render.js     # UI rendering functions
│   ├── sound.js      # Web Audio sound effects
│   └── rank.js       # Leaderboard localStorage
├── css/
│   ├── variables.css # CSS custom properties
│   ├── base.css     # Base styles
│   └── scene.css    # Pixel art background animation
└── data/
    └── puzzles.json  # Puzzle data
```

## CI/CD

- **CI**: `.github/workflows/ci.yml` - Validates JSON, JS syntax, HTML structure
- **CD**: `.github/workflows/deploy.yml` - Auto-deploys to GitHub Pages on push to main

## Key Features

1. **Game Flow**: Player enters name → receives puzzle story → asks yes/no questions → guesses final answer with "我猜：xxx"
2. **Ranking System**: Stored in localStorage (`turtleSoupRank`), sorted by wins then best attempts
3. **Hint System**: Auto-triggers after 3 consecutive wrong/irrelevant responses
4. **Audio**: Web Audio API generates tones (correct/wrong/irrelevant feedback)
5. **Animations**: Pixel art turtle walking, confetti burst on win, shake on wrong answer

## Development Notes

- CSS uses "Press Start 2P" pixel font (Google Fonts)
- Pixel art scene created with pure CSS (no images)
- Mobile responsive with breakpoint at 680px
- Puzzle data loaded via fetch from JSON file

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
