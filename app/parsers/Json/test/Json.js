var testutil = require(__dirname + '/../../testutil.js');

exports.Json = {

  setUp: function(callback) { testutil.setUp.apply(this, arguments); },
  tearDown: function(callback) { testutil.tearDown.apply(this, arguments); },

  testParse: function(test) {
    testutil.assertParseValid(
      test,
      '{"time":"14-Feb-2012 06:38:38 UTC","message":"something good"}',
      'Json',
      {
        time: '14-Feb-2012 06:38:38 UTC',
        message: 'something good'
      }
    );
    test.done();
  },

  testBuildPreviewText: function(test) {
    // Expand JSON beyond preview truncation.
    var message = '';
    _(10).times(function() { message += '0123456789'; });

    // Example row from DB.
    var logs = [{
      time: 'Tue Feb 21 10:44:23 UTC',
      message: message,
      parser: 'Json'
    }];

    test.expect(3);
    testutil.parsers.buildPreviewTemplateContext(logs, function(actual) {
      test.equal(actual[0].time, logs[0].time);
      test.equal(actual[0].message, logs[0].message);
      test.equal(
        actual[0].preview,
        util.format(
          'time=%s, message=%s, parser=%s',
          logs[0].time, logs[0].message, logs[0].parser
        )
      );
      test.done();
    });
  },

  testCustomTimeAttr: function(test) {
    var testcase = this,
        source = {parser: 'Json', timeAttr: 'logtime'};
        parser = testutil.parsers.createInstance('Json');
        expected = {
          logtime: '3/12/2012 09:03:31 UTC',
          message: 'shutdown succeeded',
          run: testutil.getRandHash()  // Only for verification lookup.
        },
        log = JSON.stringify(expected);

    test.expect(3);
    testutil.parsers.parseAndInsert(this.mongodb, {source: source, lines: log}, function() {
      testcase.mongodb.getTimeline({run: expected.run}, function(err, docs) {
        test.equal(docs[0].message, expected.message);
        test.equal(docs[0].time, 1331543011000);
        test.strictEqual(docs[0].logtime, undefined);
        test.done();
      });
    });
  }
};
