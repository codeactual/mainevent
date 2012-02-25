/**
 * Test parsing helpers and modules.
 */

'use strict';

var testutil = require(__dirname + '/modules/testutil.js');
var parsers = helpers.requireModule('parsers/parsers');
var storage = helpers.requireModule('storage/storage').load();

/**
 * Verification logic used by most test cases below.
 *
 * @param test {Object} Instance injected into the calling case function.
 * @param log {String} Log line.
 * @param parser {String} Ex. 'nginx_access'.
 * @param expected {Object} Attributes from parse result.
 */
var assertParseValid = function(test, log, parser, expected) {
  var actual = parsers.get(parser).parse(log);
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

exports.testSymfonyEventDebug = function(test) {
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
      parser_subtype: 'event_debug'
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

exports.testUnparsable = function(test) {
  var time = new Date().toUTCString();
  var source = { parser: 'php', tags: ['a', 'b'] };
  var message = 'log line with invalid format';
  test.expect(3);
  parsers.parseAndInsert(source, [message], function(err, doc) {
    storage.getTimeline({ time: time }, function(err, docs) {
      test.equal(docs[0].message, message);
      test.deepEqual(docs[0].tags, source.tags);
      test.equal(docs[0].__parse_error, 1);
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
  parsers.addPreview(logs, function(actual) {
    test.equal(actual[0].time, logs[0].time);
    test.equal(actual[0].message, logs[0].message);
    test.equal(actual[0].preview, JSON.stringify(logs[0]).substr(0, 80));
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

  test.expect(6);
  parsers.addPreview(logs, function(actual) {
    _.each(_.keys(expected[0]), function(key) {
      test.equal(actual[0][key], expected[0][key]);
    });
    test.done();
  });
};
