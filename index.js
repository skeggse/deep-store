'use strict';

const toString = Object.prototype.toString;
const slice = Array.prototype.slice;

class DeepNode {
  constructor() {
    this.valueMap = new Map();
    this.children = new Map();
  }

  *suffixEntries(prefix, suffix) {
    let key = null;
    if (this.valueMap.has(suffix)) {
      key = [...prefix, suffix];
      yield [key, this.valueMap.get(suffix)];
    }
    if (this.children.has(suffix)) {
      key || (key = [...prefix, suffix]);
      yield* this.children.get(suffix).entries(key);
    }
  }

  *entries(prefix) {
    for (const [suffix, value] of this.valueMap) {
      yield [[...prefix, suffix], value];
    }
    for (const [suffix, child] of this.children) {
      yield* child.entries([...prefix, suffix]);
    }
  }

  *keys(prefix) {
    for (const [suffix, value] of this.valueMap) {
      yield [...prefix, suffix];
    }
    for (const [suffix, child] of this.children) {
      yield* child.keys([...prefix, suffix]);
    }
  }

  *values() {
    yield* this.valueMap.values();
    for (const [suffix, child] of this.children) {
      yield* child.values();
    }
  }

  *keyIntersect(other, prefix) {
    let ownSuffixes = new Set([...this.valueMap.keys(), ...this.children.keys()]);

    // Compute the suffix keys that are common between the two nodes.
    const commonSuffixes = new Set();
    for (const otherKeys of [other.valueMap.keys(), other.children.keys()]) {
      for (const suffix of otherKeys) {
        if (ownSuffixes.has(suffix)) {
          commonSuffixes.add(suffix);
        }
      }
    }

    // So we can GC, in case we're doing a massive intersection.
    ownSuffixes = null;

    for (const suffix of commonSuffixes) {
      // If we have a value for the suffix, then defer to the other node's tree
      // as it may have more specific children.
      if (this.valueMap.has(suffix)) {
        yield* other.suffixEntries(prefix, suffix);
      } else if (other.valueMap.has(suffix)) {
        yield* this.suffixEntries(prefix, suffix);
      } else {
        // We have children for this suffix in both DeepStores, so we need to
        // recurse and intersect more keys.
        yield* this.children.get(suffix)
          .keyIntersect(other.children.get(suffix), [...prefix, suffix]);
      }
    }
  }
}

class DeepStore {
  constructor(iterable) {
    this._root = new DeepNode();
    this._size = 0;

    if (iterable !== null && iterable !== undefined) {
      if (!iterable || typeof iterable !== 'object' || !iterable[Symbol.iterator]) {
        throw new TypeError('expected iterable object');
      }
      for (const entry of iterable) {
        if (!entry || typeof entry !== 'object') {
          throw new TypeError('iterator value is not an entry object');
        }
        this.set(entry[0], entry[1]);
      }
    }
  }

  get size() {
    return this._size;
  }

  get(keys) {
    if (!Array.isArray(keys) || !keys.length) {
      throw new TypeError('expected a non-empty array of keys');
    }
    const last = keys.length - 1;
    let node = this._root;
    for (let i = 0; i < last; ++i) {
      node = node.children.get(keys[i]);
      if (!node) return;
    }
    return node.valueMap.get(keys[last]);
  }

  has(keys) {
    if (!Array.isArray(keys) || !keys.length) {
      throw new TypeError('expected a non-empty array of keys');
    }
    const last = keys.length - 1;
    let node = this._root;
    for (let i = 0; i < last; ++i) {
      node = node.children.get(keys[i]);
      if (!node) return false;
    }
    return node.valueMap.has(keys[last]);
  }

  set(keys, value) {
    if (!Array.isArray(keys) || !keys.length) {
      throw new TypeError('expected a non-empty array of keys');
    }
    const last = keys.length - 1;
    let node = this._root;
    for (let i = 0; i < last; ++i) {
      const key = keys[i];
      let next = node.children.get(key);
      if (!next) {
        next = new DeepNode();
        node.children.set(key, next);
      }
      node = next;
    }
    const lastKey = keys[last];
    this._size += !node.valueMap.has(lastKey);
    node.valueMap.set(lastKey, value);
    return this;
  }

  delete(keys) {
    if (!Array.isArray(keys) || !keys.length) {
      throw new TypeError('expected a non-empty array of keys');
    }
    const nodes = new Array(keys.length - 1);
    const last = keys.length - 1;
    let node = this._root;
    for (let i = 0; i < last; ++i) {
      const key = keys[i];
      nodes[i] = node;
      node = node.children.get(key);
      if (!node) return false;
    }
    const lastKey = keys[last];
    // No pruning necessary.
    if (!node.valueMap.has(lastKey)) return false;
    node.valueMap.delete(lastKey);
    // Prune the unused nodes in the chain.
    for (let i = last - 1; i >= 0; --i) {
      if (node.children.size || node.valueMap.size) break;
      node = nodes[i];
      node.children.delete(keys[i]);
    }
    --this._size;
    return true;
  }

  clear() {
    this._root.children.clear();
    this._root.valueMap.clear();
    this._size = 0;
  }

  entries() {
    return this._root.entries([]);
  }

  keys() {
    return this._root.keys([]);
  }

  values() {
    return this._root.values();
  }

  forEach(fn, me) {
    for (const [keys, value] of this.entries()) {
      fn.call(me, value, keys, this);
    }
  }

  keyIntersect(other) {
    if (this === other) {
      return new DeepStore(this);
    }
    // Duck typing.
    if (!other || typeof other !== 'object' || typeof other.keyIntersect !== 'function') {
      throw new TypeError('expected a DeepStore-compatible object');
    }
    return new DeepStore(this._root.keyIntersect(other._root, []));
  }
}

DeepStore.prototype[Symbol.iterator] = DeepStore.prototype.entries;

module.exports = DeepStore;
