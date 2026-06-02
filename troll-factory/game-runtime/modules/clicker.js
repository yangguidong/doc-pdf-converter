/**
 * ClickerGame (点击爆发游戏)
 * 点击屏幕中出现的靶子，在时间内达到目标分数即赢
 */
class ClickerGame extends BaseGameModule {
  init() {
    const { w, h } = this._getSize();
    this.W = w;
    this.H = h;
    this.duration = this.config.duration || 30;
    this.targetScore = this.config.targetScore || 100;
    this.maxZones = this.config.clickZones || 1;
    this.speedRamp = this.config.speedRamp || false;
    this.activeTargets = [];
    this.pointsPerClick = 10;
    this.targetLifetime = 1500;
    this.frameId = null;

    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.background = 'linear-gradient(180deg, #0f0c29, #302b63, #24243e)';
    this.container.style.cursor = 'crosshair';

    // Timer bar
    this.timerBar = this._createElement('div', {
      position: 'absolute', top: '0', left: '0', width: '100%', height: '4px',
      background: '#e94560', zIndex: '10', transition: 'width 0.3s linear',
    }, this.container);

    // Score display
    this.scoreDisplay = this._createElement('div', {
      position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
      fontSize: '24px', fontWeight: '900', zIndex: '10',
      color: '#fff', textShadow: '0 0 10px rgba(233,69,96,0.5)',
    }, this.container);
    this.scoreDisplay.textContent = '0 / ' + this.targetScore;

    // Progress bar background
    this.progressBg = this._createElement('div', {
      position: 'absolute', top: '45px', left: '20px', right: '20px',
      height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', zIndex: '10',
    }, this.container);
    this.progressFill = this._createElement('div', {
      position: 'absolute', top: '0', left: '0', height: '100%',
      width: '0%', background: 'linear-gradient(90deg, #11998e, #38ef7d)',
      borderRadius: '4px', transition: 'width 0.2s',
    }, this.progressBg);

    this._addListener(this.container, 'click', (e) => this._handleClick(e));
    this._addListener(this.container, 'touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this._handleClick({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });
  }

  _handleClick(e) {
    if (this.state !== 'playing') return;
    const rect = this.container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    let hit = false;

    for (let i = this.activeTargets.length - 1; i >= 0; i--) {
      const t = this.activeTargets[i];
      const dx = cx - t.x;
      const dy = cy - t.y;
      if (Math.sqrt(dx * dx + dy * dy) < t.size / 2) {
        hit = true;
        this.score = Math.min(this.targetScore, this.score + this.pointsPerClick);

        // Hit effect
        this._showHitEffect(t.x, t.y);
        t.el.remove();
        this.activeTargets.splice(i, 1);

        this.scoreDisplay.textContent = this.score + ' / ' + this.targetScore;
        this.progressFill.style.width = (this.score / this.targetScore * 100) + '%';

        if (this.score >= this.targetScore) {
          this.endGame('win', this.score);
          return;
        }
        break;
      }
    }

    // Miss click penalty
    if (!hit) {
      this.score = Math.max(0, this.score - 5);
      this.scoreDisplay.textContent = this.score + ' / ' + this.targetScore;
      this.progressFill.style.width = (this.score / this.targetScore * 100) + '%';
    }
  }

  _showHitEffect(x, y) {
    const el = this._createElement('div', {
      position: 'absolute', left: x + 'px', top: y + 'px',
      fontSize: '24px', fontWeight: '900', color: '#38ef7d', zIndex: '20',
      pointerEvents: 'none', transition: 'all 0.5s ease-out',
    }, this.container);
    el.textContent = '+10';
    requestAnimationFrame(() => {
      el.style.transform = 'translateY(-40px)';
      el.style.opacity = '0';
    });
    this._setTimeout(() => el.remove(), 500);
  }

  start() {
    super.start();
    this._spawnLoop();
    this._gameLoop();
  }

  _gameLoop() {
    if (this.state !== 'playing') return;
    const elapsed = this._getElapsed();
    const remaining = Math.max(0, this.duration - elapsed);

    this.timerBar.style.width = (remaining / this.duration * 100) + '%';
    if (remaining < 5) this.timerBar.style.background = '#ff4444';

    if (remaining <= 0) {
      this.endGame('lose', this.score);
      return;
    }

    this.frameId = requestAnimationFrame(() => this._gameLoop());
  }

  _spawnTarget() {
    if (this.state !== 'playing') return;
    if (this.activeTargets.length >= this.maxZones) return;

    const size = 50 + Math.random() * 30;
    const margin = size / 2 + 10;
    const x = margin + Math.random() * (this.W - margin * 2);
    const y = margin + Math.random() * (this.H - margin * 2 - 60);

    const el = this._createElement('div', {
      position: 'absolute', left: (x - size / 2) + 'px', top: (y - size / 2) + 'px',
      width: size + 'px', height: size + 'px', borderRadius: '50%',
      background: 'radial-gradient(circle, #e94560, #c23152)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: (size * 0.6) + 'px', zIndex: '5',
      boxShadow: '0 0 30px rgba(233,69,96,0.4)',
      cursor: 'pointer', transition: 'transform 0.1s',
      animation: 'pulse 0.8s ease-in-out infinite',
    }, this.container);
    el.textContent = '🎯';

    const target = { el, x, y, size, createdAt: Date.now() };
    this.activeTargets.push(target);

    // Auto-remove after lifetime
    this._setTimeout(() => {
      const idx = this.activeTargets.indexOf(target);
      if (idx >= 0) {
        target.el.remove();
        this.activeTargets.splice(idx, 1);
      }
    }, this.targetLifetime);
  }

  _spawnLoop() {
    if (this.state !== 'playing') return;
    const elapsed = this._getElapsed();
    let interval = this.speedRamp ? Math.max(400, 1500 - elapsed * 40) : 1200;
    this._spawnTarget();
    this._setTimeout(() => this._spawnLoop(), interval);
  }

  destroy() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.activeTargets = [];
    super.destroy();
  }
}
