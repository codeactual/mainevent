'use strict';

var testutil = require(__dirname + '/../modules/testutil.js');
var job = require(__dirname + '/../modules/job.js');

requirejs(['shared/Date'], function(DateShared) {
  var strtotime = DateShared.strtotime;

  exports.testCountAllByHour = function(test) {
    test.expect(1);
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'json'},
        lines: [
          '{"time":"03/12/2012 09:00:05","message":"' + run + '"}',
          '{"time":"03/12/2012 10:00:15","message":"' + run + '"}',
          '{"time":"03/12/2012 10:00:20","message":"' + run + '"}',
          '{"time":"03/12/2012 11:00:25","message":"' + run + '"}'
        ]
      }
    ];
    var expected = {};
    expected['03/12/2012 09:00:00'] = {count: 1};
    expected['03/12/2012 10:00:00'] = {count: 2};
    expected['03/12/2012 11:00:00'] = {count: 1};
    job.verifyJob(
      test,
      __filename,
      logs,
      expected,
      strtotime('03/12/2012 09:00:00'),
      strtotime('03/12/2012 12:00:00'),
      'hour',
      {message: run}
    );
  };

  exports.testCountAllByMinute = function(test) {
    test.expect(1);
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'json'},
        lines: [
          '{"time":"03/12/2012 09:00:05","message":"' + run + '"}',
          '{"time":"03/12/2012 09:05:15","message":"' + run + '"}',
          '{"time":"03/12/2012 09:05:20","message":"' + run + '"}',
          '{"time":"03/12/2012 09:10:25","message":"' + run + '"}'
        ]
      }
    ];
    var expected = {};
    expected['03/12/2012 09:00:00'] = {count: 1};
    expected['03/12/2012 09:05:00'] = {count: 2};
    expected['03/12/2012 09:10:00'] = {count: 1};
    job.verifyJob(
      test,
      __filename,
      logs,
      expected,
      strtotime('03/12/2012 09:00:00'),
      strtotime('03/12/2012 10:00:00'),
      'minute',
      {message: run}
    );
  };
});
