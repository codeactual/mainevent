'use strict';

var testutil = require(__dirname + '/../modules/testutil.js');
var job = require(__dirname + '/../modules/job.js');

var strtotime = diana.shared.Date.strtotime;

exports.testCountAllByYear = function(test) {
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
    {
      'time-gte': strtotime('03/12/2009 09:00:00'),
      'time-lte': strtotime('05/15/2011 12:00:00'),
      message: run,
      interval: 'year'
    }
  );
};

exports.testCountAllByMonth = function(test) {
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
    {
      'time-gte': strtotime('03/12/2009 09:00:00'),
      'time-lte': strtotime('05/15/2009 12:00:00'),
      message: run,
      interval: 'month'
    }
  );
};

exports.testCountAllByDay = function(test) {
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
    {
      'time-gte': strtotime('03/12/2009 09:00:00'),
      'time-lte': strtotime('03/15/2009 12:00:00'),
      message: run,
      interval: 'day'
    }
  );
};

exports.testCountAllByHour = function(test) {
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
  expected['03/12/2009 09:00'] = {count: 1};
  expected['03/12/2009 10:00'] = {count: 2};
  expected['03/12/2009 11:00'] = {count: 1};
  job.verifyJob(
    test,
    __filename,
    logs,
    expected,
    {
      'time-gte': strtotime('03/12/2009 09:00:00'),
      'time-lte': strtotime('03/12/2009 12:00:00'),
      message: run,
      interval: 'hour'
    }
  );
};

exports.testCountAllByMinute = function(test) {
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
    {
      'time-gte': strtotime('03/12/2009 09:00:00'),
      'time-lte': strtotime('03/12/2009 10:00:00'),
      message: run,
      interval: 'minute'
    }
  );
};

exports.testCountAllBySecond = function(test) {
  var run = testutil.getRandHash();
  var logs = [
    {
      source: {parser: 'json'},
      lines: [
        '{"time":"03/12/2009 09:05:05","message":"' + run + '"}',
        '{"time":"03/12/2009 09:05:20","message":"' + run + '"}',
        '{"time":"03/12/2009 09:05:20","message":"' + run + '"}',
        '{"time":"03/12/2009 09:05:25","message":"' + run + '"}'
      ]
    }
  ];
  var expected = {};
  expected['03/12/2009 09:05:05'] = {count: 1};
  expected['03/12/2009 09:05:20'] = {count: 2};
  expected['03/12/2009 09:05:25'] = {count: 1};
  job.verifyJob(
    test,
    __filename,
    logs,
    expected,
    {
      'time-gte': strtotime('03/12/2009 09:05:00'),
      'time-lte': strtotime('03/12/2009 09:06:00'),
      message: run,
      interval: 'second'
    }
  );
};

exports.testGetCacheExpires = function(test) {
  var job = new (diana.requireJob(__filename).getClass()),
      now = (new Date()).getTime();

  test.equal(60, job.getExpires({}, now));

  test.equal(60, job.getExpires({'time-lte': now - 59999}, now));
  test.equal(60, job.getExpires({'time-lte': now - 60000}, now));
  test.equal(null, job.getExpires({'time-lte': now - 60001}, now));

  test.equal(60, job.getExpires({'time-lte': now + 59999}, now));
  test.equal(60, job.getExpires({'time-lte': now + 60000}, now));
  test.equal(null, job.getExpires({'time-lte': now + 60001}, now));
  test.done();
};
