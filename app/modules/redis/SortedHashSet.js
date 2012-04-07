/**
 * Creates and modifies a sorted set whose members are hash keys.
 * The sorted set acts as a score-indexed index for those hash keys.
 */

'use strict';

exports.getClass = function() {
  return SortedHashSet;
};

/**
 * @param key {String} Sorted set key.
 * @param redis {Object} Redis instance.
 */
var SortedHashSet = function(name, redis) {
  this.name = name;

  // Redis instance providing wrappers/alternatives for RedisClient primitives.
  this.redis = redis;
};

/**
 * Update field sets of multiple hash keys if they exist.
 * Delegate update logic to a callback.
 *
 * - Intended to support SortedHashSet.upsert().
 *
 * @param hashes {Object} {<hash key>: <field set object>}
 * @param updates {Object} {<hash key>: <field set object>}
 * @param updater {Function} Called for every preexisting hash key found.
 *   Signature:
 *     @param key {String} Hash key.
 *     @param existing {Object} Existing hashes.
 *     @param updates {Object} Updated hashes.
 *     @param onDone {Function} Call after update handler is finished.
 *   onDone signature:
 *     @param err {mixed} Error object/string, otherwise null.
 *   Example:
 *     function (key, existing, updates, onDone) {
 *       // This particular updater only needs to use 'updates', but 'key' and
 *       // 'existing' are supplied just in case the logic requires them.
 *       redis.hincrby(updates, function(err, replies) {
 *         onDone(err, replies);
 *       });
 *     }
 * @param callback {Function} Fires after upsert completion.
 * - err {String}
 * - replies {Array} Keys of updated hashes.
 */
SortedHashSet.prototype.updateExistingHashes = function(updates, updater, callback) {
  var redis = this.redis;
  updates = _.clone(updates);

  redis.hget(Object.keys(updates), function(err, existing) {

    // Command failed.
    if (err) {
      if (!bulk) { redis.end(); }
      callback(err, existing);
      return;
    }

    // Remove misses.
    _.each(existing, function(fieldSet, key) {
      if (_.isUndefined(fieldSet)) {
        delete existing[key];
        delete updates[key];
      }
    });

    // Delegate modification to 'updater'.
    if (_.size(existing)) {
      updater(existing, updates, redis, function(err) {
        callback(err, Object.keys(existing));
      });
    } else {
      callback(null, []);
    }
  });
};
