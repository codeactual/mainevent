'use strict';

var testutil = require(__dirname + '/modules/testutil.js');
var job = require(__dirname + '/modules/job.js');
var jobName = 'count_by_parser';
var strtotime = diana.shared.Date.strtotime;

exports.testCountByParser = function(test) {
  test.expect(1);
  var runId = testutil.getRandHash();
  var logs = [
    {
      source: {parser: 'json'},
      lines: ['{"time":"3/12/2012 09:00:00","message":"' + runId + '"}']
    },
    {
      source: {parser: 'php'},
      lines: [
        '[12-Mar-2012 10:00:00 UTC] ' + runId,
        '[12-Mar-2012 11:00:00 UTC] ' + runId
      ]
    }
  ];
  var expected = {php: {count: 2}, json: {count: 1}};
  job.verifyTimeRange(
    test,
    jobName,
    runId,
    strtotime('3/12/2012 09:00:00'),
    strtotime('3/12/2012 12:00:00'),
    logs,
    expected
  );
};
