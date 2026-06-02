/**
 * AvoidanceGame (躲避游戏)
 * 玩家左右移动躲避从上方掉落的障碍物，坚持到时间结束即赢
 */
class AvoidanceGame extends BaseGameModule {
  init() {
    const { w, h } = this._getSize();
    this.W = w;
    this.H = h;
    this.duration = this.config.duration || 30;
    this.playerSpeed = (this.config.playerSpeed || 3) * 3;
    this.spawnInterval = 2000 / (this.config.spawnRate || 2);
    this.playerW = 50;
    this.playerH = 50;
    this.playerX = w / 2 - this.playerW / 2;
    this.obstacles = [];
    this.lastSpawn = 0;
    this.frameId = null;

    // Game area styles
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.background = 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)';

    // Timer bar
    this.timerBar = this._createElement('div', {
      position: 'absolute', top: '0', left: '0', width: '100%', height: '4px',
      background: '#e94560', zIndex: '10', transition: 'width 0.3s linear',
    }, this.container);

    // Player
    this.player = this._createElement('div', {
      position: 'absolute', bottom: '20px', width: this.playerW + 'px', height: this.playerH + 'px',
      borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '30px', zIndex: '5', left: this.playerX + 'px',
      boxShadow: '0 0 20px rgba(102,126,234,0.5)',
    }, this.container);
    this.player.textContent = '🏃';

    // Touch / keyboard controls
    this._addListener(document, 'keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this._move(-1);
      if (e.key === 'ArrowRight' || e.key === 'd') this._move(1);
    });

    this._addListener(this.container, 'touchmove', (e) => {
      e.preventDefault();
      const touchX = e.touches[0].clientX;
      const rect = this.container.getBoundingClientRect();
      const targetX = touchX - rect.left - this.playerW / 2;
      this.playerX = Math.max(0, Math.min(this.W - this.playerW, targetX));
      this.player.style.left = this.playerX + 'px';
    }, { passive: false });

    this._addListener(this.container, 'touchstart', (e) => {
      e.preventDefault();
      const touchX = e.touches[0].clientX;
      const rect = this.container.getBoundingClientRect();
      this.playerX = Math.max(0, Math.min(this.W - this.playerW, touchX - rect.left - this.playerW / 2));
      this.player.style.left = this.playerX + 'px';
    }, { passive: false });

    // Mouse control
    this._addListener(this.container, 'mousemove', (e) => {
      if (this.state !== 'playing') return;
      const rect = this.container.getBoundingClientRect();
      this.playerX = Math.max(0, Math.min(this.W - this.playerW, e.clientX - rect.left - this.playerW / 2));
      this.player.style.left = this.playerX + 'px';
    });
  }

  _move(dir) {
    this.playerX += dir * this.playerSpeed;
    this.playerX = Math.max(0, Math.min(this.W - this.playerW, this.playerX));
    this.player.style.left = this.playerX + 'px';
  }

  start() {
    super.start();
    this._gameLoop();
  }

  _gameLoop() {
    if (this.state !== 'playing') return;
    const now = Date.now();
    const elapsed = this._getElapsed();

    // Update timer bar
    const remaining = Math.max(0, this.duration - elapsed);
    this.timerBar.style.width = (remaining / this.duration * 100) + '%';
    if (remaining < 5) {
      this.timerBar.style.background = '#ff4444';
    }

    // Win condition
    if (remaining <= 0) {
      this.endGame('win', this.score);
      return;
    }

    // Spawn obstacles
    if (now - this.lastSpawn > this.spawnInterval) {
      this._spawnObstacle();
      this.lastSpawn = now;
    }

    // Move obstacles
    const speed = 2 + elapsed / 10; // Gradually speed up
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += speed;
      obs.el.style.top = obs.y + 'px';

      // Check collision
      if (this._checkCollision(this.player, obs.el)) {
        this.player.style.background = 'red';
        this._setTimeout(() => { this.player.style.background = 'linear-gradient(135deg, #667eea, #764ba2)'; }, 200);
        this.endGame('lose', this.score);
        return;
      }

      // Remove if off screen
      if (obs.y > this.H) {
        obs.el.remove();
        this.obstacles.splice(i, 1);
        this.score += 10;
      }
    }

    this.frameId = requestAnimationFrame(() => this._gameLoop());
  }

  _spawnObstacle() {
    const types = this.config.obstacleTypes || ['poop'];
    const type = types[Math.floor(Math.random() * types.length)];
    const emojiMap = { poop: '💩', water: '💧', smoke: '💨', rock: '🪨' };
    const emoji = emojiMap[type] || '💩';
    const size = 30 + Math.random() * 20;
    const x = Math.random() * (this.W - size);

    const el = this._createElement('div', {
      position: 'absolute', top: '-40px', left: x + 'px',
      width: size + 'px', height: size + 'px',
      fontSize: size + 'px', textAlign: 'center', zIndex: '4',
      animation: 'none',
    }, this.container);
    el.textContent = emoji;

    this.obstacles.push({ el, x, y: -40, size });
  }

  destroy() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.obstacles = [];
    super.destroy();
  }
}
