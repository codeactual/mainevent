/**
 * Collect event count by parser.
 */

'use strict';

require(__dirname + '/../modules/diana.js');
var mongodb = diana.requireModule('mongodb').createInstance();

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
 * @param query {Object}
 * @param callback {Function} Fires after success/error.
 * - See MongoDbStorage.mapReduce for payload arguments.
 * - Results example:
 *   {
 *     <parser_name>: {count: 1},
 *     ...
 *   }
 */
exports.run = function(query, callback) {
  mongodb.mapReduce({
    name: __filename,
    map: map,
    reduce: reduce,
    options: {query: query},
    return: 'array',
    callback: callback
  });
};
