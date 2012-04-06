/**
 * Test Redis API.
 */

'use strict';

var testutil = require(__dirname + '/modules/testutil.js'),
    redis = diana.requireModule('redis').createInstance();

exports.strings = {
  setUp: function(callback) {
    this.key = testutil.getRandHash();
    this.expected = {a: {b: this.key}};

    // Clean slate.
    redis.del(this.key, function(err) {
      if (err) {
        process.exit('setUp could not delete test key: ' + err);
      }
      callback();
    });
  },

  tearDown: function(callback) {
    redis.del(this.key, function(err) {
      if (err) {
        process.exit('tearDown could not delete test key: ' + err);
      }
      callback();
    });
  },

  testGetWithoutExpires: function(test) {
    test.expect(1);
    var run = this;
    redis.set(run.key, this.expected, null, function(err, replies) {
      redis.get(run.key, function(err, actual) {
        test.deepEqual(actual, run.expected);
        test.done();
      });
    });
  },

  testGetWithExpires: function(test) {
    test.expect(2);
    var run = this,
        expires = 1;
    redis.set(run.key, this.expected, expires, function(err, replies) {
      // get() immediately after should succeed.
      redis.get(run.key, function(err, actual) {
        test.deepEqual(actual, run.expected);
      });
      // get() past expiration should fail.
      setTimeout(function() {
        redis.get(run.key, function(err, actual) {
          test.equal(actual, undefined);
          test.done();
        });
      }, expires * 2000);
    });
  },

  testGetWithWriteThroughWithoutExpires: function(test) {
    test.expect(1);
    var run = this,
        expires = null,
        reader = function(key, callback) {
          callback(null, run.expected);
        };
    redis.getWithWriteThrough(run.key, reader, expires, function(err, actual) {
      test.deepEqual(actual, run.expected);
      test.done();
    });
  },

  testGetWithWriteThroughWithExpires: function(test) {
    test.expect(3);
    var run = this,
        expires = 1,
        reader = function(key, callback) {
          callback(null, run.expected);
        };
    redis.getWithWriteThrough(run.key, reader, expires, function(err, actual) {
      // Callback receives reader output.
      test.deepEqual(actual, run.expected);
      // get() immediately after should succeed.
      redis.get(run.key, function(err, actual) {
        test.deepEqual(actual, run.expected);
      });
      // get() past expiration should fail.
      setTimeout(function() {
        redis.get(run.key, function(err, actual) {
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
    redis.getWithWriteThrough(run.key, reader, expires, function(err, actual) {
      test.equal(err, readerError);
      test.equal(actual, undefined);
      test.done();
    });
  },

  testZaddMulti: function(test) {
    test.expect(1);

    var expected = [[3, 'three'], [4, 'four'], [5, 'five']];

    var run = this, deferClose = true;
    redis.zadd(this.key, expected, function(err, replies) {
      redis.client.zrangebyscore(run.key, 3, 5, function(err, actual) {
        test.deepEqual(actual, ['three', 'four', 'five']);
        test.done();
      });
    }, deferClose);
  }
};
