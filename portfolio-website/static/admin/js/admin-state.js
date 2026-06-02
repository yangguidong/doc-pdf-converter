/** Admin state store */

class AdminStore {
  constructor() {
    this._state = { user: null };
    this._subscribers = {};
  }

  get(key) { return this._state[key]; }
  set(key, value) { this._state[key] = value; }
  subscribe(key, fn) {
    if (!this._subscribers[key]) this._subscribers[key] = [];
    this._subscribers[key].push(fn);
  }
}

export const adminStore = new AdminStore();
