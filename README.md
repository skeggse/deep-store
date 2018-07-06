deep-store
==========

`DeepStore` is basically `Map` if `Map` stored keys for shallow array equality.

Install
-------

```sh
$ npm install deep-store
```

Usage
-----

`DeepStore` mostly mirrors the [`Map` API][Map], but supports an array of keys instead of a single key for all the key-related methods. `DeepStore` also does not remember the order the entries were inserted, so `DeepStore#entries` and other iteration methods operate in an undefined order.

```js
const DeepStore = require('deep-store');
```

### `DeepStore`

The constructor takes an optional iterable containing entry objects, just like `Map`'s constructor:

```js
const store = new DeepStore([
  [['outer', 'inner'], 'value1'],
  [['outer', 'other'], 'value2'],
]);

store.get(['outer', 'inner']);
// => 'value1'

store.get(['outer', 'other']);
// => 'value2'
```

### `DeepStore#get(keys)`

Get the value associated with `keys`, or `undefined`.

```js
store.get(['outer', 'inner']);
// => 'value1'
```

### `DeepStore#has(keys)`

Check whether an entry exists for `keys`. Does not reveal whether entries exist under the given keys.

```js
store.has(['outer', 'inner']);
// => true

store.has(['outer']);
// => false
```

### `DeepStore#set(keys, value)`

Set the entry for the given `keys` to the given `value`. Returns the `DeepStore` instance.

```js
store.set(['outer', 'other'], 'value3');
store.get(['outer', 'other']);
// => value3
```

### `DeepStore#delete(keys)`

Deletes the entry corresponding to the given `keys` array. Returns a boolean indicating whether there was an entry to delete.

```js
store.delete(['outer', 'other']);
// => true
store.delete(['outer', 'other']);
// => false
store.delete(['strange', 'inner']);
// => false
```

### `DeepStore#clear()`

Remove all keys-value associations from the `DeepStore` instance.

```js
store.clear();
store.size;
// => 0
```

### `DeepStore#forEach(iteratee[, thisObject])`

Iterate over all the entries in the `DeepStore`. The `iteratee` function receives `(value, keys, deepStore)`, and is called with `thisObject` as its `this` object.

Unlike `Map`, `DeepStore` does not guarantee a particular ordering of any iteration protocol.

```js
store.forEach(function(value, keys, store) {
  this;
  // => {obj: 'ject'}
  store;
  // => the DeepStore instance.
}, {obj: 'ject'});
```

### `DeepStore#{keys,values,entries}()`

These methods return iterators for the corresponding iteration over the `DeepStore` instance. Convert them to arrays using either `Array.from` or the [spread operator]. Each item in an `entries` iterator is a two-element array containing the `keys` and the `value` for a given entry.

The `DeepStore` object itself is also iterable, which results in the same operation as the `entries` iterator.

Unlike `Map`, `DeepStore` does not guarantee a particular ordering of any iteration protocol.

```js
Array.from(store);
// => [
//  [['outer', 'inner'], 'value1'],
//  [['outer', 'other'], 'value3']
// ]
Array.from(store.keys());
// => [
//  ['outer', 'inner'],
//  ['outer', 'other']
// ]
Array.from(store.values());
// => [
//  'value1',
//  'value3'
// ]
```

### `DeepStore#keyIntersect(other)`

Find the deep intersection of keys between two deep store instances. This method assumes that the deep stores do not have values stored at paths that also have children, and you may see inconsistencies if you attempt to use `keyIntersect` on such stores. We're also only concerned with the intersection of the keys, so we take values arbitrarily from the two stores. If one store has a value at `['a', 'b']`, and the other has a value at `['a', 'b', 'c']` (and no other values under `['a']`, or `['a', 'b']`) then we'll output only the key-value pair from `['a', 'b', 'c']`. This method is intended to support the merging of two MongoDB-style `fields` sets, such that one store can define the permitted fields, and the other can deeply refine those fields (see caveats below the code snippet):

```js
const permittedFields = new DeepStore([
  [['user'], 1],
  [['share'], 1],
  [['content'], 1],
]);

// Generated from user-provided fields.
const apiFields = new DeepStore([
  // Just select the user's name, but not any other user data.
  [['user', 'name'], 1],

  // We'll select all fields from share.
  [['share'], 1],

  // We don't include 'content' here, so we'll exclude it entirely from the
  // intersection.

  // Discarded on intersection, as it's not included by permittedFields.
  [['accessToken'], 1],
]);

// The other of {permittedFields, apiFields} doesn't matter - we're intersecting
// here, so it's commutative.
const selectedFields = permittedFields.keyIntersect(apiFields);

// Produces a DeepStore with these entries:
const selectedFields = new DeepStore([
  [['user', 'name'], 1],
  [['share'], 1],
]);
```

Take note that we don't examine the values, so don't include a `0` as a value in `permittedFields` and expect it to exclude that field. You should either use a different solution or submit a pull request if you want to be able to blacklist keys within whitelisted keys.

[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map "Map - JavaScript &vert; MDN"
[spread operator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator "Spread syntax - JavaScript &vert; MDN"
