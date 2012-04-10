'use strict';

var testutil = require(__dirname + '/../modules/testutil.js');
var jobutil = require(__dirname + '/../modules/job.js');

var strtotime = mainevent.shared.Date.strtotime;

exports.job = {
  setUp: function(callback) {
    this.namespace = 'test';
    this.job = new (mainevent.requireJob(__filename).getClass())(this.namespace);
    callback();
  },

  tearDown: function(callback) {
    delete this.job;
    callback();
  },

  testCountAllByYear: function(test) {
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'Json'},
        lines: [
          '{"time":"03/12/2009 09:00:05","message":"' + run + '"}',
          '{"time":"04/13/2010 10:00:15","message":"' + run + '"}',
          '{"time":"04/23/2010 10:00:20","message":"' + run + '"}',
          '{"time":"05/14/2011 11:00:25","message":"' + run + '"}'
        ]
      }
    ];
    var expected = {};
    expected['2009-03'] = {count: 1};
    expected['2010-04'] = {count: 2};
    expected['2011-05'] = {count: 1};

    this.job.updateOptions({partition: 'month'});

    jobutil.verifyJob(
      test,
      this.job,
      logs,
      expected,
      {
        'time-gte': strtotime('03/12/2009 09:00:00'),
        'time-lte': strtotime('05/15/2011 12:00:00'),
        message: run
      }
    );
  },

  testCountAllByMonth: function(test) {
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'Json'},
        lines: [
          '{"time":"03/12/2009 09:00:05","message":"' + run + '"}',
          '{"time":"04/13/2009 10:00:15","message":"' + run + '"}',
          '{"time":"04/23/2009 10:00:20","message":"' + run + '"}',
          '{"time":"05/14/2009 11:00:25","message":"' + run + '"}'
        ]
      }
    ];
    var expected = {};
    expected['03/12/2009 00:00:00'] = {count: 1};
    expected['04/13/2009 00:00:00'] = {count: 1};
    expected['04/23/2009 00:00:00'] = {count: 1};
    expected['05/14/2009 00:00:00'] = {count: 1};

    this.job.updateOptions({partition: 'day'});

    jobutil.verifyJob(
      test,
      this.job,
      logs,
      expected,
      {
        'time-gte': strtotime('03/12/2009 09:00:00'),
        'time-lte': strtotime('05/15/2009 12:00:00'),
        message: run
      }
    );
  },

  testCountAllByDay: function(test) {
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'Json'},
        lines: [
          '{"time":"03/12/2009 09:00:05","message":"' + run + '"}',
          '{"time":"03/13/2009 10:00:15","message":"' + run + '"}',
          '{"time":"03/13/2009 10:00:20","message":"' + run + '"}',
          '{"time":"03/14/2009 11:00:25","message":"' + run + '"}'
        ]
      }
    ];
    var expected = {};
    expected['03/12/2009 09:00'] = {count: 1};
    expected['03/13/2009 10:00'] = {count: 2};
    expected['03/14/2009 11:00'] = {count: 1};

    this.job.updateOptions({partition: 'hour'});

    jobutil.verifyJob(
      test,
      this.job,
      logs,
      expected,
      {
        'time-gte': strtotime('03/12/2009 09:00:00'),
        'time-lte': strtotime('03/15/2009 12:00:00'),
        message: run
      }
    );
  },

  testCountAllByHour: function(test) {
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'Json'},
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

    this.job.updateOptions({partition: 'minute'});

    jobutil.verifyJob(
      test,
      this.job,
      logs,
      expected,
      {
        'time-gte': strtotime('03/12/2009 09:00:00'),
        'time-lte': strtotime('03/12/2009 12:00:00'),
        message: run
      }
    );
  },

  testCountAllByMinute: function(test) {
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'Json'},
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

    this.job.updateOptions({partition: 'minute'});

    jobutil.verifyJob(
      test,
      this.job,
      logs,
      expected,
      {
        'time-gte': strtotime('03/12/2009 09:00:00'),
        'time-lte': strtotime('03/12/2009 10:00:00'),
        message: run
      }
    );
  },

  testCountAllBySecond: function(test) {
    var run = testutil.getRandHash();
    var logs = [
      {
        source: {parser: 'Json'},
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

    this.job.updateOptions({partition: 'second'});

    jobutil.verifyJob(
      test,
      this.job,
      logs,
      expected,
      {
        'time-gte': strtotime('03/12/2009 09:05:00'),
        'time-lte': strtotime('03/12/2009 09:06:00'),
        message: run
      }
    );
  },

  testGetCacheExpires: function(test) {
    var now = (new Date()).getTime();

    test.equal(60, this.job.getExpires({}, now));

    test.equal(60, this.job.getExpires({'time-lte': now - 59999}, now));
    test.equal(60, this.job.getExpires({'time-lte': now - 60000}, now));
    test.equal(null, this.job.getExpires({'time-lte': now - 60001}, now));

    test.equal(60, this.job.getExpires({'time-lte': now + 59999}, now));
    test.equal(60, this.job.getExpires({'time-lte': now + 60000}, now));
    test.equal(null, this.job.getExpires({'time-lte': now + 60001}, now));
    test.done();
  },

  testBuildSortedSetKey: function(test) {
    this.job.updateKeyFields({parser: 'Json'});
    this.job.updateOptions({partition: 'hour'});

    test.equal(
      this.job.buildSortedSetKey('Json', 'hour'),
      this.namespace + ':CountAllPartitioned:Json:hour'
    );
    test.done();
  },

  testBuildHashKey: function(test) {
    this.job.updateKeyFields({parser: 'Json'});
    this.job.updateOptions({partition: 'hour'});

    test.equal(
      this.job.buildHashKey('2012-02'),
      this.namespace + ':CountAllPartitioned:Json:hour:result:2012-02'
    );
    test.done();
  }
};
