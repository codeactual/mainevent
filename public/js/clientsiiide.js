'use strict';

/**
 * Create a new localStorage wrapper instance.
 *
 * @param appNs {String} Ex. 'postwidget'
 * @return {Object}
 */
var clientsiiide = function(appNs) {
  /**
   * API returned by constructor.
   */
  var pub = {};

  /**
   * Current UNIX timestamp in seconds.
   *
   * @return {Number}
   */
  var now = function() {
    return Math.round(Date.now() / 1000);
  };

  /**
   * Array type check.
   *
   * @param type {String} Ex. 'Array'
   * @param value {Any}
   * @return {Boolean}
   * @see Stack Overflow http://goo.gl/FO2rs
   */
  var isType = function(type, value) {
    return Object.prototype.toString.call(value) === '[object ' + type + ']';
  }

  /**
   * undefined check.
   *
   * @param value {Any}
   * @return {Boolean}
   */
  var isDefined = function(value) {
    return undefined !== value;
  }

  /**
   * Wrap any non-array in an array.
   *
   * @param value {Any}
   * @return {Array}
   */
  var arrayify = function(value) {
    return isType('Array', value) ? value : [value];
  }

  /**
   * Build a cache key from the app namespace, key namespace, and key.
   *
   * @param ns {String} Key namespace, ex. 'users'.
   * @param key {String} Ex. 'id:43'.
   * @return {String} Ex. 'postwidget:users:id:43'.
   */
  var fullKey = function(ns, key) {
    return appNs + ':' + ns + ':' + key;
  };

  /**
   * Build a cache key for the expiration timestamp of a (data) key.
   *
   * @param ns {String} Key namespace, ex. 'users'.
   * @param key {String} Ex. 'id:43'.
   * @return {String} Ex. 'postwidget:users:id:43:expire'.
   */
  var expireKey = function(ns, key) {
    return fullKey(ns, key) + ':expire';
  };

  /**
   * Collect hit data and missed keys.
   * - Made public for unit tests.
   *
   * @param config {Object}
   * - ns {String} Namespace.
   * - keys {Array | String} One or more keys.
   * - expires {Number} Seconds until expiration.
   * @return {Object} Results:
   * - hits {Object} Key/value pairs.
   * - misses {Array} Keys.
   * @throws Error
   * - on invalid ns
   * - on invalid keys
   */
  pub.getHitMissData = function(config) {
    if (!isDefined(config.ns) || !isType('String', config.ns)) {
      throw new Error('requires ns');
    }
    if (!isDefined(config.keys)
        || (!isType('String', config.keys) && !isType('Array', config.keys))) {
      throw new Error('requires keys');
    }

    var data = { hits: {}, misses: [] };

    arrayify(config.keys).forEach(function(key) {
      var value = localStorage[fullKey(config.ns, key)];

      // Regular miss.
      if (!isDefined(value) || null === value) {
        data.misses.push(key);
      } else {
        var expiration = localStorage[expireKey(config.ns, key)];
        if (!isDefined(expiration) || null === expiration) {
          // Key gained an expiration via code change. Force miss.
          if (config.expires) {
            data.misses.push(key);
          // No expiration.
          } else {
            data.hits[key] = JSON.parse(value);
          }
        } else {
          var untilExpire = expiration - now();
          // Miss due to expiration.
          if (untilExpire < 0) {
            data.misses.push(key);
          // Expiration shortened via code change. Force miss.
          } else if (config.expires && untilExpire > config.expires) {
            data.misses.push(key);
          // Not expired.
          } else {
            data.hits[key] = JSON.parse(value);
          }
        }
      }
    });

    return data;
  };

  /**
   * Synchronously read from cache w/out read-through.
   *
   * @param config {Object}
   * - ns {String} Namespace.
   * - keys {Array | String} One or more keys.
   * - expires {Number} Seconds until expiration.
   * @return {Object} Key/value pairs. Misses omitted.
   * @throws Error
   * - on invalid ns
   * - on invalid keys
   */
  pub.syncGet = function(config) {
    return pub.getHitMissData(config).hits;
  };

  /**
   * Asynchronously read from cache w/ read-through.
   *
   * @param config {Object}
   * - ns {String} Namespace.
   * - keys {Array | String} One or more keys.
   * - expires {Number} Seconds until expiration.
   * - onDone {Function} Receives key/value pairs. Omits unresolved misses.
   * - onMiss {Function} Receives:
   *   - {Array} Missed keys.
   *   - {Function} Must call with values collected from data store.
   * @throws Error
   * - on invalid ns
   * - on invalid keys
   * - on invalid onDone
   * - on invalid onMiss
   */
  pub.get = function(config) {
    if (!isDefined(config.onDone) || !isType('Function', config.onDone)) {
      throw new Error('requires onDone callback');
    }
    if (!isDefined(config.onMiss) || !isType('Function', config.onMiss)) {
      throw new Error('requires onMiss callback');
    }

    var data = pub.getHitMissData(config);

    // All hits. No write needed.
    if (!data.misses.length) {
      config.onDone(data.hits);
      return;
    }

    // Resolve misses from data store.
    config.onMiss(data.misses, function(results) {
      Object.keys(results).forEach(function(key) {
        if (config.expires) {
          localStorage[expireKey(config.ns, key)] = now() + config.expires;
        }
        localStorage[fullKey(config.ns, key)] = JSON.stringify(results[key]);
        data.hits[key] = results[key];
      });
      config.onDone(data.hits);
    });
  };

  return pub;
};
