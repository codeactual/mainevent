/**
 * Test parsing helpers and modules.
 */

'use strict';

var testutil = require(__dirname + '/modules/testutil.js');

exports.parsers = {

  setUp: function(callback) { testutil.setUp.apply(this, arguments); },
  tearDown: function(callback) { testutil.tearDown.apply(this, arguments); },

  testUnparsableLine: function(test) {
    var testcase = this,
        time = Math.round((new Date()).getTime()),
        source = {parser: 'Php', tags: ['a', 'b']},
        parser = this.parsers.createInstance('Php'),
        line = testutil.getRandHash();  // Only for verification lookup.
    test.expect(3);
    this.parsers.parseAndInsert(testcase.mongodb, {source: source, lines: line}, function() {
      testcase.mongodb.getTimeline({message: line}, function(err, docs) {
        test.ok(Math.abs(docs[0].time - time) < 1000);
        test.deepEqual(docs[0].tags, source.tags);
        test.equal(docs[0].__parse_error, 'line');
        test.done();
      });
    });
  },

  testGetPreviewTemplate: function(test) {
    var log = {parser: 'Php', parser_subtype: 'UserDefined'};
    test.equal(this.parsers.getPreviewTemplate(log), 'PhpUserDefinedPreview');
    log = {parser: 'Json'};
    test.equal(this.parsers.getPreviewTemplate(log), 'JsonPreview');
    test.done();
  },

  testCustomPreviewAttr: function(test) {
    var testcase = this,
        source = {parser: 'Json', previewAttr: ['role']},
        parser = this.parsers.createInstance('Json'),
        expected = {
          time: '14-Feb-2012 06:38:38 UTC',
          role: 'db-slave',
          message: 'log content',
          run: testutil.getRandHash()  // Only for verification lookup.
        },
        line = JSON.stringify(expected);

    test.expect(1);
    this.parsers.parseAndInsert(testcase.mongodb, {source: source, lines: line}, function() {
      testcase.mongodb.getTimeline({run: expected.run}, function(err, docs) {
        testcase.parsers.buildPreviewTemplateContext(docs, function(actual) {
          test.equal(actual[0].preview, 'role=db-slave');
          test.done();
        });
      });
    });
  },

  testDirectTimeExtraction: function(test) {
    var testcase = this,
        source = {parser: 'Json', timeAttr: 't'},
        parser = this.parsers.createInstance('Json'),
        run = testutil.getRandHash(),  // Only for verification lookup.
        log = {t: 1331543011, message: "something happened", run: run};
    test.expect(2);
    this.parsers.parseAndInsert(testcase.mongodb, {source: source, lines: JSON.stringify(log)}, function() {
      testcase.mongodb.getTimeline({run: run}, function(err, docs) {
        test.equal(docs[0].time, 1331543011000);
        test.equal(docs[0].message, log.message);
        test.done();
      });
    });
  },

  testDirectTimeParse: function(test) {
    var testcase = this,
        source = {parser: 'Json', timeAttr: 't'},
        parser = this.parsers.createInstance('Json'),
        run = testutil.getRandHash(),  // Only for verification lookup.
        log = {t: "3/12/2012 09:03:31", message: "something happened", run: run};
    test.expect(2);
    this.parsers.parseAndInsert(testcase.mongodb, {source: source, lines: JSON.stringify(log)}, function() {
      testcase.mongodb.getTimeline({run: run}, function(err, docs) {
        test.equal(docs[0].time, 1331543011000);
        test.equal(docs[0].message, log.message);
        test.done();
      });
    });
  },

  testExtractedTimeInsertion: function(test) {
    var testcase = this,
        source = {parser: 'Php'},
        parser = this.parsers.createInstance('Php'),
        run = testutil.getRandHash(),  // Only for verification lookup.
        line = '[12-Mar-2012 09:03:31 UTC] ' + run;

    test.expect(2);
    this.parsers.parseAndInsert(testcase.mongodb, {source: source, lines: line}, function() {
      testcase.mongodb.getTimeline({message: run}, function(err, docs) {
        test.equal(docs[0].message, run);
        test.equal(docs[0].time, 1331543011000);
        test.done();
      });
    });
  },

  testUnparsableTime: function(test) {
    var testcase = this,
        time = Math.round((new Date()).getTime()),
        source = {parser: 'Php', tags: ['a', 'b']},
        parser = this.parsers.createInstance('Php'),
        message = testutil.getRandHash(),  // Only for verification lookup.
        line = '[invalid time] ' + message;
    test.expect(3);
    this.parsers.parseAndInsert(testcase.mongodb, {source: source, lines: line}, function() {
      testcase.mongodb.getTimeline({message: message}, function(err, docs) {
        test.ok(Math.abs(docs[0].time - time) < 1000);
        test.deepEqual(docs[0].tags, source.tags);
        test.equal(docs[0].__parse_error, 'time');
        test.done();
      });
    });
  },

  testSplitString: function(test) {
    test.deepEqual(
      this.parsers.splitString("\n\na1\nb1\nfalse\nc1\n\t\n0\n\nd1\ne1\n\t\n"),
      ['a1', 'b1', 'false', 'c1', '0', 'd1', 'e1']
    );
    test.done();
  }
};
