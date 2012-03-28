/**
 * Test storage API.
 */

'use strict';

var testutil = require(__dirname + '/modules/testutil.js');
var parsers = diana.requireModule('parsers/parsers');
var storage = diana.requireModule('storage/storage').createInstance();

var strtotime = diana.shared.Date.strtotime;

/**
 * Assertion helper for $gte, $gt, $lt, $lte, $ne search filters.
 *
 * @param test {Object} Test instance.
 * @param logs {Array} Log objects.
 * @param params {Array} getTimeline() filters.
 * @param expected {Array} Expected getTimeline() results (order-sensitive).
 */
var verifyTimelineResults = function(test, logs, params, expected) {
  var source = {parser: 'json'};
  var parser = parsers.createInstance('json');

  var lines = [];
  _.each(logs, function(log) {
    lines.push(JSON.stringify(log));
  });

  test.expect(1);
  parsers.parseAndInsert({source: source, lines: lines}, function() {
    storage.getTimeline(params, function(err, docs) {
      var actual = [];
      _.each(expected, function(time, index) {
        actual.push(docs[index].time);
      });
      test.deepEqual(testutil.sortNum(actual), testutil.sortNum(expected));
      test.done();
    });
  });
};

exports.testGetTimelineGte = function(test) {
  var run = testutil.getRandHash();  // Only for verification lookup.
  var logs =[
    {time: "3/12/2012 09:00:00", run: run},
    {time: "3/12/2012 10:00:00", run: run},
    {time: "3/12/2012 11:00:00", run: run}
  ];
  verifyTimelineResults(
    test,
    logs,
    {run: run, 'time-gte': strtotime('3/12/2012 10:00:00')},
    [
      strtotime(logs[1].time),
      strtotime(logs[2].time)
    ]
  );
};

exports.testGetTimelineGt = function(test) {
  var run = testutil.getRandHash();  // Only for verification lookup.
  var logs =[
    {time: "3/12/2012 09:00:00", run: run},
    {time: "3/12/2012 10:00:00", run: run},
    {time: "3/12/2012 11:00:00", run: run}
  ];
  verifyTimelineResults(
    test,
    logs,
    {run: run, 'time-gt': strtotime('3/12/2012 10:00:00')},
    [
      strtotime(logs[2].time)
    ]
  );
};

exports.testGetTimelineLte = function(test) {
  var run = testutil.getRandHash();  // Only for verification lookup.
  var logs =[
    {time: "3/12/2012 09:00:00", run: run},
    {time: "3/12/2012 10:00:00", run: run},
    {time: "3/12/2012 11:00:00", run: run}
  ];
  verifyTimelineResults(
    test,
    logs,
    {run: run, 'time-lte': strtotime('3/12/2012 10:00:00')},
    [
      strtotime(logs[0].time),
      strtotime(logs[1].time)
    ]
  );
};

exports.testGetTimelineLt = function(test) {
  var run = testutil.getRandHash();  // Only for verification lookup.
  var logs =[
    {time: "3/12/2012 09:00:00", run: run},
    {time: "3/12/2012 10:00:00", run: run},
    {time: "3/12/2012 11:00:00", run: run}
  ];
  verifyTimelineResults(
    test,
    logs,
    {run: run, 'time-lt': strtotime('3/12/2012 10:00:00')},
    [
      strtotime(logs[0].time)
    ]
  );
};

exports.testGetTimelineNe = function(test) {
  var run = testutil.getRandHash();  // Only for verification lookup.
  var logs =[
    {time: "3/12/2012 09:00:00", run: run},
    {time: "3/12/2012 10:00:00", run: run},
    {time: "3/12/2012 11:00:00", run: run}
  ];
  verifyTimelineResults(
    test,
    logs,
    {run: run, 'time-ne': strtotime('3/12/2012 10:00:00')},
    [
      strtotime(logs[0].time),
      strtotime(logs[2].time)
    ]
  );
};

exports.testGetTimelineWithTwoTimeConditions = function(test) {
  var run = testutil.getRandHash();  // Only for verification lookup.
  var logs =[
    {time: "3/12/2012 09:00:00", run: run},
    {time: "3/12/2012 10:00:00", run: run},
    {time: "3/12/2012 11:00:00", run: run}
  ];
  verifyTimelineResults(
    test,
    logs,
    {
      run: run,
      'time-gt': strtotime('3/12/2012 09:00:00'),
      'time-ne': strtotime('3/12/2012 10:00:00')
    },
    [
      strtotime(logs[2].time)
    ]
  );
};

exports.testPrevPageDetection = function(test) {
  var source = {parser: 'json'};
  var parser = parsers.createInstance('json');
  var run = testutil.getRandHash();  // Only for verification lookup.
  var logs =[
    {time: "3/12/2012 09:00:00", run: run},
    {time: "3/12/2012 10:00:00", run: run},
    {time: "3/12/2012 11:00:00", run: run}
  ];

  var lines = [];
  _.each(logs, function(log) {
    lines.push(JSON.stringify(log));
  });

  test.expect(4);
  parsers.parseAndInsert({source: source, lines: lines}, function() {

    // Expect no next page.
    var params = {run: run};
    storage.getTimeline(params, function(err, docs, info) {
      test.equal(docs.length, 3);
      test.ok(false === info.prevPage);

      // Expect a previous page.
      params.skip = 1;
      storage.getTimeline(params, function(err, docs, info) {
        test.equal(docs.length, 2);
        test.ok(info.prevPage);
        test.done();
      });
    });
  });
};

exports.testNextPageDetection = function(test) {
  var source = {parser: 'json'};
  var parser = parsers.createInstance('json');
  var run = testutil.getRandHash();  // Only for verification lookup.
  var logs = [
    {time: "3/12/2012 09:00:00", run: run},
    {time: "3/12/2012 10:00:00", run: run},
    {time: "3/12/2012 11:00:00", run: run}
  ];

  var lines = [];
  _.each(logs, function(log) {
    lines.push(JSON.stringify(log));
  });

  test.expect(4);
  parsers.parseAndInsert({source: source, lines: lines}, function() {

    // Expect no next page.
    var params = {run: run, 'time-ne': strtotime('3/12/2012 10:00:00')};
    storage.getTimeline(params, function(err, docs, info) {
      test.equal(docs.length, 2);
      test.ok(false === info.nextPage);

      // Expect another page.
      params.limit = 1;
      storage.getTimeline(params, function(err, docs, info) {
        test.equal(docs.length, 1);
        test.ok(info.nextPage);
        test.done();
      });
    });
  });
};
