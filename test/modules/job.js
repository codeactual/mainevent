/**
 * Common requirement for all test modules.
 */

'use strict';

var storage = diana.requireModule('storage/storage').createInstance();
var parsers = diana.requireModule('parsers/parsers');

/**
 * Verify the job results for a given interval and log set.
 *
 * @param test {Object} Test instance.
 * @param jobName {String}
 * @param run {String} Unique run ID.
 * @param startTime {Number}
 * @param endTime {Number}
 * @param logs {Array} Event objects.
 * @param expected {Object} Reduce results indexed by their _id values.
 */
exports.verifyTimeRange = function(test, jobName, run, startTime, endTime, logs, expected) {
  var job = diana.requireJob(jobName).run;
  parsers.parseAndInsert(logs, function() {
    var query = {message: run}; // Only for verification lookup.
    job(startTime, endTime, query, function(err, docs) {
      test.deepEqual(docs, expected);
      test.done();
    });
  });
};
