/**
 * Collect event count by parser.
 */

'use strict';

require(__dirname + '/../modules/diana.js');
var storage = diana.requireModule('storage/storage').createInstance();

var map = function() {
  emit(this.parser, {count: 1});
};

var reduce = function(key, values) {
  var result = {count: 0};
  values.forEach(function(value) {
    result.count += value.count;
  });
  return result;
};

/**
 * @param startTime {Number} UNIX timestamp in seconds.
 * @param endTime {Number} UNIX timestamp in seconds.
 * @param query {Object} Additional query arguments.
 * @param callback {Function} Fires after success/error.
 * - See MongoDbStorage.mapReduce for payload arguments.
 */
exports.run = function(startTime, endTime, query, callback) {
  storage.mapReduceTimeRange(startTime, endTime, {
    name: __filename,
    map: map,
    reduce: reduce,
    options: {query: query},
    return: 'array',
    callback: callback
  });
};
