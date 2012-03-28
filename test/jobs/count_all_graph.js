'use strict';

var testutil = require(__dirname + '/../modules/testutil.js');
var job = require(__dirname + '/../modules/job.js');

requirejs(['shared/Date'], function(DateShared) {
  var strtotime = DateShared.strtotime;

  exports.testCountAllByYear = function(test) {
    test.expect(1);
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'json'},
        lines: [
          '{"time":"03/12/2009 09:00:05","message":"' + run + '"}',
          '{"time":"04/13/2010 10:00:15","message":"' + run + '"}',
          '{"time":"04/23/2010 10:00:20","message":"' + run + '"}',
          '{"time":"05/14/2011 11:00:25","message":"' + run + '"}'
        ]
      }
    ];
    var expected = {};
    expected['2009'] = {count: 1};
    expected['2010'] = {count: 2};
    expected['2011'] = {count: 1};
    job.verifyJob(
      test,
      __filename,
      logs,
      expected,
      strtotime('03/12/2009 09:00:00'),
      strtotime('05/15/2011 12:00:00'),
      'year',
      {message: run}
    );
  };

  exports.testCountAllByMonth = function(test) {
    test.expect(1);
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'json'},
        lines: [
          '{"time":"03/12/2009 09:00:05","message":"' + run + '"}',
          '{"time":"04/13/2009 10:00:15","message":"' + run + '"}',
          '{"time":"04/23/2009 10:00:20","message":"' + run + '"}',
          '{"time":"05/14/2009 11:00:25","message":"' + run + '"}'
        ]
      }
    ];
    var expected = {};
    expected['2009-03'] = {count: 1};
    expected['2009-04'] = {count: 2};
    expected['2009-05'] = {count: 1};
    job.verifyJob(
      test,
      __filename,
      logs,
      expected,
      strtotime('03/12/2009 09:00:00'),
      strtotime('05/15/2009 12:00:00'),
      'month',
      {message: run}
    );
  };

  exports.testCountAllByDay = function(test) {
    test.expect(1);
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'json'},
        lines: [
          '{"time":"03/12/2009 09:00:05","message":"' + run + '"}',
          '{"time":"03/13/2009 10:00:15","message":"' + run + '"}',
          '{"time":"03/13/2009 10:00:20","message":"' + run + '"}',
          '{"time":"03/14/2009 11:00:25","message":"' + run + '"}'
        ]
      }
    ];
    var expected = {};
    expected['03/12/2009 00:00:00'] = {count: 1};
    expected['03/13/2009 00:00:00'] = {count: 2};
    expected['03/14/2009 00:00:00'] = {count: 1};
    job.verifyJob(
      test,
      __filename,
      logs,
      expected,
      strtotime('03/12/2009 09:00:00'),
      strtotime('03/15/2009 12:00:00'),
      'day',
      {message: run}
    );
  };

  exports.testCountAllByHour = function(test) {
    test.expect(1);
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'json'},
        lines: [
          '{"time":"03/12/2009 09:00:05","message":"' + run + '"}',
          '{"time":"03/12/2009 10:00:15","message":"' + run + '"}',
          '{"time":"03/12/2009 10:00:20","message":"' + run + '"}',
          '{"time":"03/12/2009 11:00:25","message":"' + run + '"}'
        ]
      }
    ];
    var expected = {};
    expected['03/12/2009 09:00:00'] = {count: 1};
    expected['03/12/2009 10:00:00'] = {count: 2};
    expected['03/12/2009 11:00:00'] = {count: 1};
    job.verifyJob(
      test,
      __filename,
      logs,
      expected,
      strtotime('03/12/2009 09:00:00'),
      strtotime('03/12/2009 12:00:00'),
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
          '{"time":"03/12/2009 09:00:05","message":"' + run + '"}',
          '{"time":"03/12/2009 09:05:15","message":"' + run + '"}',
          '{"time":"03/12/2009 09:05:20","message":"' + run + '"}',
          '{"time":"03/12/2009 09:10:25","message":"' + run + '"}'
        ]
      }
    ];
    var expected = {};
    expected['03/12/2009 09:00:00'] = {count: 1};
    expected['03/12/2009 09:05:00'] = {count: 2};
    expected['03/12/2009 09:10:00'] = {count: 1};
    job.verifyJob(
      test,
      __filename,
      logs,
      expected,
      strtotime('03/12/2009 09:00:00'),
      strtotime('03/12/2009 10:00:00'),
      'minute',
      {message: run}
    );
  };
});
