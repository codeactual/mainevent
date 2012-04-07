/**
 * Wrappers/alternatives for RedisClient primitives.
 *
 * - Auto-connect/disconnect.
 * - Multi-key/pipelined versions of some primitives.
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
 * - results {mixed}
 *   Single key: {mixed} Unserialized value.
 *   Multi key: {Object} {<key>: <value>, ...}
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

    // Command failed.
    if (err) {
      if (!bulk) { redis.end(); }
      callback(err, undefined);
      return;
    }

    // Cache hit.
    if (!_.isUndefined(value)) {
      if (!bulk) { redis.end(); }
      callback(err, value);
      return;
    }

    // Cache miss -- execute reader.
    reader(key, function(err, value) {
      // Reader failed.
      if (err) {
        if (!bulk) { redis.end(); }
        callback(err, undefined);
        return;
      }

      // Reader also missed -- skip set.
      if (_.isUndefined(value)) {
        if (!bulk) { redis.end(); }
        callback(err, value);
        return;
      }

      // Reader hit -- write to cache.
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
 * Get sorted set members and scores.
 *
 * - Workaround until WITHSCORES support is added:
 *   https://github.com/mranney/node_redis/issues/97
 *
 * @param key {String}
 * @param min {Number}
 * @param max {Number}
 * @param callback {Function} Fires on completion.
 * - err {String}
 * - results {Array} [[<score>, <member>], ...]
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.zrangebyscoreWithScores = function(key, min, max, callback, bulk) {
  this.connect();
  var redis = this, multi = this.client.multi();

  redis.client.zrangebyscore(key, min, max, function(err, members) {

    // Command failed.
    if (err) {
      if (!bulk) { redis.end(); }
      callback(err, members);
      return;
    }

    // Collect scores.
    _.each(members, function(member) {
      multi.zscore(key, member);
    });

    multi.exec(function(err, scores) {

      // Command failed.
      if (err) {
        if (!bulk) { redis.end(); }
        callback(err, scores);
        return;
      }

      var collection = [];
      _.each(members, function(member, index) {
        collection.push([scores[index], member]);
      });

      if (!bulk) { redis.end(); }
      callback(err, collection);
    });
  });
};

/**
 * Set hash keys, each with one or more field/value pairs.
 *
 * @param pairs {Object} Values can be strings (HSET) or objects (HMSET).
 * @param callback {Function} Fires on completion
 * - err {String}
 * - replies {Array} [<hmset reply>, ...]
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.hset = function(pairs, callback, bulk) {
  this.connect();
  var client = this.client, multi = this.client.multi();
  // Build a pipelined sequence of HMSET commands.
  _.each(pairs, function(value, key) {
    var args = [key];
    // Serialize field values.
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
 * - results {Object}
 *   Single key: {Object} {<field>: <value>, ...}
 *   Multi key: {Object} {<key>: {<field>: <value>, ...}, ...}
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

    // Command failed.
    if (err) {
      if (!bulk) { redis.end(); }
      callback(err, values);
      return;
    }

    // Command succeeded -- build results object.
    var indexed = {};
    _.each(values, function(value, index) {
      // Redis (nil) or not-exists value is retturned as null.
      if (err || _.isEmpty(value)) {
        indexed[key[index]] = undefined;
      } else {
        // Unserialize field values.
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

/**
 * Increment multiple hash field values.
 *
 * @param updates {Object}
 * {
 *   <key>: {
 *     <field>: <increment>,
 *     <field>: <increment>,
 *     ...
 *   },
 *   ...
 * }
 * @param callback {Function} Fires on completion
 * - err {String}
 * - replies {Array} [<set reply>, <expire reply>]
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
Redis.prototype.hincrby = function(updates, callback, bulk) {
  this.connect();
  var multi = this.client.multi();

  _.each(updates, function(update, key) {
    _.each(update, function(increment, field) {
      multi.hincrby(key, field, increment);
    });
  });

  var redis = this;
  multi.exec(function(err, replies) {
    if (!bulk) { redis.end(); }
    callback(err, replies);
  });
};
