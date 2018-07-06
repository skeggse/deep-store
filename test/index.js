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

  it('should not remove partially-matching values', function() {
    this.store.set([1, 2, 3], 'v1');
    const preEntries = Array.from(this.store);
    expect(this.store.delete([1, 2, 3, 4])).to.be.false;
    expect(Array.from(this.store)).to.deep.equal(preEntries);
    expect(this.store.delete([1, 2, 4])).to.be.false;
    expect(Array.from(this.store)).to.deep.equal(preEntries);
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

  it('should support key-based intersections', function() {
    let merged = this.store.keyIntersect(this.store);
    expect(Array.from(merged)).to.deep.equal([]);

    merged = this.store.keyIntersect(new DeepStore());
    expect(Array.from(merged)).to.deep.equal([]);

    const a = new DeepStore([
      [['a'], 1],
      [['b'], 1],
    ]), b = new DeepStore([
      [['a'], 1],
      [['c'], 1],
    ]);

    expect(Array.from(a.keyIntersect(b))).to.have.same.deep.members([[['a'], 1]]);

    const permissive = new DeepStore([
      [['a'], 1],
    ]), strict = new DeepStore([
      [['a', 'b'], 1],
      [['a', 'c'], 1],
    ]);

    expect(Array.from(permissive.keyIntersect(strict))).to.have.same.deep.members(Array.from(strict));
    expect(Array.from(strict.keyIntersect(permissive))).to.have.same.deep.members(Array.from(strict));

    const exclusiveA = new DeepStore([
      [['a', 'b'], 1],
      [['a', 'd'], 1],
    ]), exclusiveB = new DeepStore([
      [['a', 'c'], 1],
      [['a', 'e'], 1],
    ]);

    expect(Array.from(exclusiveA.keyIntersect(exclusiveB))).to.deep.equal([]);
  });

  it('should produce the expected intersection for the README example', function() {
    const permittedFields = new DeepStore([
      [['user'], 1],
      [['share'], 1],
      [['content'], 1],
    ]);

    // Generated from user-provided fields.
    const apiFields = new DeepStore([
      [['user', 'name'], 1],
      [['share'], 1],
      [['accessToken'], 1],
    ]);

    // The other of {permittedFields, apiFields} doesn't matter - we're intersecting
    // here, so it's commutative.
    const selectedFields = permittedFields.keyIntersect(apiFields);

    // Produces a DeepStore with these entries:
    expect(Array.from(selectedFields)).to.have.same.deep.members([
      [['user', 'name'], 1],
      [['share'], 1],
    ]);
  });
});
