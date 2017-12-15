const expect = require('chai').expect;

const DeepStore = require('..');

const o = Object.create.bind(Object, null);

describe('DeepStore', function() {
  beforeEach(function() {
    this.store = new DeepStore();
  });

  it('should start with the initialized entries', function() {
    const k1 = o(), k2 = o(), k3 = o(), k4 = o(), v1 = o(), v2 = o(), v3 = o();
    const store = new DeepStore([
      [[k1], v1],
      [[k2], v2],
      [[k3, k4], v3],
    ]);
    expect(store.size).to.equal(3);
    expect(store.has([k1])).to.be.true;
    expect(store.get([k1])).to.equal(v1);
    expect(store.has([k2])).to.be.true;
    expect(store.get([k2])).to.equal(v2);
    expect(store.has([k3, k4])).to.be.true;
    expect(store.get([k3, k4])).to.equal(v3);
  });

  it('should store a one-level value', function() {
    const k = o(), v = o();
    this.store.set([k], v);
    expect(this.store.has([k])).to.be.true;
    expect(this.store.get([k])).to.equal(v);
    expect(this.store.size).to.equal(1);
  });

  it('should store a two-level value', function() {
    const k1 = o(), k2 = o(), v = o();
    this.store.set([k1, k2], v);
    expect(this.store.has([k1, k2])).to.be.true;
    expect(this.store.get([k1, k2])).to.equal(v);
    expect(this.store.size).to.equal(1);
  });

  it('should store an n-level value', function() {
    const k = [], v = o();
    for (let i = 0; i < 5; ++i) k.push(o());
    this.store.set(k, v);
    expect(this.store.has(Array.from(k))).to.be.true;
    expect(this.store.get(Array.from(k))).to.equal(v);
    expect(this.store.size).to.equal(1);
  });

  it('should remove a one-level value', function() {
    const k = o(), v = o();
    this.store.set([k], v);
    this.store.delete([k]);
    expect(this.store.size).to.equal(0);
    expect(this.store.has([k])).to.be.false;
    expect(this.store.get([k])).to.be.undefined;
  });

  it('should remove a two-level value', function() {
    const k1 = o(), k2 = o(), v = o();
    this.store.set([k1, k2], v);
    this.store.delete([k1, k2]);
    expect(this.store.size).to.equal(0);
    expect(this.store.has([k1, k2])).to.be.false;
    expect(this.store.get([k1, k2])).to.be.undefined;
  });

  it('should remove a two-level value and leave other values', function() {
    const k1 = o(), k2 = o(), k3 = o(), v1 = o(), v2 = o();
    this.store.set([k1, k2], v1);
    this.store.set([k1, k3], v2);
    this.store.delete([k1, k2]);
    expect(this.store.size).to.equal(1);
    expect(this.store.has([k1, k2])).to.be.false;
    expect(this.store.get([k1, k2])).to.be.undefined;
    expect(this.store.has([k1, k3])).to.be.true;
    expect(this.store.get([k1, k3])).to.equal(v2);
  });

  it('should remove a two-level value and leave other paths', function() {
    const k1 = o(), k2 = o(), k3 = o(), k4 = o(), v1 = o(), v2 = o();
    this.store.set([k1, k2], v1);
    this.store.set([k3, k4], v2);
    this.store.delete([k1, k2]);
    expect(this.store.size).to.equal(1);
    expect(this.store.has([k1, k2])).to.be.false;
    expect(this.store.get([k1, k2])).to.be.undefined;
    expect(this.store.has([k3, k4])).to.be.true;
    expect(this.store.get([k3, k4])).to.equal(v2);
  });

  it('should remove an n-level value', function() {
    const k = [], v = o();
    for (let i = 0; i < 5; ++i) k.push(o());
    this.store.set(k, v);
    this.store.delete(k);
    expect(this.store.size).to.equal(0);
    expect(this.store.has(Array.from(k))).to.be.false;
    expect(this.store.get(Array.from(k))).to.be.undefined;
  });

  it('should not report a child-only path', function() {
    const k1 = o(), k2 = o(), v = o();
    this.store.set([k1, k2], v);
    expect(this.store.has([k1])).to.be.false;
    expect(this.store.get([k1])).to.be.undefined;
  });

  it('should support iteration protocols', function() {
    this.store.set(['a', 'b'], 'v1');
    this.store.set(['a', 'c'], 'v2');
    this.store.set(['d', 'e'], 'v3');
    expect(this.store.size).to.equal(3);
    expect(Array.from(this.store)).to.have.same.deep.members([
      [['a', 'b'], 'v1'],
      [['a', 'c'], 'v2'],
      [['d', 'e'], 'v3'],
    ]);
    expect(Array.from(this.store)).to.have.same.deep.members(Array.from(this.store.entries()));
    expect(Array.from(this.store.keys())).to.have.same.deep.members([
      ['a', 'b'],
      ['a', 'c'],
      ['d', 'e'],
    ]);
    expect(Array.from(this.store.values())).to.have.same.deep.members([
      'v1',
      'v2',
      'v3',
    ]);
    const result = [];
    const s = o();
    this.store.forEach(function(value, keys) {
      expect(this).to.equal(s);
      result.push([keys, value]);
    }, s);
    expect(result).to.have.same.deep.members(Array.from(this.store));
  });
});
