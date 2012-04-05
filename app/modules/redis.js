/**
 * Redis cache client wrapper.
 */

'use strict';

var redis = require('redis'),
    config = diana.getConfig().redis;

exports.createInstance = function() {
  return new Redis();
};

var Redis = function() {};

/**
 * Create the client connection if needed.
 */
Redis.prototype.connect = function() {
  if (!this.client) {
    this.client = redis.createClient(config.port, config.host, config.options);
  }
};

/**
 * End the client connection.
 */
Redis.prototype.end = function() {
  if (this.client) {
    this.client.end();
    this.client = null;
  }
};

/**
 * Set a string key with the given value's JSON.
 *
 * @param key {String}
 * @param value {mixed} Value to serialize and set.
 * @param expire {Number} TTL in seconds.
 * @param callback {Function} Fires on completion
 * - err {String}
 * - replies {Array} [<set reply>, <expire reply>]
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.set = function(key, value, expire, callback, bulk) {
  this.connect();
  var multi = this.client.multi().set(key, JSON.stringify(value));
  if (expire) {
    multi.expire(key, expire);
  }
  var redis = this;
  multi.exec(function(err, replies) {
    if (!bulk) { redis.end(); }
    callback(err, replies);
  });
};

/**
 * Delete one or more keys.
 *
 * @param key {String|Array}
 * @param callback {Function} Fires on completion
 * - err {String}
 * - replies {Array} [<del reply>, ...]
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.del = function(key, callback, bulk) {
  this.connect();
  var multi = this.client.multi();
  key = _.isArray(key) ? key : [key];
  _.each(key, function(name) {
    multi.del(name);
  });
  var redis = this;
  multi.exec(function(err, replies) {
    if (!bulk) { redis.end(); }
    callback(err, replies);
  });
};

/**
 * Read a string key.
 *
 * @param key {String}
 * @param callback {Function} Fires on completion.
 * - err {String}
 * - value {mixed} Unserialized JSON.
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.get = function(key, callback, bulk) {
  this.connect();
  var redis = this;
  this.client
    .get(key, function(err, value) {
      // Redis (nil) or not-exists value is retturned as null.
      if (err || _.isNull(value)) {
        value = undefined;
      } else {
        value = JSON.parse(value);
      }
      if (!bulk) { redis.end(); }
      callback(err, value);
    });
};

/**
 * Read a string key w/ write-through.
 *
 * @param key {String}
 * @param reader {Function} Retrieves the value for write-through.
 * - Must accept (key, readerCallback) and invoke readerCallback(value).
 * @param expire {Number} TTL in seconds.
 * @param callback {Function} Fires on completion.
 * - err {String}
 * - value {mixed} Unserialized JSON.
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.getWithWriteThrough = function(key, reader, expires, callback, bulk) {
  this.connect();
  var redis = this;
  this.get(key, function(err, value) {
    if (!_.isUndefined(value)) {
      callback(err, value);
      return;
    }
    reader(key, function(err, value) {
      if (err) {
        if (!bulk) { redis.end(); }
        callback(err, undefined);
        return;
      }
      redis.set(key, value, expires, function(err) {
        if (!bulk) { redis.end(); }
        callback(err, value);
      });
    });
  });
};

/**
 * Add multiple sorted set members.
 *
 * @param key {String}
 * @param members {Array} Each element: [score, member name].
 * @param callback {Function} Fires on completion.
 * - err {String}
 * - replies {Array} [<zadd reply>, ...]
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.zaddMulti = function (key, members, callback) {
  this.connect();
  var args = [key];
  _.each(members, function(member) {
    args.push(member[0], member[1]); // (score, member name)
  });
  args.push(callback);
  this.client.zadd.apply(this.client, args);
};
