/**
 * Redis cache client wrapper.
 */

'use strict';

var redis = require('redis'),
    config = diana.getConfig().redis;

exports.createInstance = function() {
  return new Redis();
};

var Redis = function() {
  this.client = redis.createClient(config.port, config.host, config.options);
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
  var multi = this.client.multi().set(key, JSON.stringify(value));
  if (expire) {
    multi.expire(key, expire);
  }
  multi.exec(function(err, replies) {
    console.log(err, 'replies', replies);
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
  this.client
    .get(key, function(err, value) {
      if (!err && !_.isNull(value)) {
        value = JSON.parse(value);
      }
      callback(err, value);
    });
};
