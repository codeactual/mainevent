/**
 * Collect event count by parser.
 */

'use strict';

require(__dirname + '/../modules/diana.js');
var storage = diana.requireModule('storage/storage').createInstance();

var options = {out: {replace : "top_parsers"}};

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

storage.dbConnectAndOpen(function(err, db) {
  storage.dbCollection(db, storage.collection, function(err, collection) {
    collection.mapReduce(map, reduce, options, function(err, results, stats) {
      storage.dbClose();
    });
  });
});
