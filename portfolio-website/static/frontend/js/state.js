/** Simple pub/sub state store */

class Store {
  constructor() {
    this._state = {};
    this._subscribers = new Map();
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    this._state[key] = value;
    this._notify(key);
  }

  setMany(obj) {
    Object.assign(this._state, obj);
    Object.keys(obj).forEach((k) => this._notify(k));
  }

  subscribe(key, callback) {
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }
    this._subscribers.get(key).add(callback);
    return () => this._subscribers.get(key)?.delete(callback);
  }

  _notify(key) {
    const subs = this._subscribers.get(key);
    if (subs) {
      subs.forEach((fn) => {
        try { fn(this._state[key]); } catch (e) { console.error(e); }
      });
    }
  }
}

export const store = new Store();
