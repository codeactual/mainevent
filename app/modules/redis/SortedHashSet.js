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
 * Adds new hash keys to the collection, or updates them if they already exist.
 *
 * @param hashes {Object} {<hash key>: <field set object>}
 * @param updates {Object} {<hash key>: <field set object>}
 * @param updater {Function} Called for every preexisting hash key found.
 *   Signature:
 *   @param key {String} Hash key.
 *   @param existing {Object} Existing hashes.
 *   @param updates {Object} Updated hashes.
 *   @param onDone {Function} Call after update handler is finished.
 *   Example:
 *   function (key, existing, updates, onDone) {
 *     // This particular updater only needs to use 'updates', but 'key' and
 *     // 'existing' are supplied just in case the logic requires them.
 *     redis.hincrby(updates, function(err, replies) {
 *       onDone();
 *     });
 *   }
 * @param callback {Function} Fires after upsert completion.
 * - err {String}
 * - replies {Array} From last command to complete.
 */
SortedHashSet.prototype.updateExistingHashes = function(updates, updater, callback) {
  var sortedHashSet = this, redis = this.redis;

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
      updater(existing, updates, redis, function() {
        callback(Object.keys(existing));
      });
    } else {
      callback([]);
    }
  });
};
