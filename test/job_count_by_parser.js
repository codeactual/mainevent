'use strict';

var testutil = require(__dirname + '/modules/testutil.js');
var storage = diana.requireModule('storage/storage').createInstance();
var parsers = diana.requireModule('parsers/parsers');
var jobName = 'count_by_parser';
var job = diana.requireJob(jobName).run;
var strtotime = diana.shared.Date.strtotime;

/**
 * Verify the job results for a given interval and log set.
 *
 * @param run {String} Unique run ID.
 * @param test {Object} Test instance.
 * @param startTime {Number}
 * @param endTime {Number}
 * @param logs {Array} Event objects.
 * @param expected {Object} Reduce results indexed by their _id values.
 */
var verifyWindow = function(test, run, startTime, endTime, logs, expected, callback) {
  parsers.parseAndInsert(logs, function() {
    var query = {message: run}; // Only for verification lookup.
    job(startTime, endTime, query, function() {
      storage.getMapReduceResults(jobName, function(err, docs) {
        test.deepEqual(docs, expected);
        test.done();
      });
    });
  });
};

exports.testCountByParser = function(test) {
  test.expect(1);
  var run = testutil.getRandHash();
  var logs = [
    {
      source: {parser: 'json'},
      lines: ['{"time":"3/12/2012 09:00:00","message":"' + run + '"}']
    },
    {
      source: {parser: 'php'},
      lines: [
        '[12-Mar-2012 10:00:00 UTC] ' + run,
        '[12-Mar-2012 11:00:00 UTC] ' + run
      ]
    }
  ];
  var expected = {php: {count: 2}, json: {count: 1}};
  verifyWindow(
    test,
    run,
    strtotime('3/12/2012 09:00:00'),
    strtotime('3/12/2012 12:00:00'),
    logs,
    expected
  );
};
