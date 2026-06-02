/**
 * Match3Game (三消游戏)
 * 交换相邻方块，三个以上连成一线消除。在时间内达成消除目标即赢
 */
class Match3Game extends BaseGameModule {
  init() {
    const { w } = this._getSize();
    this.boardSize = this.config.boardSize || 6;
    this.pieceTypes = this.config.pieceTypes || 4;
    this.duration = this.config.duration || 60;
    this.targetMatches = this.config.targetMatches || 20;
    this.cellSize = Math.floor((Math.min(w, 500) - 20) / this.boardSize);
    this.board = [];
    this.selected = null;
    this.matchesCleared = 0;
    this.isAnimating = false;
    this.frameId = null;

    const gems = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠'];

    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.background = 'linear-gradient(180deg, #1a1a2e, #16213e)';
    this.container.style.gap = '8px';

    // Info bar
    this.infoBar = this._createElement('div', {
      display: 'flex', justifyContent: 'space-between', width: (this.cellSize * this.boardSize) + 'px',
      padding: '8px 0', fontSize: '14px', fontWeight: '700', color: '#ccc',
    }, this.container);
    this.infoBar.innerHTML = '<span>消除: <span id="match-count">0</span>/' + this.targetMatches + '</span><span id="match-timer">' + this.duration + 's</span>';

    // Board
    this.boardEl = this._createElement('div', {
      display: 'grid',
      gridTemplateColumns: 'repeat(' + this.boardSize + ', ' + this.cellSize + 'px)',
      gridTemplateRows: 'repeat(' + this.boardSize + ', ' + this.cellSize + 'px)',
      gap: '2px', background: 'rgba(255,255,255,0.05)', padding: '4px',
      borderRadius: '12px', position: 'relative',
    }, this.container);

    // Init board data
    for (let r = 0; r < this.boardSize; r++) {
      this.board[r] = [];
      for (let c = 0; c < this.boardSize; c++) {
        let type;
        do {
          type = Math.floor(Math.random() * this.pieceTypes);
        } while (this._wouldMatch(r, c, type));
        this.board[r][c] = type;
      }
    }
    this._renderBoard();

    this._addListener(this.boardEl, 'click', (e) => this._handleBoardClick(e));
    this._addListener(this.boardEl, 'touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this._handleBoardClick({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
  }

  _wouldMatch(r, c, type) {
    if (c >= 2 && this.board[r][c - 1] === type && this.board[r][c - 2] === type) return true;
    if (r >= 2 && this.board[r - 1] && this.board[r - 1][c] === type && this.board[r - 2] && this.board[r - 2][c] === type) return true;
    return false;
  }

  _renderBoard() {
    this.boardEl.innerHTML = '';
    const gems = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠'];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const cell = document.createElement('div');
        Object.assign(cell.style, {
          width: this.cellSize + 'px', height: this.cellSize + 'px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: (this.cellSize * 0.55) + 'px', background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.1s',
          userSelect: 'none',
        });
        cell.textContent = gems[this.board[r][c]] || '💎';
        cell.dataset.row = r;
        cell.dataset.col = c;
        if (this.selected && this.selected.r === r && this.selected.c === c) {
          cell.style.transform = 'scale(1.15)';
          cell.style.boxShadow = '0 0 15px rgba(233,69,96,0.6)';
          cell.style.border = '2px solid #e94560';
        }
        this.boardEl.appendChild(cell);
      }
    }
  }

  _handleBoardClick(e) {
    if (this.state !== 'playing' || this.isAnimating) return;
    const cellEl = e.target.closest('[data-row]');
    if (!cellEl) return;
    const r = parseInt(cellEl.dataset.row);
    const c = parseInt(cellEl.dataset.col);

    if (!this.selected) {
      this.selected = { r, c };
      this._renderBoard();
    } else {
      const sr = this.selected.r;
      const sc = this.selected.c;
      const dr = Math.abs(r - sr);
      const dc = Math.abs(c - sc);

      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        this.isAnimating = true;
        // Swap
        const tmp = this.board[sr][sc];
        this.board[sr][sc] = this.board[r][c];
        this.board[r][c] = tmp;
        this._renderBoard();
        this.selected = null;

        this._setTimeout(() => {
          const matches = this._findMatches();
          if (matches.length > 0) {
            this._processMatches(matches);
          } else {
            // Swap back
            const tmp2 = this.board[sr][sc];
            this.board[sr][sc] = this.board[r][c];
            this.board[r][c] = tmp2;
            this._renderBoard();
            this.isAnimating = false;
            // Flash effect
            cellEl.style.background = 'rgba(255,0,0,0.3)';
            this._setTimeout(() => { cellEl.style.background = ''; }, 200);
          }
        }, 150);
      } else {
        this.selected = { r, c };
        this._renderBoard();
      }
    }
  }

  _findMatches() {
    const matches = new Set();
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize - 2; c++) {
        if (this.board[r][c] === this.board[r][c + 1] && this.board[r][c] === this.board[r][c + 2]) {
          matches.add(r + ',' + c);
          matches.add(r + ',' + (c + 1));
          matches.add(r + ',' + (c + 2));
        }
      }
    }
    for (let c = 0; c < this.boardSize; c++) {
      for (let r = 0; r < this.boardSize - 2; r++) {
        if (this.board[r] && this.board[r + 1] && this.board[r + 2] &&
            this.board[r][c] === this.board[r + 1][c] && this.board[r][c] === this.board[r + 2][c]) {
          matches.add(r + ',' + c);
          matches.add((r + 1) + ',' + c);
          matches.add((r + 2) + ',' + c);
        }
      }
    }
    return [...matches].map((s) => { const [r, c] = s.split(','); return { r: parseInt(r), c: parseInt(c) }; });
  }

  _processMatches(matches) {
    this.matchesCleared += Math.floor(matches.length / 3);
    this.score = this.matchesCleared * 100;
    document.getElementById('match-count').textContent = this.matchesCleared;

    // Remove matched
    matches.forEach(({ r, c }) => { this.board[r][c] = -1; });

    // Gravity: drop pieces down
    for (let c = 0; c < this.boardSize; c++) {
      let writeRow = this.boardSize - 1;
      for (let r = this.boardSize - 1; r >= 0; r--) {
        if (this.board[r][c] !== -1) {
          this.board[writeRow][c] = this.board[r][c];
          writeRow--;
        }
      }
      for (let r = writeRow; r >= 0; r--) {
        this.board[r][c] = Math.floor(Math.random() * this.pieceTypes);
      }
    }

    this._renderBoard();

    // Check for chain matches
    this._setTimeout(() => {
      const chain = this._findMatches();
      if (chain.length > 0) {
        this._processMatches(chain);
      } else {
        this.isAnimating = false;
        if (this.matchesCleared >= this.targetMatches) {
          this.endGame('win', this.score);
        }
      }
    }, 300);
  }

  start() {
    super.start();
    this._gameLoop();
  }

  _gameLoop() {
    if (this.state !== 'playing') return;
    const remaining = Math.max(0, this.duration - this._getElapsed());
    document.getElementById('match-timer').textContent = Math.ceil(remaining) + 's';

    if (remaining <= 0) {
      this.endGame(this.matchesCleared >= this.targetMatches ? 'win' : 'lose', this.score);
      return;
    }
    this.frameId = requestAnimationFrame(() => this._gameLoop());
  }

  destroy() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    super.destroy();
  }
}
