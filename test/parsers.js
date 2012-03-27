/**
 * Test parsing helpers and modules.
 */

'use strict';

var testutil = require(__dirname + '/modules/testutil.js');
var parsers = diana.requireModule('parsers/parsers');
var storage = diana.requireModule('storage/storage').createInstance();

/**
 * Verification logic used by most test cases below.
 *
 * @param test {Object} Instance injected into the calling case function.
 * @param log {String} Log line.
 * @param parser {String} Ex. 'nginx_access'.
 * @param expected {Object} Attributes from parse result.
 */
var assertParseValid = function(test, log, parser, expected) {
  var actual = parsers.createInstance(parser).parse(log);
  var expectedKeys = Object.keys(expected);

  test.equal(Object.keys(actual).length, expectedKeys.length);

  expectedKeys.forEach(function(key) {
    test.equal(actual[key], expected[key]);
  });
};

exports.testNginxAccess = function(test) {
  assertParseValid(
    test,
    '127.0.0.1 - www [12/Feb/2012:09:03:31 +0000] "GET /timeline HTTP/1.1" 502 166 "http://www.referer.com/" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0"',
    'nginx_access',
    {
      host: '127.0.0.1',
      user: 'www',
      time: '12/Feb/2012:09:03:31 +0000',
      method: 'GET',
      path: '/timeline',
      code: '502',
      size: '166',
      referer: 'http://www.referer.com/',
      agent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:10.0) Gecko/20100101 Firefox/10.0',
    }
  );
  test.done();
};

exports.testNginxError = function(test) {
  assertParseValid(
    test,
    '2012/02/12 09:03:31 [error] 16939#0: *491 recv() failed (104: Connection reset by peer) while reading response header from upstream, client: 127.0.0.1, server: diana, request: "GET /timeline HTTP/1.1", upstream: "fastcgi://unix:/usr/var/run/php-fpm.sock:", host: "diana"',
    'nginx_error',
    {
      time: '2012/02/12 09:03:31',
      level: 'error',
      errno: '16939#0',
      errstr: '*491 recv() failed (104: Connection reset by peer) while reading response header from upstream',
      client: '127.0.0.1',
      server: 'diana',
      method: 'GET',
      path: '/timeline',
      upstream: 'fastcgi://unix:/usr/var/run/php-fpm.sock:',
      host: 'diana',
      parser_subtype: 'standard'
    }
  );
  assertParseValid(
    test,
    '2012/02/05 00:26:21 [error] 18242#0: *1 access forbidden by rule, client: 127.0.0.1, server: diana, request: "GET /.htaccess HTTP/1.1", host: "diana"',
    'nginx_error',
    {
      time: '2012/02/05 00:26:21',
      level: 'error',
      errno: '18242#0',
      errstr: '*1 access forbidden by rule',
      client: '127.0.0.1',
      server: 'diana',
      method: 'GET',
      path: '/.htaccess',
      host: 'diana',
      parser_subtype: 'no_upstream'
    }
  );
  assertParseValid(
    test,
    '2012/02/05 00:25:54 [emerg] 18108#0: invalid number of arguments in "server_tokens" directive in /path/to/config:9',
    'nginx_error',
    {
      time: '2012/02/05 00:25:54',
      level: 'emerg',
      errno: '18108#0',
      errstr: 'invalid number of arguments in "server_tokens" directive in /path/to/config:9',
      parser_subtype: 'internal'
    }
  );
  test.done();
};

exports.testSymfonyEvent = function(test) {
  assertParseValid(
    test,
    '[2012-02-12 09:03:31] event.DEBUG: Notified event "kernel.response" to listener "Symfony\Bundle\SecurityBundle\EventListener\ResponseListener::onKernelResponse". [] []',
    'symfony',
    {
      time: '2012-02-12 09:03:31',
      type: 'event',
      level: 'DEBUG',
      event: 'kernel.response',
      listener: 'Symfony\Bundle\SecurityBundle\EventListener\ResponseListener::onKernelResponse',
      parser_subtype: 'event'
    }
  );
  test.done();
};

exports.testSymfonyUncaughtException = function(test) {
  assertParseValid(
    test,
    '[2012-02-10 10:24:17] request.CRITICAL: Twig_Error_Runtime: Variable "rows" does not exist in "DianaTimelineBundle:Default:index.html.twig" at line 4 (uncaught exception) at /var/dev/diana/app/cache/dev/classes.php line 8024 [] []',
    'symfony',
    {
      time: '2012-02-10 10:24:17',
      type: 'request',
      level: 'CRITICAL',
      class: 'Twig_Error_Runtime',
      message: 'Variable "rows" does not exist in "DianaTimelineBundle:Default:index.html.twig" at line 4 (uncaught exception)',
      file: '/var/dev/diana/app/cache/dev/classes.php',
      line: '8024',
      parser_subtype: 'uncaught_exception'
    }
  );
  test.done();
};

exports.testPhpNotice = function(test) {
  assertParseValid(
    test,
    '[14-Feb-2012 06:38:38 UTC] PHP Notice:  Undefined variable: b in /tmp/errormaker.php on line 2',
    'php',
    {
      time: '14-Feb-2012 06:38:38 UTC',
      level: 'Notice',
      message: 'Undefined variable: b',
      file: '/tmp/errormaker.php',
      line: '2',
      parser_subtype: 'builtin'
    }
  );
  test.done();
};

exports.testPhpUserDefined = function(test) {
  assertParseValid(
    test,
    '[14-Feb-2012 06:38:38 UTC] something terrible happened',
    'php',
    {
      time: '14-Feb-2012 06:38:38 UTC',
      message: 'something terrible happened',
      parser_subtype: 'userdef'
    }
  );
  test.done();
};

exports.testSyslog = function(test) {
  assertParseValid(
    test,
    'Mar  5 21:36:00 diana kernel: [186333.803057] HDMI hot plug event: Pin=3 Presence_Detect=0 ELD_Valid=1',
    'syslog',
    {
      time: 'Mar  5 21:36:00',
      host: 'diana',
      ident: 'kernel',
      pid: null,
      message: '[186333.803057] HDMI hot plug event: Pin=3 Presence_Detect=0 ELD_Valid=1'
    }
  );
  test.done();
};

exports.testJson = function(test) {
  assertParseValid(
    test,
    '{"time":"14-Feb-2012 06:38:38 UTC","message":"something good"}',
    'json',
    {
      time: '14-Feb-2012 06:38:38 UTC',
      message: 'something good'
    }
  );
  test.done();
};

exports.testUnparsableLine = function(test) {
  var time = Math.round((new Date()).getTime());
  var source = {parser: 'php', tags: ['a', 'b']};
  var parser = parsers.createInstance('php');
  var line = testutil.getRandHash();  // Only for verification lookup.
  test.expect(3);
  parsers.parseAndInsert({source: source, lines: line}, function() {
    storage.getTimeline({message: line}, function(err, docs) {
      test.equal(docs[0].time.getTime(), time);
      test.deepEqual(docs[0].tags, source.tags);
      test.equal(docs[0].__parse_error, 'line');
      test.done();
    });
  });
};

exports.testGetPreviewTemplate = function(test) {
  var log = {parser: 'php', parser_subtype: 'userdef'};
  test.equal(parsers.getPreviewTemplate(log), 'preview_php_userdef');
  log = {parser: 'json'};
  test.equal(parsers.getPreviewTemplate(log), 'preview_json');
  test.done();
};

exports.testGetPreviewFromFunction = function(test) {
  // Expand JSON beyond preview truncation.
  var message = '';
  _(10).times(function() { message += '0123456789'; });

  // Example row from DB.
  var logs = [{
    time: 'Tue Feb 21 10:44:23 UTC',
    message: message,
    parser: 'json'
  }];

  test.expect(3);
  parsers.addPreviewContext(logs, function(actual) {
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
};

exports.testGetPreviewFromTemplate = function(test) {
  // Example row from DB.
  var logs = [{
    parser: 'php',
    parser_subtype: 'userdef',
    time: 'Tue Feb 21 10:44:23 UTC',
    message: 'foo'
  }];

  var expected = _.clone(logs);
  expected[0].preview = 'foo';

  test.expect(5);
  parsers.addPreviewContext(logs, function(actual) {
    _.each(_.keys(expected[0]), function(key) {
      test.equal(actual[0][key], expected[0][key]);
    });
    test.done();
  });
};

exports.testCustomTimeAttr = function(test) {
  var source = {parser: 'json', timeAttr: 'logtime'};
  var parser = parsers.createInstance('json');
  var expected = {
    logtime: '3/12/2012 09:03:31 UTC',
    message: 'shutdown succeeded',
    run: testutil.getRandHash()  // Only for verification lookup.
  };
  var log = JSON.stringify(expected);

  test.expect(3);
  parsers.parseAndInsert({source: source, lines: log}, function() {
    storage.getTimeline({run: expected.run}, function(err, docs) {
      test.equal(docs[0].message, expected.message);
      test.equal(docs[0].time.getTime(), 1331543011000);
      test.strictEqual(docs[0].logtime, undefined);
      test.done();
    });
  });
};

exports.testCustomPreviewAttr = function(test) {
  var source = {parser: 'json', previewAttr: ['role']};
  var parser = parsers.createInstance('json');
  var expected = {
    time: '14-Feb-2012 06:38:38 UTC',
    role: 'db-slave',
    message: 'log content',
    run: testutil.getRandHash()  // Only for verification lookup.
  };
  var line = JSON.stringify(expected);

  test.expect(1);
  parsers.parseAndInsert({source: source, lines: line}, function() {
    storage.getTimeline({run: expected.run}, function(err, docs) {
      parsers.addPreviewContext(docs, function(actual) {
        test.equal(actual[0].preview, 'role=db-slave');
        test.done();
      });
    });
  });
};

exports.testNginxAccessExtractTime = function(test) {
  var parser = parsers.createInstance('nginx_access');
  var date = '12/Mar/2012:09:03:31 +0000';
  test.equal(parser.extractTime(date), 1331543011000);
  test.done();
};

exports.testNginxErrorExtractTime = function(test) {
  var parser = parsers.createInstance('nginx_error');
  var date = '2012/03/12 09:03:31';
  test.equal(parser.extractTime(date), 1331543011000);
  test.done();
};

exports.testPhpExtractTime = function(test) {
  var parser = parsers.createInstance('php');
  var date = '12-Mar-2012 09:03:31 UTC';
  test.equal(parser.extractTime(date), 1331543011000);
  test.done();
};

exports.testSymfonyExtractTime = function(test) {
  var parser = parsers.createInstance('symfony');
  var date = '2012-03-12 09:03:31';
  test.equal(parser.extractTime(date), 1331543011000);
  test.done();
};

exports.testSyslogExtractTimeFromCurrentYear = function(test) {
  var parser = parsers.createInstance('syslog');
  var date = 'Mar  12 09:03:31';
  var now = new Date('3/13/2012 00:00:00');
  test.equal(parser.extractTime(date, now), 1331543011000);
  test.done();
}

exports.testSyslogExtractTimeFromPriorYear = function(test) {
  var parser = parsers.createInstance('syslog');
  var date = 'Dec  31 23:03:31';
  var now = new Date('1/01/2012 00:00:00');
  test.equal(parser.extractTime(date, now), 1325372611000);
  test.done();
};

exports.testDirectTimeExtraction = function(test) {
  var source = {parser: 'json', timeAttr: 't'};
  var parser = parsers.createInstance('json');
  var run = testutil.getRandHash();  // Only for verification lookup.
  var log = {t: 1331543011, message: "something happened", run: run};
  test.expect(2);
  parsers.parseAndInsert({source: source, lines: JSON.stringify(log)}, function() {
    storage.getTimeline({run: run}, function(err, docs) {
      test.equal(docs[0].time.getTime(), 1331543011000);
      test.equal(docs[0].message, log.message);
      test.done();
    });
  });
};

exports.testDirectTimeParse = function(test) {
  var source = {parser: 'json', timeAttr: 't'};
  var parser = parsers.createInstance('json');
  var run = testutil.getRandHash();  // Only for verification lookup.
  var log = {t: "3/12/2012 09:03:31", message: "something happened", run: run};
  test.expect(2);
  parsers.parseAndInsert({source: source, lines: JSON.stringify(log)}, function() {
    storage.getTimeline({run: run}, function(err, docs) {
      test.equal(docs[0].time.getTime(), 1331543011000);
      test.equal(docs[0].message, log.message);
      test.done();
    });
  });
};

exports.testExtractedTimeInsertion = function(test) {
  var source = {parser: 'php'};
  var parser = parsers.createInstance('php');
  var run = testutil.getRandHash();  // Only for verification lookup.
  var line = '[12-Mar-2012 09:03:31 UTC] ' + run;

  test.expect(2);
  parsers.parseAndInsert({source: source, lines: line}, function() {
    storage.getTimeline({message: run}, function(err, docs) {
      test.equal(docs[0].message, run);
      test.equal(docs[0].time.getTime(), 1331543011000);
      test.done();
    });
  });
};

exports.testUnparsableTime = function(test) {
  var time = Math.round((new Date()).getTime());
  var source = {parser: 'php', tags: ['a', 'b']};
  var parser = parsers.createInstance('php');
  var message = testutil.getRandHash();  // Only for verification lookup.
  var line = '[invalid time] ' + message;
  test.expect(3);
  parsers.parseAndInsert({source: source, lines: line}, function() {
    storage.getTimeline({message: message}, function(err, docs) {
      test.ok(Math.abs(docs[0].time.getTime() - time) < 1000);
      test.deepEqual(docs[0].tags, source.tags);
      test.equal(docs[0].__parse_error, 'time');
      test.done();
    });
  });
};
