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
}

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
 */
Redis.prototype.set = function(key, value, expire, callback) {
  this.connect();
  var multi = this.client.multi().set(key, JSON.stringify(value));
  if (expire) {
    multi.expire(key, expire);
  }
  multi.exec(function(err, replies) {
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
 */
Redis.prototype.del = function(key, callback) {
  this.connect();
  var multi = this.client.multi();
  key = _.isArray(key) ? key : [key];
  _.each(key, function(name) {
    multi.del(name);
  });
  multi.exec(function(err, replies) {
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
 */
Redis.prototype.get = function(key, callback) {
  this.connect();
  this.client
    .get(key, function(err, value) {
      // Redis (nil) or not-exists value is retturned as null.
      if (err || _.isNull(value)) {
        value = undefined;
      } else {
        value = JSON.parse(value);
      }
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
 */
Redis.prototype.getWithWriteThrough = function(key, reader, expires, callback) {
  var redis = this;
  this.get(key, function(err, value) {
    if (!_.isUndefined(value)) {
      callback(err, value);
      return;
    }
    reader(key, function(value) {
      redis.set(key, value, expires, function(err) {
        callback(err, value);
      });
    });
  });
};
