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
  },

  testDetectDelimiter: function(test) {
    var fn = testutil.parsers.createInstance('Json').detectDelimiter;
    test.strictEqual(fn('{"foo"'), -1);
    test.strictEqual(fn('foo\n"}'), 3);
    test.strictEqual(fn('\nfoo"}'), 0);
    test.done();
  },

  testExtractLines: function(test) {
    test.expect(1);

    var rawLines = [
      '{"',
      'key1":"val1',
      '","key',
      '2":"val2","key3"',
      ':"val3"',
      '}\n{"',
      'key4":"val4","key5":',
      '"val5","key6":"val6"}\n{"key7":"val7","key8":"val8","key9":"val9"}\n{"key10":"val10","key11":"val11","key12":"val12"}'
    ];
    var expectedLines = [
      '{"key1":"val1","key2":"val2","key3":"val3"}',
      '{"key4":"val4","key5":"val5","key6":"val6"}',
      '{"key7":"val7","key8":"val8","key9":"val9"}',
      '{"key10":"val10","key11":"val11","key12":"val12"}'
    ];

    var fullLines = [];

    testutil.parsers.extractLines(
      rawLines,
      testutil.parsers.createInstance('Json'),
      function(line, next) {
        fullLines.push(line);
        next();
      },
      function() {
        test.deepEqual(fullLines, expectedLines);
        test.done();
      }
    );
  }
};
