/**
 * Used by test/mongodb.js to test the 'InsertLog' event in the MongoDb class.
 */

'use strict';

exports.on = function(logs) {
  process.emit('InsertLogListener', logs);
};
