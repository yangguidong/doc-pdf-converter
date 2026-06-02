/**
 * BaseGameModule - 所有游戏模组的基类
 * 每个游戏模组继承此类，实现 init/start/pause/resume/destroy 生命周期方法
 */
class BaseGameModule {
  /**
   * @param {HTMLElement} container - 游戏渲染容器
   * @param {Object} config - 游戏参数配置
   * @param {Object} skin - 皮肤配置
   * @param {Function} onEnd - 游戏结束回调 onEnd({ result, score, duration })
   */
  constructor(container, config, skin, onEnd) {
    this.container = container;
    this.config = config || {};
    this.skin = skin || {};
    this.onEnd = onEnd || function () {};
    this.state = 'idle'; // idle | playing | paused | ended
    this.score = 0;
    this._startTime = 0;
    this._timers = [];
    this._listeners = [];
    this._elements = [];
  }

  /** 初始化DOM和事件监听 */
  init() { throw new Error('子类必须实现 init()'); }

  /** 开始游戏循环 */
  start() { this.state = 'playing'; this._startTime = Date.now(); }

  /** 暂停游戏 */
  pause() { this.state = 'paused'; }

  /** 恢复游戏 */
  resume() { this.state = 'playing'; }

  /** 销毁所有DOM、定时器和事件监听 */
  destroy() {
    this._timers.forEach(clearInterval);
    this._timers = [];
    this._listeners.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
    this._listeners = [];
    this._elements.forEach((el) => el.remove());
    this._elements = [];
  }

  /** 获取游戏状态 */
  getState() {
    return { state: this.state, score: this.score, elapsed: this._getElapsed() };
  }

  /** 结束游戏，触发回调 */
  endGame(result, score) {
    if (this.state === 'ended') return;
    this.state = 'ended';
    this.score = score || this.score;
    const duration = this._getElapsed();
    this.destroy();
    this.onEnd({ result, score: this.score, duration: Math.round(duration) });
  }

  /** 获取已经过的时间（秒） */
  _getElapsed() {
    return (Date.now() - this._startTime) / 1000;
  }

  /** 便捷：添加定时器（自动追踪以在destroy时清理） */
  _setInterval(fn, ms) {
    const id = setInterval(fn, ms);
    this._timers.push(id);
    return id;
  }

  /** 便捷：添加setTimeout */
  _setTimeout(fn, ms) {
    const id = setTimeout(fn, ms);
    this._timers.push(id);
    return id;
  }

  /** 便捷：添加事件监听（自动追踪以在destroy时清理） */
  _addListener(el, type, fn, opts) {
    el.addEventListener(type, fn, opts);
    this._listeners.push({ el, type, fn });
  }

  /** 便捷：创建元素并追踪 */
  _createElement(tag, styles, parent) {
    const el = document.createElement(tag);
    if (styles) Object.assign(el.style, styles);
    if (parent) parent.appendChild(el);
    this._elements.push(el);
    return el;
  }

  /** 获取容器尺寸 */
  _getSize() {
    return {
      w: this.container.clientWidth || 375,
      h: this.container.clientHeight || 500,
    };
  }

  /** 碰撞检测（AABB） */
  _checkCollision(a, b) {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    return !(ra.right < rb.left || ra.left > rb.right || ra.bottom < rb.top || ra.top > rb.bottom);
  }
}
