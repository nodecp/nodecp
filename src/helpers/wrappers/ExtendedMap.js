module.exports = class extends Map {
  constructor() { super() }

  ensure(key, value) {
    return this.get(key) || this.set(key, value);
  }

  setProp(key, filter, value) {
    let data = super.get(key);

    if (!data) data = {};

    data[filter] = value;

    return this.set(key, data);
  }

  set(key, value) {
    super.set(key, value);

    return super.get(key);
  }

  keyArray() {
    return Array.from(this.keys());
  }

  valueArray() {
    return Array.from(this.values());
  }

  find(fn) {
    for (var [key, val] of this) {
      if (fn(val))
        return val;
    }

    return null;
  }

  filter(fn) {
    let results = [];
    
    for (var [key, val] of this) {
      if (fn(val))
        results.push(val);
    }

    return results;
  }

  map(fn) {
    let results = [];

    for (var [key, val] of this) {
      results.push(fn(val))
    }

    return results;
  }
}