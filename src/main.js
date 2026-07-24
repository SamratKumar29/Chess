import { Chess } from 'chess.js';
import './styles.css';

const PIECES = {
  wk: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20white%20king.svg',
  wq: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20white%20queen.svg',
  wr: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20white%20rook.svg',
  wb: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20white%20bishop.svg',
  wn: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20white%20knight.svg',
  wp: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20white%20pawn.svg',
  bk: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20black%20king.svg',
  bq: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20black%20queen.svg',
  br: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20black%20rook.svg',
  bb: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20black%20bishop.svg',
  bn: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20black%20knight.svg',
  bp: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chess%20black%20pawn.svg',
};

const PIECE_TEXT = {
  wk: 'K', wq: 'Q', wr: 'R', wb: 'B', wn: 'N', wp: '',
  bk: 'K', bq: 'Q', br: 'R', bb: 'B', bn: 'N', bp: '',
};

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const DIFFICULTIES = {
  easy: { name: 'Beginner', depth: 0, blunder: 0.7 },
  casual: { name: 'Casual', depth: 1, blunder: 0.35 },
  club: { name: 'Club', depth: 2, blunder: 0.12 },
  expert: { name: 'Expert', depth: 3, blunder: 0.03 },
};

const state = {
  game: new Chess(),
  mode: 'computer',
  difficulty: 'casual',
  humanColor: 'w',
  selected: null,
  legalTargets: [],
  lastMove: null,
  pendingPromotion: null,
  aiThinking: false,
  checkmateAnimationKey: null,
};

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <aside class="captured-rail" aria-label="Captured pieces">
      <div class="captured-card">
        <span>White captured</span>
        <div id="whiteCaptured" class="captured-icons">-</div>
      </div>
      <div class="captured-card">
        <span>Black captured</span>
        <div id="blackCaptured" class="captured-icons">-</div>
      </div>
    </aside>

    <section class="board-column">
      <div class="topline">
        <div>
          <p class="eyebrow">Board Room</p>
          <h1>Chess</h1>
        </div>
        <div id="turnBadge" class="turn-badge">White to move</div>
      </div>
      <div class="board-wrap">
        <div id="board" class="board" aria-label="Chess board"></div>
        <div id="mateBanner" class="mate-banner" aria-live="polite"></div>
      </div>
    </section>

    <aside class="side-panel">
      <div class="panel-section">
        <label class="label" for="mode">Mode</label>
        <div class="segmented" id="mode">
          <button class="active" data-mode="computer">Computer</button>
          <button data-mode="human">Two Players</button>
        </div>
      </div>

      <div class="panel-section" id="computerControls">
        <label class="label" for="difficulty">Computer level</label>
        <select id="difficulty">
          <option value="easy">Beginner</option>
          <option value="casual" selected>Casual</option>
          <option value="club">Club</option>
          <option value="expert">Expert</option>
        </select>
        <label class="label space" for="side">Your side</label>
        <select id="side">
          <option value="w" selected>White</option>
          <option value="b">Black</option>
        </select>
      </div>

      <div class="panel-section status-card">
        <span class="label">Game status</span>
        <p id="status">Ready.</p>
      </div>

      <div class="actions">
        <button id="newGame" class="primary">New game</button>
        <button id="undo">Undo</button>
      </div>

      <div class="move-list">
        <div class="move-list-head">
          <span>Moves</span>
          <button id="copyFen" title="Copy FEN">FEN</button>
        </div>
        <ol id="moves"></ol>
      </div>
    </aside>
  </main>

  <dialog id="promotionDialog" class="promotion-dialog">
    <form method="dialog">
      <p>Promote pawn</p>
      <div class="promotion-options">
        <button value="q">Queen</button>
        <button value="r">Rook</button>
        <button value="b">Bishop</button>
        <button value="n">Knight</button>
      </div>
    </form>
  </dialog>
`;

const boardEl = document.querySelector('#board');
const statusEl = document.querySelector('#status');
const movesEl = document.querySelector('#moves');
const turnBadge = document.querySelector('#turnBadge');
const promotionDialog = document.querySelector('#promotionDialog');
const mateBanner = document.querySelector('#mateBanner');

document.querySelectorAll('[data-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    state.mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b === button));
    document.querySelector('#computerControls').hidden = state.mode !== 'computer';
    resetGame();
  });
});

document.querySelector('#difficulty').addEventListener('change', (event) => {
  state.difficulty = event.target.value;
  resetGame();
});

document.querySelector('#side').addEventListener('change', (event) => {
  state.humanColor = event.target.value;
  resetGame();
});

document.querySelector('#newGame').addEventListener('click', resetGame);
document.querySelector('#undo').addEventListener('click', undoMove);
document.querySelector('#copyFen').addEventListener('click', async () => {
  await navigator.clipboard?.writeText(state.game.fen());
  flashStatus('FEN copied to clipboard.');
});

promotionDialog.addEventListener('close', () => {
  if (!state.pendingPromotion) return;
  const promotion = promotionDialog.returnValue || 'q';
  const pending = state.pendingPromotion;
  state.pendingPromotion = null;
  makeMove({ ...pending, promotion });
});

function resetGame() {
  state.game = new Chess();
  state.selected = null;
  state.legalTargets = [];
  state.lastMove = null;
  state.pendingPromotion = null;
  state.aiThinking = false;
  state.checkmateAnimationKey = null;
  render();
  if (state.mode === 'computer' && state.humanColor === 'b') queueComputerMove();
}

function undoMove() {
  if (state.aiThinking) return;
  const undoneMove = state.game.undo();
  if (!undoneMove) return;
  if (state.mode === 'computer') state.game.undo();
  state.selected = null;
  state.pendingPromotion = null;
  state.lastMove = null;
  state.checkmateAnimationKey = null;
  syncHistory();
  render();
  if (state.mode === 'computer' && state.game.turn() !== state.humanColor && !state.game.isGameOver()) {
    queueComputerMove();
  }
}

function render() {
  renderBoard();
  renderStatus();
  renderMoves();
  renderCaptured();
  renderCheckmateAnimation();
}

function renderBoard() {
  boardEl.innerHTML = '';
  const squares = orientedSquares();
  const legalSet = new Set(state.legalTargets);
  const turn = state.game.turn();
  boardEl.style.setProperty('--board-size', Math.min(window.innerWidth - 28, 680));

  squares.forEach((square) => {
    const piece = state.game.get(square);
    const button = document.createElement('button');
    const fileIndex = square.charCodeAt(0) - 97;
    const rankIndex = Number(square[1]) - 1;
    button.className = `square ${(fileIndex + rankIndex) % 2 ? 'light' : 'dark'}`;
    button.dataset.square = square;
    button.setAttribute('aria-label', labelForSquare(square, piece));
    button.disabled = state.aiThinking || state.game.isGameOver();

    if (state.selected === square) button.classList.add('selected');
    if (legalSet.has(square)) button.classList.add(piece ? 'capture-target' : 'move-target');
    if (state.lastMove && (state.lastMove.from === square || state.lastMove.to === square)) button.classList.add('last-move');
    if (piece && piece.type === 'k' && piece.color === turn && state.game.isCheck()) button.classList.add('in-check');
    if (piece && piece.type === 'k' && piece.color === turn && state.game.isCheckmate()) button.classList.add('checkmated');

    const coord = document.createElement('span');
    coord.className = 'coord';
    coord.textContent = square;
    button.append(coord);

    if (piece) {
      const img = document.createElement('img');
      const key = `${piece.color}${piece.type}`;
      img.src = PIECES[key];
      img.alt = `${piece.color === 'w' ? 'White' : 'Black'} ${pieceName(piece.type)}`;
      img.draggable = false;
      img.onerror = () => {
        img.remove();
        button.dataset.fallback = PIECE_TEXT[key];
      };
      button.append(img);
    }

    button.addEventListener('click', () => onSquareClick(square));
    boardEl.append(button);
  });
}

function orientedSquares() {
  const whiteBottom = state.mode === 'human' || state.humanColor === 'w';
  const ranks = whiteBottom ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = whiteBottom ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}`));
}

function onSquareClick(square) {
  if (state.aiThinking || state.game.isGameOver()) return;
  if (state.mode === 'computer' && state.game.turn() !== state.humanColor) return;

  const piece = state.game.get(square);
  if (state.selected && state.legalTargets.includes(square)) {
    const move = { from: state.selected, to: square };
    if (needsPromotion(move)) {
      state.pendingPromotion = move;
      promotionDialog.showModal();
      return;
    }
    makeMove(move);
    return;
  }

  if (piece?.color === state.game.turn()) {
    state.selected = square;
    state.legalTargets = state.game.moves({ square, verbose: true }).map((move) => move.to);
  } else {
    state.selected = null;
    state.legalTargets = [];
  }
  render();
}

function needsPromotion({ from, to }) {
  const piece = state.game.get(from);
  return piece?.type === 'p' && (to.endsWith('8') || to.endsWith('1'));
}

function makeMove(move) {
  try {
    const result = state.game.move(move);
    if (!result) return;
    state.lastMove = result;
    state.selected = null;
    state.legalTargets = [];
    syncHistory();
    render();
    if (state.mode === 'computer' && !state.game.isGameOver()) queueComputerMove();
  } catch {
    flashStatus('That move is not legal.');
  }
}

function queueComputerMove() {
  if (state.game.turn() === state.humanColor || state.game.isGameOver()) return;
  state.aiThinking = true;
  render();
  window.setTimeout(() => {
    const move = chooseComputerMove(state.game, state.difficulty);
    if (move) {
      state.game.move(move);
      state.lastMove = move;
      syncHistory();
    }
    state.aiThinking = false;
    render();
  }, 350);
}

function chooseComputerMove(game, difficultyKey) {
  const settings = DIFFICULTIES[difficultyKey];
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;
  if (settings.depth === 0 || Math.random() < settings.blunder) return weightedRandomMove(moves);

  const maximizingColor = game.turn();
  let bestScore = -Infinity;
  let bestMoves = [];
  for (const move of moves) {
    game.move(move);
    const score = -negamax(game, settings.depth - 1, -Infinity, Infinity, opposite(maximizingColor));
    game.undo();
    const noisyScore = score + (Math.random() * 12 - 6);
    if (noisyScore > bestScore) {
      bestScore = noisyScore;
      bestMoves = [move];
    } else if (Math.abs(noisyScore - bestScore) < 0.001) {
      bestMoves.push(move);
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function negamax(game, depth, alpha, beta, colorToScore) {
  if (game.isCheckmate()) return -100000 - depth;
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) return 0;
  if (depth === 0) return evaluate(game, colorToScore);

  let best = -Infinity;
  const moves = orderMoves(game.moves({ verbose: true }));
  for (const move of moves) {
    game.move(move);
    const score = -negamax(game, depth - 1, -beta, -alpha, opposite(colorToScore));
    game.undo();
    best = Math.max(best, score);
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  return best;
}

function evaluate(game, color) {
  let score = 0;
  for (const row of game.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const sign = piece.color === color ? 1 : -1;
      score += sign * PIECE_VALUES[piece.type];
    }
  }

  const mobility = game.moves().length;
  score += game.turn() === color ? mobility * 2 : -mobility * 2;
  if (game.isCheck()) score += game.turn() === color ? -35 : 35;
  return score;
}

function weightedRandomMove(moves) {
  const ordered = orderMoves(moves);
  const top = ordered.slice(0, Math.max(3, Math.ceil(ordered.length / 2)));
  return top[Math.floor(Math.random() * top.length)];
}

function orderMoves(moves) {
  return [...moves].sort((a, b) => moveHeuristic(b) - moveHeuristic(a));
}

function moveHeuristic(move) {
  let score = 0;
  if (move.captured) score += PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece] / 10;
  if (move.promotion) score += PIECE_VALUES[move.promotion];
  if (move.san.includes('+')) score += 50;
  if (move.san.includes('#')) score += 100000;
  if (['e4', 'd4', 'e5', 'd5'].includes(move.to)) score += 15;
  return score;
}

function renderStatus() {
  const turnName = state.game.turn() === 'w' ? 'White' : 'Black';
  turnBadge.textContent = state.aiThinking ? 'Computer thinking' : `${turnName} to move`;

  if (state.game.isCheckmate()) {
    statusEl.textContent = `Checkmate. ${turnName === 'White' ? 'Black' : 'White'} wins.`;
  } else if (state.game.isStalemate()) {
    statusEl.textContent = 'Draw by stalemate.';
  } else if (state.game.isInsufficientMaterial()) {
    statusEl.textContent = 'Draw by insufficient mating material.';
  } else if (state.game.isThreefoldRepetition()) {
    statusEl.textContent = 'Draw can be claimed by threefold repetition.';
  } else if (state.game.isDraw()) {
    statusEl.textContent = 'Draw by the 50-move rule or dead position.';
  } else if (state.game.isCheck()) {
    statusEl.textContent = `${turnName} is in check.`;
  } else if (state.aiThinking) {
    statusEl.textContent = `${DIFFICULTIES[state.difficulty].name} computer is choosing a legal move.`;
  } else if (state.mode === 'human') {
    statusEl.textContent = `${turnName} to move. Board remains white-side down.`;
  } else {
    statusEl.textContent = state.game.turn() === state.humanColor ? 'Your move.' : 'Computer to move.';
  }
}

function renderCheckmateAnimation() {
  const isMate = state.game.isCheckmate();
  boardEl.classList.toggle('checkmate-board', isMate);
  mateBanner.classList.toggle('show', isMate);

  if (!isMate) {
    mateBanner.textContent = '';
    return;
  }

  const winningColor = state.game.turn() === 'w' ? 'Black' : 'White';
  mateBanner.textContent = `Checkmate - ${winningColor} wins`;
  const animationKey = state.game.fen();
  if (state.checkmateAnimationKey !== animationKey) {
    state.checkmateAnimationKey = animationKey;
    boardEl.classList.remove('checkmate-burst');
    requestAnimationFrame(() => boardEl.classList.add('checkmate-burst'));
  }
}

function renderMoves() {
  movesEl.innerHTML = '';
  const history = state.game.history();
  for (let i = 0; i < history.length; i += 2) {
    const item = document.createElement('li');
    item.innerHTML = `<span>${history[i] || ''}</span><span>${history[i + 1] || ''}</span>`;
    movesEl.append(item);
  }
}

function renderCaptured() {
  const captured = capturedPieces();
  renderCapturedSet(document.querySelector('#whiteCaptured'), captured.w);
  renderCapturedSet(document.querySelector('#blackCaptured'), captured.b);
}

function capturedPieces() {
  const captured = { w: [], b: [] };
  for (const move of state.game.history({ verbose: true })) {
    if (move.captured) captured[move.color].push(`${opposite(move.color)}${move.captured}`);
  }
  return captured;
}

function renderCapturedSet(container, pieces) {
  container.innerHTML = '';
  if (!pieces.length) {
    container.textContent = '-';
    return;
  }

  for (const key of pieces) {
    const img = document.createElement('img');
    const color = key[0] === 'w' ? 'White' : 'Black';
    const type = pieceName(key[1]);
    img.src = PIECES[key];
    img.alt = `${color} ${type}`;
    img.title = `${color} ${type}`;
    img.draggable = false;
    img.onerror = () => {
      img.remove();
      const fallback = document.createElement('span');
      fallback.className = 'captured-fallback';
      fallback.textContent = PIECE_TEXT[key] || key[1].toUpperCase();
      container.append(fallback);
    };
    container.append(img);
  }
}

function syncHistory() {
  renderMoves();
  renderCaptured();
}

function flashStatus(message) {
  const previous = statusEl.textContent;
  statusEl.textContent = message;
  window.setTimeout(() => {
    if (statusEl.textContent === message) statusEl.textContent = previous;
  }, 1400);
}

function pieceName(type) {
  return ({ k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' })[type];
}

function labelForSquare(square, piece) {
  if (!piece) return `${square}, empty`;
  return `${square}, ${piece.color === 'w' ? 'white' : 'black'} ${pieceName(piece.type)}`;
}

function opposite(color) {
  return color === 'w' ? 'b' : 'w';
}

window.addEventListener('resize', renderBoard);
resetGame();
