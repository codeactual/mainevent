'use strict';

require(__dirname + '/../modules/diana');

exports.extend = function(subType, props) {
  diana.shared.Lang.inheritPrototype(subType, Job);
  subType.prototype.__super__ = Job;
  _.extend(subType.prototype, props);
};

var Job = function() {
  var options = {
    // Result collection is dropped after the callback receives the content.
    dropResultsAfterUse: true,

    // Result collection name = "<job name><_suffix>".
    suffix: ''
  };

  // Collection.mapReduce() options.
  var mapReduceConfig = {};

  /**
   * Return a shallow copy of the job's options.
   *
   * @param updates {Object} Key/value pairs to change.
   * @return {Object} The merge result.
   */
  this.updateOptions = function(updates) {
    return _.extend(options, updates);
  };

  /**
   * Return a shallow copy of the job's options.
   *
   * @return {Object}
   */
  this.getOptions = function() {
    return _.clone(options);
  };

  /**
   * Intended for use in run(query, ...) in order to remove option key/value pairs
   * that had to be transported in a query object (e.g. from a URL query string).
   *
   * @param query {Object} Modified in-place.
   * @return {Object} Shallow copy of merged options.
   */
  this.extractOptionsFromQuery = function(query) {
    _.each(this.customOptionKeys, function(key) {
      if (_.has(query, key)) {
        options[key] = query[key];
        delete query[key];
      }
    });
    return _.clone(options);
  };

  /**
   * Return a shallow copy of the job's map reduce configuration.
   *
   * @param updates {Object} Key/value pairs to change.
   * @return {Object} The merge result.
   */
  this.updateMapReduceConfig = function(updates) {
    return _.extend(mapReduceConfig, updates);
  };

  /**
   * Return a shallow copy of the job's map reduce configuration.
   *
   * @return {Object}
   */
  this.getMapReduceConfig = function() {
    return _.clone(mapReduceConfig);
  };

  this.mongodb = diana.requireModule('mongodb').createInstance();
};

/**
 * Job name prefixed results collection name.
 */
Job.prototype.name = '';

/**
 * extractOptionsFromQuery(query), if used in run(query, ...), will remove these
 * keys from a query object and move them into this.options.
 */
Job.prototype.customOptionKeys = [];

/**
 * Calculate an expires based on a job query.
 *
 * @param query {Object}
 * @param now {Number} (Optional) Allow unit tests to avoid Date.getTime() use.
 * @return {Number} Seconds.
 */
Job.prototype.getExpires = function(query, now) {
  return 60;
};

/**
 * Start the map/reduce job.
 *
 * @param query {Object} MongoDB query object to narrow the map scope.
 * @param callback {Function} Fires after success/error.
 * - See MongoDB.mapReduce() for arguments notes.
 */
Job.prototype.run = function(query, callback) {};

/**
 * Default suffix generator for the mapReduce() call in run().
 *
 * @param query {Object} Query object originally provided to run().
 * @return {String}
 */
Job.prototype.getSuffix = function(query) {
  var options = this.getOptions();
  return options.suffix || _.sha1(_.extend(options, query));
};

/**
 * Wrap a run() callback with a default clean up routine.
 *
 * @param callback {Function} Callback originally provided to run().
 * @return {Function} Callback to supply to mapReduce().
 */
Job.prototype.wrapCallback = function(callback) {
  var mongodb = this.mongodb,
      options = this.getOptions();

  return function(err, results, stats) {
    // Avoid the dropCollection() below.
    if (!options.dropResultsAfterUse) {
      callback(err, results, stats);
      return;
    }

    // mapReduce() has already cached the results by now. Evict the durable copy.
    if (stats && stats.collectionName) {
      mongodb.dropCollection(stats.collectionName, function() {
        callback(err, results, stats);
      });
    } else {
      callback(err, results);
    }
  };
};

/**
 * Wrap a mapReduce() call with default configuration.
 *
 * @param options {Object} MongoDB.mapReduce() options merged with the default.
 * - Default: {query: query}
 * @param callback {Function}
 */
Job.prototype.mapReduce = function(query, callback) {
  this.mongodb.mapReduce({
    name: this.name,
    map: this.map,
    reduce: this.reduce,
    options: _.extend({query: query}, this.getMapReduceConfig()),
    return: 'array',
    suffix: this.getSuffix(query),
    callback: this.wrapCallback(callback)
  });
};

/**
 * Build the key of the sorted set which indexes this job's results.
 *
 * Ex. 'graph:CountAllPartitioned:json:3600000'.
 */
Job.prototype.buildSortedSetKey = function() { return ''; };

/**
 * Build the key of hash which holds a specific map reduce result.
 *
 * Ex. 'graph:CountAllPartitioned:json:3600000:result:2012-02'
 *
 * @param resultKey {String} Ex. '2012-02'.
 * @return {String}
 */
Job.prototype.buildHashKey = function(namespace, resultKey) {
  return this.buildSortedSetKey(namespace) + ':result:' + resultKey;
};

/**
 * Build the key of hash which holds a specific map reduce result.
 *
 * Ex. 'graph:CountAllPartitioned:json:3600000:result:2012-02'
 *
 * @param resultKey {String} Ex. '2012-02'.
 * @return {String}
 */
Job.prototype.buildLastIdKey = function(namespace) {
  return namespace + ':' + this.name + ':lastId';
};

/**
 * Curry diana.createUtilLogger() with the job's name.
 *
 * @return {Function}
 */
Job.prototype.createUtilLogger = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(this.name);
  return diana.createUtilLogger.call(null, arguments);
};

/**
 * Placeholders.
 */
Job.prototype.map = function() {};
Job.prototype.reduce = function(key, values) {};
