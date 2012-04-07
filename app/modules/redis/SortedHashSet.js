/**
 * Creates and modifies a sorted set whose members are hash keys.
 * The sorted set acts as a score-indexed index for those hash keys.
 */

'use strict';

exports.getClass = function() {
  return SortedHashSet;
};

/**
 * @param redis {Object} Redis instance.
 */
var SortedHashSet = function(redis) {
  // Redis instance providing wrappers/alternatives for RedisClient primitives.
  this.redis = redis;
};

/**
 * Creates new hash keys and their sorted set members (scored pointers to the hash keys).
 *
 * - If a key already exists, its field set is modified by the 'updater' callback.
 *
 * @param key {String}
 * @param changes {Object} Hash keys/fields and sorted set member scores.
 * {
 *   <hash key>: {
 *     hashFields: <field set object>,
 *     score: <sorted set member score>
 *   },
 *   <hash key>: {
 *     ...
 *   },
 *   ...
 * }
 * @param updater {Function} Applied to all preexisting hash keys.
 * - See SortedHashSet.updateExistingHashes().
 * @param callback {Function} Fires after upsert completion.
 * - err {String}
 * - replies {Array} Replies from last completed command.
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
SortedHashSet.prototype.upsert = function(key, changes, updater, callback, bulk) {
  var redis = this.redis, hashes = {}, members = [];
  changes = _.clone(changes);

  // Unpack hash fields from 'changes' for updateExistingHashes().
  _.each(changes, function(change, key) {
    hashes[key] = change.hashFields;
  });

  this.updateExistingHashes(hashes, updater, function(err, updatedKeys) {

    // Remove updated keys from insert eligibility.
    _.each(updatedKeys, function(key) {
      delete changes[key];
      delete hashes[key];
    });

    // No insertions required.
    if (!_.size(changes)) {
      callback(null, []);
      return;
    }

    // Unpack hash fields from 'changes' for zadd().
    _.each(changes, function(change, key) {
      members.push([change.score, key]);
    });

    // Insert index entries.
    redis.zadd(key, members, function(err, replies) {
      // Command failed.
      if (err) {
        if (!bulk) { redis.end(); }
        callback(err, replies);
        return;
      }

      // Insert indexed data.
      redis.hset(hashes, function(err, replies) {
        // Command failed.
        if (err) {
          if (!bulk) { redis.end(); }
          callback(err, replies);
          return;
        }

        callback(err, replies);
      });
    });
  });
};

/**
 * Update fields of multiple hash keys -- only if they exist.
 *
 * - Delegate update logic to a callback.
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
