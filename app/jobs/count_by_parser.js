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

exports.run = function(startTime, endTime, query, callback) {
  storage.mapReduceTimeRange(startTime, endTime, {
    name: __filename,
    map: map,
    reduce: reduce,
    query: query,
    return: 'array',
    callback: callback
  });
};
