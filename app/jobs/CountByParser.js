/**
 * Collect event count by parser.
 */

'use strict';

var Job = require(__dirname + '/prototype');

'use strict';

exports.getClass = function() {
  return CountByParser;
};

/**
 * @param namespace {String} (Optional) For building Redis keys. Ex. 'graph'.
 */
var CountByParser = function() {
  this.name = diana.extractJobName(__filename);
  this.__super__.apply(this, arguments);
};

Job.extend(CountByParser, {

  map: function() {
    emit(this.parser, {count: 1});
  },

  reduce: function(key, values) {
    var result = {count: 0};
    values.forEach(function(value) {
      result.count += value.count;
    });
    return result;
  },

  /**
   * See prototype in prototype.js for full notes.
   *
   * Results format:
   *   {
   *     <parser_name>: {count: 1},
   *     ...
   *   }
   */
  run: function(query, callback) {
    this.mapReduce(query, callback);
  }
});
