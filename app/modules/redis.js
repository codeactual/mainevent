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
 * @param pairs {Object}
 * - Values are aved as JSON.stringify(v).
 * @param expire {Number} TTL in seconds.
 * @param callback {Function} Fires on completion
 * - err {String}
 * - replies {Array} [<set reply>, <expire reply>]
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.set = function(pairs, expire, callback, bulk) {
  this.connect();
  var multi = this.client.multi();
  _.each(pairs, function(value, key) {
    multi.set(key, JSON.stringify(value));
    if (expire) {
      multi.expire(key, expire);
    }
  });
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
 * @param key {String|Array}
 * @param callback {Function} Fires on completion.
 * - err {String}
 * - value {mixed}
 *   If 'key' is a {String}, then {mixed} based on the serialized data type.
 *   If 'key' is an {Array}, then {Object}.
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.get = function(key, callback, bulk) {
  this.connect();
  var redis = this, multi = this.client.multi(), multiKey = _.isArray(key);
  key = multiKey ? key : [key];
  _.each(key, function(k) {
     multi.get(k);
  });
  multi.exec(function(err, values) {
    var indexed = {};
    _.each(values, function(value, index) {
      // Redis (nil) or not-exists value is retturned as null.
      if (err || _.isNull(value)) {
        indexed[key[index]] = undefined;
      } else {
        indexed[key[index]] = JSON.parse(value);
      }
    });
    if (!bulk) { redis.end(); }
    callback(err, multiKey ? indexed : indexed[key[0]]);
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
      var pairs = {};
      pairs[key] = value;
      redis.set(pairs, expires, function(err) {
        if (!bulk) { redis.end(); }
        callback(err, value);
      });
    });
  });
};

/**
 * Add an array of sorted set members.
 *
 * @param key {String}
 * @param members {Array} Each element: [score, member name].
 * @param callback {Function} Fires on completion.
 * - err {String}
 * - replies {Array} [<zadd reply>, ...]
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.zadd = function (key, members, callback, bulk) {
  this.connect();
  var redis = this, args = [key];
  _.each(members, function(member) {
    args.push(member[0], member[1]); // (score, member name)
  });
  args.push(function(err, replies) {
    if (!bulk) { redis.end(); }
    callback(err, replies);
  });
  this.client.zadd.apply(this.client, args);
};

/**
 * Set hash keys, each with one or more field/value pairs.
 *
 * @param pairs {Object} Values can be strings (HSET) or objects (HMSET).
 * @param callback {Function} Fires on completion
 * - err {String}
 * - replies {Array} [<hset/hmset reply>, ...]
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.hset = function(pairs, callback, bulk) {
  this.connect();
  var client = this.client, multi = this.client.multi();
  _.each(pairs, function(value, key) {
    var args = [key];
    _.each(value, function(fieldValue, fieldName) {
      args.push(fieldName, JSON.stringify(fieldValue));
    });
    multi.hmset.apply(multi, args);
  });
  var redis = this;
  multi.exec(function(err, replies) {
    if (!bulk) { redis.end(); }
    callback(err, replies);
  });
};

/**
 * Get hash key values.
 *
 * @param key {String|Array}
 * @param callback {Function} Fires on completion
 * - err {String}
 * - value {Object}
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.hget = function(key, callback, bulk) {
  this.connect();
  var redis = this, multi = this.client.multi(), multiKey = _.isArray(key);
  key = multiKey ? key : [key];
  _.each(key, function(k) {
     multi.hgetall(k);
  });
  multi.exec(function(err, values) {
    var indexed = {};
    _.each(values, function(value, index) {
      // Redis (nil) or not-exists value is retturned as null.
      if (err || _.isNull(value)) {
        indexed[key[index]] = undefined;
      } else {
        _.each(value, function(fieldValue, fieldName) {
          value[fieldName] = JSON.parse(fieldValue);
        });
        indexed[key[index]] = value;
      }
    });
    if (!bulk) { redis.end(); }
    callback(err, multiKey ? indexed : indexed[key[0]]);
  });
};
