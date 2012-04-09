/**
 * Common requirement for all test modules.
 */

'use strict';

var testutil = require(__dirname + '/testutil.js');

/**
 * Verify the job results for a given interval and log set.
 *
 * @param test {Object} Test instance.
 * @param job {Object} Job instance.
 * @param logs {Array} Event objects.
 * @param expected {Object} Reduce results indexed by their _id values.
 * @param options {Object} Job-specific options.
 *
 * Additional arguments are passed to the job's run() function.
 */
exports.verifyJob = function(test, job, logs, expected, options) {
  test.expect(1);

  var parsers = mainevent.requireModule('parsers'),
      mongodb = testutil.getTestMongoDb();

  parsers.parseAndInsert(mongodb, logs, function() {
    job.run(options, function(err, results) {
      // Remove non-verified attribute.
      _.each(results, function(result, key) {
        delete results[key]._id;
      });
      test.deepEqual(results, expected);
      test.done();
    });
  });
};
