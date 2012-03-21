/**
 * Test storage API.
 */

'use strict';

var testutil = require(__dirname + '/modules/testutil.js');
var parsers = diana.requireModule('parsers/parsers');
var storage = diana.requireModule('storage/storage').load();

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

  test.expect(expected.length + 1);
  parser.parseAndInsert(source, lines, function() {
    storage.getTimeline(params, function(err, docs) {
      test.equal(docs.length, expected.length);
      _.each(expected, function(time, index) {
        test.equal(docs[index].time, time);
      });
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
    {run: run, 'time-gte': diana.shared.Date.strtotime('3/12/2012 10:00:00')},
    [
      diana.shared.Date.strtotime(logs[1].time),
      diana.shared.Date.strtotime(logs[2].time)
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
    {run: run, 'time-gt': diana.shared.Date.strtotime('3/12/2012 10:00:00')},
    [
      diana.shared.Date.strtotime(logs[2].time)
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
    {run: run, 'time-lte': diana.shared.Date.strtotime('3/12/2012 10:00:00')},
    [
      diana.shared.Date.strtotime(logs[0].time),
      diana.shared.Date.strtotime(logs[1].time)
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
    {run: run, 'time-lt': diana.shared.Date.strtotime('3/12/2012 10:00:00')},
    [
      diana.shared.Date.strtotime(logs[0].time)
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
    {run: run, 'time-ne': diana.shared.Date.strtotime('3/12/2012 10:00:00')},
    [
      diana.shared.Date.strtotime(logs[0].time),
      diana.shared.Date.strtotime(logs[2].time)
    ]
  );
};
