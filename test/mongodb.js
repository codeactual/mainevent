/**
 * Test MongoDB API.
 */

'use strict';

var testutil = require(__dirname + '/modules/testutil.js'),
    parsers = mainevent.requireModule('parsers/parsers'),
    config = mainevent.getConfig().mongodb,
    strtotime = mainevent.shared.Date.strtotime;

var setUp = function(callback) {
  this.mongodb = testutil.getTestMongoDb();
  callback();
};

var tearDown = function(callback) {
  delete this.mongodb;
  callback();
};

/**
 * Assertion helper for $gte, $gt, $lt, $lte, $ne search filters.
 *
 * @param test {Object} Test instance.
 * @param mongodb {Object} MongoDb instance.
 * @param logs {Array} Log objects.
 * @param params {Array} getTimeline() filters.
 * @param expected {Array} Expected getTimeline() results (order-sensitive).
*/
var verifyTimelineResults = function(test, mongodb, logs, params, expected) {
  var source = {parser: 'json'},
  parser = parsers.createInstance('json'),
  lines = [];

  _.each(logs, function(log) {
    lines.push(JSON.stringify(log));
  });

  test.expect(1);
  parsers.parseAndInsert(mongodb, {source: source, lines: lines}, function() {
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

exports.timeline = {

  setUp: function(callback) { setUp.apply(this, arguments); },
  tearDown: function(callback) { tearDown.apply(this, arguments); },

  testGetTimelineGte: function(test) {
    var run = testutil.getRandHash();  // Only for verification lookup.
    var logs = [
      {time: "3/12/2012 09:00:00", run: run},
      {time: "3/12/2012 10:00:00", run: run},
      {time: "3/12/2012 11:00:00", run: run}
    ];
    verifyTimelineResults(
      test,
      this.mongodb,
      logs,
      {run: run, 'time-gte': strtotime('3/12/2012 10:00:00')},
      [
        strtotime(logs[1].time),
        strtotime(logs[2].time)
      ]
    );
  },

  testGetTimelineGt: function(test) {
    var run = testutil.getRandHash();  // Only for verification lookup.
    var logs = [
      {time: "3/12/2012 09:00:00", run: run},
      {time: "3/12/2012 10:00:00", run: run},
      {time: "3/12/2012 11:00:00", run: run}
    ];
    verifyTimelineResults(
      test,
      this.mongodb,
      logs,
      {run: run, 'time-gt': strtotime('3/12/2012 10:00:00')},
      [
        strtotime(logs[2].time)
      ]
    );
  },

  testGetTimelineLte: function(test) {
    var run = testutil.getRandHash();  // Only for verification lookup.
    var logs = [
      {time: "3/12/2012 09:00:00", run: run},
      {time: "3/12/2012 10:00:00", run: run},
      {time: "3/12/2012 11:00:00", run: run}
    ];
    verifyTimelineResults(
      test,
      this.mongodb,
      logs,
      {run: run, 'time-lte': strtotime('3/12/2012 10:00:00')},
      [
        strtotime(logs[0].time),
        strtotime(logs[1].time)
      ]
    );
  },

  testGetTimelineLt: function(test) {
    var run = testutil.getRandHash();  // Only for verification lookup.
    var logs = [
      {time: "3/12/2012 09:00:00", run: run},
      {time: "3/12/2012 10:00:00", run: run},
      {time: "3/12/2012 11:00:00", run: run}
    ];
    verifyTimelineResults(
      test,
      this.mongodb,
      logs,
      {run: run, 'time-lt': strtotime('3/12/2012 10:00:00')},
      [
        strtotime(logs[0].time)
      ]
    );
  },

  testGetTimelineNe: function(test) {
    var run = testutil.getRandHash();  // Only for verification lookup.
    var logs = [
      {time: "3/12/2012 09:00:00", run: run},
      {time: "3/12/2012 10:00:00", run: run},
      {time: "3/12/2012 11:00:00", run: run}
    ];
    verifyTimelineResults(
      test,
      this.mongodb,
      logs,
      {run: run, 'time-ne': strtotime('3/12/2012 10:00:00')},
      [
        strtotime(logs[0].time),
        strtotime(logs[2].time)
      ]
    );
  },

  testGetTimelineWithTwoTimeConditions: function(test) {
    var run = testutil.getRandHash();  // Only for verification lookup.
    var logs = [
      {time: "3/12/2012 09:00:00", run: run},
      {time: "3/12/2012 10:00:00", run: run},
      {time: "3/12/2012 11:00:00", run: run}
    ];
    verifyTimelineResults(
      test,
      this.mongodb,
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
  },

  testPrevPageDetection: function(test) {
    var testcase = this,
        source = {parser: 'json'},
        parser = parsers.createInstance('json'),
        run = testutil.getRandHash(),  // Only for verification lookup.
        logs = [
          {time: "3/12/2012 09:00:00", run: run},
          {time: "3/12/2012 10:00:00", run: run},
          {time: "3/12/2012 11:00:00", run: run}
        ],
        lines = [];

    _.each(logs, function(log) {
      lines.push(JSON.stringify(log));
    });

    test.expect(4);
    parsers.parseAndInsert(testcase.mongodb, {source: source, lines: lines}, function() {

      // Expect no next page.
      var params = {run: run};
      testcase.mongodb.getTimeline(params, function(err, docs, info) {
        test.equal(docs.length, 3);
        test.ok(false === info.prevPage);

        // Expect a previous page.
        params.skip = 1;
        testcase.mongodb.getTimeline(params, function(err, docs, info) {
          test.equal(docs.length, 2);
          test.ok(info.prevPage);
          test.done();
        });
      });
    });
  },

  testNextPageDetection: function(test) {
    var testcase = this,
        source = {parser: 'json'},
        parser = parsers.createInstance('json'),
        run = testutil.getRandHash(),  // Only for verification lookup.
        logs = [
          {time: "3/12/2012 09:00:00", run: run},
          {time: "3/12/2012 10:00:00", run: run},
          {time: "3/12/2012 11:00:00", run: run}
        ],
        lines = [];

    _.each(logs, function(log) {
      lines.push(JSON.stringify(log));
    });

    test.expect(4);
    parsers.parseAndInsert(testcase.mongodb, {source: source, lines: lines}, function() {

      // Expect no next page.
      var params = {run: run, 'time-ne': strtotime('3/12/2012 10:00:00')};
      testcase.mongodb.getTimeline(params, function(err, docs, info) {
        test.equal(docs.length, 2);
        test.ok(false === info.nextPage);

        // Expect another page.
        params.limit = 1;
        testcase.mongodb.getTimeline(params, function(err, docs, info) {
          test.equal(docs.length, 1);
          test.ok(info.nextPage);
          test.done();
        });
      });
    });
  }
};

exports.dataTypes = {

  setUp: function(callback) { setUp.apply(this, arguments); },
  tearDown: function(callback) { tearDown.apply(this, arguments); },

  testParseObjectId: function(test) {
    var id = '4f72b1a766408a452b000003';
    test.deepEqual(this.mongodb.parseObjectId(id), {
      time: 1332916647,
      machine: 6701194,
      pid: 17707,
      increment: 3
    });
    test.done();
  },

  testSortObjectIdAsc: function(test) {
    // Only the increments differ, so expect an order based on them.
    test.deepEqual(
      [
        '4f72b1a766408a452b000002',
        '4f72b1a766408a452b000006',
        '4f72b1a766408a452b000003',
        '4f72b1a766408a452b000001'
      ].sort(this.mongodb.sortObjectIdAsc),
      [
        '4f72b1a766408a452b000001',
        '4f72b1a766408a452b000002',
        '4f72b1a766408a452b000003',
        '4f72b1a766408a452b000006'
      ]
    );
    // PIDs differ, so expect an unchanged order because their separate
    // increments can't tie-break.
    test.deepEqual(
      [
        '4f72b1a766408a4522000001',
        '4f72b1a766408a4526000001',
        '4f72b1a766408a4523000001',
        '4f72b1a766408a4521000001'
      ].sort(this.mongodb.sortObjectIdAsc),
      [
        '4f72b1a766408a4522000001',
        '4f72b1a766408a4526000001',
        '4f72b1a766408a4523000001',
        '4f72b1a766408a4521000001'
      ]
    );
    // Machines differ, so expect an unchanged order because their separate
    // times/PIDs/increments can't tie-break.
    test.deepEqual(
      [
        '4f72b1a7664082452b000001',
        '4f72b1a7664086452b000001',
        '4f72b1a7664083452b000001',
        '4f72b1a7664081452b000001'
      ].sort(this.mongodb.sortObjectIdAsc),
      [
        '4f72b1a7664082452b000001',
        '4f72b1a7664086452b000001',
        '4f72b1a7664083452b000001',
        '4f72b1a7664081452b000001'
      ]
    );
    // Only the times differ, so expect an order based on them.
    test.deepEqual(
      [
        '4f72b1a266408a452b000001',
        '4f72b1a666408a452b000001',
        '4f72b1a366408a452b000001',
        '4f72b1a166408a452b000001'
      ].sort(this.mongodb.sortObjectIdAsc),
      [
        '4f72b1a166408a452b000001',
        '4f72b1a266408a452b000001',
        '4f72b1a366408a452b000001',
        '4f72b1a666408a452b000001'
      ]
    );
    test.done();
  },

  testNumberConversion: function(test) {
    test.expect(5);

    var testcase = this,
        run = testutil.getRandHash(),  // Only for verification lookup.
        logs = [{
          run: run,
          parser: 'json',
          time: '3/12/2012 11:00:00',
          num0: '300',
          num1: '300.31',
          num2: '0.31',
          notNum0: 'd300',
          notNum1: '300d'
        }];

    testcase.mongodb.insertLog(logs, function(err) {
      testcase.mongodb.getTimeline({run: run}, function(err, docs, info) {
        test.strictEqual(docs[0].num0, 300);
        test.strictEqual(docs[0].num1, 300.31);
        test.strictEqual(docs[0].num2, 0.31);
        test.strictEqual(docs[0].notNum0, 'd300');
        test.strictEqual(docs[0].notNum1, '300d');
        test.done();
      });
    });
  }
};

exports.events = {

  setUp: function(callback) { setUp.apply(this, arguments); },
  tearDown: function(callback) { tearDown.apply(this, arguments); },

  testEmitInsertLog: function(test) {
    test.expect(4);

    var testcase = this,
        run = testutil.getRandHash(),  // Only for verification lookup.
        expected = [{run: run, parser: 'json', time: '3/12/2012 11:00:00'}];

    testcase.mongodb.on('InsertLog', function(actual) {
      test.equal(actual.length, 1);
      test.equal(actual[0].run, expected[0].run);
      test.equal(actual[0].parser, expected[0].parser);
      test.equal(actual[0].time, expected[0].time);
      test.done();
    });

    testcase.mongodb.insertLog(expected);
  },

  testAttachConfiguredListeners: function(test) {
    test.expect(4);

    var testcase = this,
        instanceConfig = _.clone(config),
        run = testutil.getRandHash(),  // Only for verification lookup.
        expected = [{run: run, parser: 'json', time: '3/12/2012 11:00:00'}];

    // Only use one listener which will process.emit() the logs it received.
    instanceConfig.listeners = [{
      event: 'InsertLog',
      enabled: true,
      subscribers: [
        __dirname + '/fixtures/InsertLogListener.js'
      ],
    }];

    process.on('InsertLogListener', function(actual) {
      test.equal(actual.length, 1);
      test.equal(actual[0].run, expected[0].run);
      test.equal(actual[0].parser, expected[0].parser);
      test.equal(actual[0].time, expected[0].time);
      test.done();
    });

    mainevent.requireModule('mongodb').createInstance(instanceConfig).insertLog(expected);
  }
};
