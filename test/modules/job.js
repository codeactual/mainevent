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
 * @param logs {Array} Event objects.
 * @param expected {Object} Reduce results indexed by their _id values.
 *
 * Additional arguments are passed to the job's run() function.
 */
exports.verifyJob = function(test, jobName, logs, expected) {
  var job = diana.requireJob(jobName).run,
      args = Array.prototype.slice.call(arguments, 4);
  args.push(function(err, docs) {
    test.deepEqual(docs, expected);
    test.done();
  });
  parsers.parseAndInsert(logs, function() {
    job.apply(null, args);
  });
};
