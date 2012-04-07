/**
 * Test Redis API.
 */

'use strict';

var testutil = require(__dirname + '/modules/testutil.js'),
    redis = diana.requireModule('redis').createInstance(),
    SortedHashSet = diana.requireModule('redis/SortedHashSet').getClass();

var setUp = function(suite, callback) {
  // Random keys deleted before/after each test case.
  suite.keys = [];
  _(5).times(function() { suite.keys.push(testutil.getRandHash()); });

  // Random object used for serialization tests.
  suite.expectedObj = {a: {b: suite.keys[0]}};

  // Clean slate.
  redis.del(suite.keys, function(err) {
    if (err) {
      process.exit('setUp could not delete test key: ' + err);
    }
    callback();
  });
};

var tearDown = function(suite, callback) {
  redis.del(suite.keys, function(err) {
    if (err) {
      process.exit('tearDown could not delete test key: ' + err);
    }
    callback();
  });
};

exports.strings = {
  setUp: function(callback) { setUp(this, callback); },
  tearDown: function(callback) { tearDown(this, callback); },

  testGetMissSingleKey: function(test) {
    test.expect(1);
    var run = this, pairs = {};
    redis.get(run.keys[0], function(err, actual) {
      test.deepEqual(actual, undefined);
      test.done();
    });
  },

  testGetMissMultiKey: function(test) {
    test.expect(1);
    var run = this, pairs = {};
    redis.get([run.keys[0]], function(err, actual) {
      var expected = {};
      expected[run.keys[0]] = undefined;
      test.deepEqual(actual, expected);
      test.done();
    });
  },

  testGetWithoutExpires: function(test) {
    test.expect(1);
    var run = this, pairs = {};
    pairs[run.keys[0]] = this.expectedObj;
    redis.set(pairs, null, function(err, replies) {
      redis.get(run.keys[0], function(err, actual) {
        test.deepEqual(actual, run.expectedObj);
        test.done();
      });
    });
  },

  testGetMultiWithoutExpires: function(test) {
    test.expect(1);
    var run = this, pairs = {};
    pairs[run.keys[0]] = this.expectedObj;
    redis.set(pairs, null, function(err, replies) {
      redis.get([run.keys[0]], function(err, actual) {
        test.deepEqual(actual, pairs);
        test.done();
      });
    });
  },

  testGetWithExpires: function(test) {
    test.expect(2);
    var run = this, expires = 1, pairs = {};
    pairs[run.keys[0]] = this.expectedObj;
    redis.set(pairs, expires, function(err, replies) {
      // get() immediately after should succeed.
      redis.get(run.keys[0], function(err, actual) {
        test.deepEqual(actual, run.expectedObj);
      });
      // get() past expiration should fail.
      setTimeout(function() {
        redis.get(run.keys[0], function(err, actual) {
          test.deepEqual(actual, undefined);
          test.done();
        });
      }, expires * 2000);
    });
  },

  testGetWithWriteThroughReaderMiss: function(test) {
    test.expect(2);
    var run = this,
        expires = null,
        reader = function(key, callback) {
          callback(null, undefined);
        };
    redis.getWithWriteThrough(run.keys[0], reader, expires, function(err, actual) {
      test.deepEqual(actual, undefined);
      // Verify set() was skipped.
      redis.connect();
      redis.client.exists(run.keys[0], function(err, actual) {
        test.equal(actual, false);
        test.done();
      });
    });
  },

  testGetWithWriteThroughWithoutExpires: function(test) {
    test.expect(1);
    var run = this,
        expires = null,
        reader = function(key, callback) {
          callback(null, run.expectedObj);
        };
    redis.getWithWriteThrough(run.keys[0], reader, expires, function(err, actual) {
      test.deepEqual(actual, run.expectedObj);
      test.done();
    });
  },

  testGetWithWriteThroughWithExpires: function(test) {
    test.expect(3);
    var run = this,
        expires = 1,
        reader = function(key, callback) {
          callback(null, run.expectedObj);
        };
    redis.getWithWriteThrough(run.keys[0], reader, expires, function(err, actual) {
      // Callback receives reader output.
      test.deepEqual(actual, run.expectedObj);
      // get() immediately after should succeed.
      redis.get(run.keys[0], function(err, actual) {
        test.deepEqual(actual, run.expectedObj);
      });
      // get() past expiration should fail.
      setTimeout(function() {
        redis.get(run.keys[0], function(err, actual) {
          test.equal(actual, undefined);
          test.done();
        });
      }, expires * 2000);
    });
  },

  testGetWithWriteThroughWithReaderError: function(test) {
    test.expect(2);
    var run = this,
        expires = null,
        readerError = 'read errror',
        reader = function(key, callback) {
          callback(readerError);
        };
    redis.getWithWriteThrough(run.keys[0], reader, expires, function(err, actual) {
      test.equal(err, readerError);
      test.equal(actual, undefined);
      test.done();
    });
  }
};

exports.sortedSets = {
  setUp: function(callback) { setUp(this, callback); },
  tearDown: function(callback) { tearDown(this, callback); },

  testZadd: function(test) {
    test.expect(1);

    var expected = [[3, 'three'], [4, 'four'], [5, 'five']];

    var run = this;
    redis.zadd(this.keys[0], expected, function(err, replies) {
      redis.zrangebyscoreWithScores(run.keys[0], 3, 5, function(err, actual) {
        test.deepEqual(actual, expected);
        test.done();
      });
    });
  },

  testZrangebyscoreWithScore: function(test) {
    test.expect(1);

    var expected = [[3, 'three'], [4, 'four'], [5, 'five']];

    var run = this, deferClose = true;
    redis.zadd(this.keys[0], expected, function(err, replies) {
      redis.zrangebyscoreWithScores(run.keys[0], 3, 5, function(err, actual) {
        test.deepEqual(actual, expected);
        test.done();
      });
    }, deferClose);
  }
};

exports.hashes = {
  setUp: function(callback) { setUp(this, callback); },
  tearDown: function(callback) { tearDown(this, callback); },

  testHset: function(test) {
    test.expect(1);
    var run = this, updates = {};

    updates[this.keys[0]] = {field1: {obj1: 'value1'}};

    redis.hset(updates, function(err, replies) {
      redis.hget(run.keys[0], function(err, actual) {
        test.deepEqual(actual, updates[run.keys[0]]);
        test.done();
      });
    });
  },

  testHgetMissSingleKey: function(test) {
    test.expect(1);
    var run = this, updates = {};

    redis.hget(run.keys[0], function(err, actual) {
      test.equal(actual, undefined);
      test.done();
    });
  },

  testHgetMissMultiKey: function(test) {
    test.expect(1);
    var run = this, updates = {};

    redis.hget([run.keys[0]], function(err, actual) {
      var expected = {};
      expected[run.keys[0]] = undefined;
      test.deepEqual(actual, expected);
      test.done();
    });
  },

  testHsetMulti: function(test) {
    test.expect(1);
    var run = this, updates = {};

    updates[this.keys[0]] = {field1: {obj1: 'value1'}};
    updates[this.keys[1]] = {field1: {obj1: 'value1'}, field2: {obj2: 'value2'}};

    redis.hset(updates, function(err, replies) {
      redis.hget(Object.keys(updates), function(err, actual) {
        test.deepEqual(actual, updates);
        test.done();
      });
    });
  },

  testHincrby: function(test) {
    test.expect(1);
    var orig = {}, updates = {}, expected = {};

    // Original state.
    orig[this.keys[0]] = {count: 1};
    orig[this.keys[1]] = {count: 3};

    // Increment targets and amounts.
    updates[this.keys[0]] = {count: 5};
    updates[this.keys[1]] = {count: 7};

    // Final state.
    expected[this.keys[0]] = {count: 6};
    expected[this.keys[1]] = {count: 10};

    redis.hset(orig, function(err, actual) {
      redis.hincrby(updates, function(err, replies) {
        redis.hget(Object.keys(orig), function(err, actual) {
          test.deepEqual(actual, expected);
          test.done()
        });
      });
    });
  }
};

exports.sortedHashSet = {
  setUp: function(callback) { setUp(this, callback); },
  tearDown: function(callback) { tearDown(this, callback); },

  testUpdateExistingHashes: function(test) {
    test.expect(2);
    var run = this, orig = {}, updates = {}, expected = {};

    // Original state.
    orig[this.keys[1]] = {count: 3};
    orig[this.keys[2]] = {count: 5};

    // Updated counts which 'updater' will decide how to process.
    updates[this.keys[0]] = {count: 1};
    updates[this.keys[1]] = {count: 2};
    updates[this.keys[2]] = {count: 7};

    // Final state.
    expected[this.keys[0]] = undefined;    // Not in original state.
    expected[this.keys[1]] = {count: 5};   // Updated.
    expected[this.keys[2]] = {count: 12};  // Updated.

    // Custom logic for updating preexisting keys.
    // Here the logic is for 'count' to be incremented by the new values.
    var updater = function(existing, updates, redis, onDone) {
      redis.hincrby(updates, function(err, replies) {
        onDone();
      });
    };

    // Set original state.
    redis.hset(orig, function(err, replies) {
      // Update state.
      var shs = new SortedHashSet(null, redis);
      shs.updateExistingHashes(updates, updater, function(err, updatedKeys) {
        // Verify stats from callback.
        test.deepEqual(updatedKeys, updatedKeys);
        // Verify final state.
        redis.hget(Object.keys(expected), function(err, actual) {
          test.deepEqual(actual, expected);
          test.done();
        });
      });
    });
  },

  testUpsert: function(test) {
    test.expect(2);
    var run = this, origHashes = {}, changes = {}, expectedHashes = {};

    // Original state.
    origHashes[this.keys[1]] = {count: 3};
    origHashes[this.keys[2]] = {count: 5};
    var origMembers = [
      [1333773458510, this.keys[1]],
      [1333773458511, this.keys[2]]
    ];

    // Passed to SortedHashSet.upsert().
    //
    // Should trigger insert.
    changes[this.keys[0]] = { hashFields: {count: 20}, score: 1333773458509 };
    // Should trigger update.
    changes[this.keys[1]] = {hashFields: {count: 2}, score: 1333773458510};
    // Should trigger update.
    changes[this.keys[2]] = {hashFields: {count: 7}, score: 1333773458511};

    // Final state.
    expectedHashes[this.keys[0]] = {count: 20};  // Inserted.
    expectedHashes[this.keys[1]] = {count: 5};   // Updated.
    expectedHashes[this.keys[2]] = {count: 12};  // Updated.
    var expectedMembers = [
      [1333773458509, this.keys[0]],
      [1333773458510, this.keys[1]],
      [1333773458511, this.keys[2]]
    ];

    // Custom logic for updating preexisting keys.
    // Here the logic is for 'count' to be incremented by the new values.
    var updater = function(existing, updates, redis, onDone) {
      redis.hincrby(updates, function(err, replies) {
        onDone(err);
      });
    };

    var sortedSetKey = this.keys[3],
        shs = new SortedHashSet(sortedSetKey, redis),
        min = 1333773458509,
        max = 1333773458511;

    // Set original hash states.
    redis.hset(origHashes, function(err, replies) {
      // Set original sorted set state.
      redis.zadd(sortedSetKey, origMembers, function(err, replies) {
        // Modify state.
        shs.upsert(changes, updater, function(err, replies) {
          // Verify final hash states.
          redis.hget(Object.keys(changes), function(err, actual) {
            test.deepEqual(actual, expectedHashes);
            // Verify final sorted set states.
            redis.zrangebyscoreWithScores(sortedSetKey, min, max, function(err, actual) {
              test.deepEqual(actual, expectedMembers);
              test.done();
            });
          });
        });
      });
    });
  }
};
