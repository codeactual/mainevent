/**
 * Test MongoDB API.
 */

'use strict';

var testutil = require(__dirname + '/modules/testutil.js'),
    parsers = diana.requireModule('parsers/parsers'),
    mongodb = diana.requireModule('mongodb').createInstance();

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
    mongodb.getTimeline(params, function(err, docs) {
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
    mongodb.getTimeline(params, function(err, docs, info) {
      test.equal(docs.length, 3);
      test.ok(false === info.prevPage);

      // Expect a previous page.
      params.skip = 1;
      mongodb.getTimeline(params, function(err, docs, info) {
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
    mongodb.getTimeline(params, function(err, docs, info) {
      test.equal(docs.length, 2);
      test.ok(false === info.nextPage);

      // Expect another page.
      params.limit = 1;
      mongodb.getTimeline(params, function(err, docs, info) {
        test.equal(docs.length, 1);
        test.ok(info.nextPage);
        test.done();
      });
    });
  });
};

exports.testParseObjectId = function(test) {
  var id = '4f72b1a766408a452b000003';
  test.deepEqual(mongodb.parseObjectId(id), {
    time: 1332916647,
    machine: 6701194,
    pid: 17707,
    increment: 3
  });
  test.done();
};
/*
  test.deepEqual(
    [
      '4f72b1a7 66408a 452b 000001',
      '4f72b1a7 66408a 452b 000001',
      '4f72b1a7 66408a 452b 000001',
      '4f72b1a7 66408a 452b 000001'
    ].sort(mongodb.sortObjectIdAsc),
    [
      '4f72b1a7 66408a 452b 000001',
      '4f72b1a7 66408a 452b 000001',
      '4f72b1a7 66408a 452b 000001',
      '4f72b1a7 66408a 452b 000001'
    ]
  );
*/
exports.testSortObjectIdAsc = function(test) {
  // Only 'increment' parts are unsorted.
  test.deepEqual(
    [
      '4f72b1a766408a452b000002',
      '4f72b1a766408a452b000006',
      '4f72b1a766408a452b000003',
      '4f72b1a766408a452b000001'
    ].sort(mongodb.sortObjectIdAsc),
    [
      '4f72b1a766408a452b000001',
      '4f72b1a766408a452b000002',
      '4f72b1a766408a452b000003',
      '4f72b1a766408a452b000006'
    ]
  );
  // Only 'pid' parts are unsorted.
  test.deepEqual(
    [
      '4f72b1a766408a4522000001',
      '4f72b1a766408a4526000001',
      '4f72b1a766408a4523000001',
      '4f72b1a766408a4521000001'
    ].sort(mongodb.sortObjectIdAsc),
    [
      '4f72b1a766408a4521000001',
      '4f72b1a766408a4522000001',
      '4f72b1a766408a4523000001',
      '4f72b1a766408a4526000001'
    ]
  );
  // Only 'machine' parts are unsorted.
  test.deepEqual(
    [
      '4f72b1a7664082452b000001',
      '4f72b1a7664086452b000001',
      '4f72b1a7664083452b000001',
      '4f72b1a7664081452b000001'
    ].sort(mongodb.sortObjectIdAsc),
    [
      '4f72b1a7664081452b000001',
      '4f72b1a7664082452b000001',
      '4f72b1a7664083452b000001',
      '4f72b1a7664086452b000001'
    ]
  );
  // Only 'time' parts are unsorted.
  test.deepEqual(
    [
      '4f72b1a266408a452b000001',
      '4f72b1a666408a452b000001',
      '4f72b1a366408a452b000001',
      '4f72b1a166408a452b000001'
    ].sort(mongodb.sortObjectIdAsc),
    [
      '4f72b1a166408a452b000001',
      '4f72b1a266408a452b000001',
      '4f72b1a366408a452b000001',
      '4f72b1a666408a452b000001'
    ]
  );
  test.done();
};
