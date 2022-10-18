class StorageManager {
  constructor(options = {}) {
    const defaults = {
      defaultKey: 'defaultStore',
    };
    this.options = _.extend({}, defaults, options);
    this.init();
  }

  init() {
    this.isAvailable = this.constructor.storageAvailable;
  }

  getData(key = false) {
    if (!this.isAvailable) return '';
    const dataKey = key !== false ? key : this.options.defaultKey;
    const data = localStorage.getItem(dataKey);
    if (!data) return '';
    return data;
  }

  setData(value, key = false) {
    if (!this.isAvailable) return;
    const dataKey = key !== false ? key : this.options.defaultKey;
    localStorage.setItem(dataKey, value);
  }

  static storageAvailable() {
    let storage;
    try {
      storage = window.localStorage;
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  }
}
