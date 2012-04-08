'use strict';

var testutil = require(__dirname + '/../modules/testutil.js'),
    job = require(__dirname + '/../modules/job.js'),
    strtotime = mainevent.shared.Date.strtotime;

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

  testCountByParser: function(test) {
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
    job.verifyJob(
      test,
      this.job,
      logs,
      expected,
      {
        'time-gte': strtotime('3/12/2012 09:00:00'),
        'time-lte': strtotime('3/12/2012 12:00:00'),
        message: run
      }
    );
  }
};
