# Board Room Chess

A polished, browser-based chess application built with vanilla JavaScript, CSS, and [chess.js](https://github.com/jhlywa/chess.js). Features both human-vs-human and human-vs-computer play with a responsive, accessible interface.

![Chess Demo](https://img.shields.io/badge/Chess-Game-243f31?style=for-the-badge&logo=chess&logoColor=f6d55c)
![Vite](https://img.shields.io/badge/Vite-8.1.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)

---

## ✨ Features

### Game Modes
- **Two Players** — Local multiplayer on the same device
- **vs Computer** — Play against a built-in AI with 4 difficulty levels

### AI Difficulties
| Level | Name | Search Depth | Blunder Rate |
|-------|------|--------------|--------------|
| `easy` | Beginner | 0 (random) | 70% |
| `casual` | Casual | 1 | 35% |
| `club` | Club | 2 | 12% |
| `expert` | Expert | 3 | 3% |

The AI uses **negamax with alpha-beta pruning**, move ordering (captures, promotions, checks, center control), and a material + mobility evaluation function.

### Polish & UX
- ♟️ **Piece images** from Wikimedia Commons (SVG, high-DPI ready) with Unicode fallback
- 🎯 **Legal move indicators** — dots for moves, rings for captures
- 📜 **Move history** with algebraic notation (SAN)
- 🗂️ **Captured pieces** displayed by color
- 🏁 **Checkmate animation** — board pulse + banner
- ⚡ **Responsive layout** — stacks on mobile, three-column on desktop
- ♿ **Accessible** — ARIA labels, keyboard focus, reduced-motion support
- 📋 **FEN copy** button for position sharing/analysis
- ↩️ **Undo** (removes both plies in computer mode)

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (includes npm)

### Installation
```bash
# Clone the repository
git clone https://github.com/SamratKumar29/Chess.git
cd chess

# Install dependencies
npm install
```

### Development
```bash
# Start dev server (serves on http://localhost:5173)
npm run dev
```

### Production Build
```bash
# Build to ./dist
npm run build

# Preview production build locally
npm run preview
```

---

## 🎮 How to Play

1. **Select mode** — "Computer" or "Two Players" in the side panel
2. **If vs Computer** — choose difficulty and your color (White/Black)
3. **Click a piece** to select it — legal destinations highlight
4. **Click a highlighted square** to move
5. **Pawn promotion** — a dialog appears; choose Queen, Rook, Bishop, or Knight
6. **New Game / Undo** — buttons in the side panel
7. **Copy FEN** — shares the current position for analysis engines

---

## 📁 Project Structure

```
chess/
├── index.html          # Entry HTML (loads /src/main.js as module)
├── package.json        # Scripts, dependencies (chess.js, vite)
├── vite.config.js      # (optional) Vite config — currently using defaults
├── src/
│   ├── main.js         # Game logic, UI rendering, AI (≈520 lines)
│   └── styles.css      # Complete styling (≈560 lines)
├── dist/               # Production build output (gitignored)
└── node_modules/       # Dependencies (gitignored)
```

---

## 🧠 AI Implementation Details

The computer player lives in `src/main.js`:

| Function | Purpose |
|----------|---------|
| `chooseComputerMove()` | Entry point — picks random (blunder) or searches |
| `negamax()` | Recursive negamax with α/β pruning |
| `evaluate()` | Material + mobility + check bonus |
| `orderMoves()` | Sorts by capture value, promotion, check, center control |
| `moveHeuristic()` | Static move scoring for ordering |

**Evaluation weights** (centipawns):
- Pawn: 100, Knight: 320, Bishop: 330, Rook: 500, Queen: 900
- Mobility: ±2 per legal move
- Check: ±35

---

## 🎨 Customization

### Colors & Theme
Edit CSS custom properties in `src/styles.css`:
```css
:root {
  --bg: #e7e1d5;           /* Page background */
  --board-border: #22342b; /* Board border */
  --light-square: #eeeadf; /* Light squares */
  --dark-square: #769656;  /* Dark squares */
  --accent: #f6d55c;       /* Selection / last-move gold */
  --primary: #243f31;      /* Primary buttons / turn badge */
}
```

### Piece Sets
Replace URLs in the `PIECES` object (`src/main.js:4–17`) with your own SVG/PNG assets. Fallback Unicode glyphs are defined in `PIECE_TEXT`.

### AI Tuning
Adjust `DIFFICULTIES` object (`src/main.js:25–30`) or modify `PIECE_VALUES` and evaluation weights in `evaluate()`.

---

## ♿ Accessibility

- Semantic HTML (`<main>`, `<aside>`, `<section>`, `<dialog>`)
- `aria-label` on board and captured rails
- `aria-live="polite"` on checkmate banner
- Focus-visible outlines on all interactive elements
- `prefers-reduced-motion` disables animations
- Sufficient contrast ratios (WCAG AA)

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `chess.js` | ^1.4.0 | Game rules, move generation, FEN, SAN |
| `vite` | ^8.1.5 | Dev server, production bundler |

Zero runtime framework dependencies — pure ES modules.

---

## 🛠️ Development Notes

### Adding a Feature
1. Edit `src/main.js` for logic
2. Edit `src/styles.css` for styling
3. Run `npm run dev` to test

### Common Tasks
| Task | Command |
|------|---------|
| Lint/format | (add Prettier/ESLint if desired) |
| Type check | (add TypeScript + `jsconfig.json` if desired) |
| Deploy | `npm run build` → upload `dist/` to any static host |

---

## 📄 License

ISC License — see [LICENSE](LICENSE) (or add one). Free for personal and commercial use.

---

## 🙏 Acknowledgments

- **chess.js** by [Jeff Hlywa](https://github.com/jhlywa) — robust chess engine in JS
- **Piece images** from [Wikimedia Commons](https://commons.wikimedia.org/) (public domain / CC0)
- **Vite** — lightning-fast build tool

---

> Built for fun. PRs welcome — open an issue first for larger changes.