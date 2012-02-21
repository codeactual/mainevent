'use strict';

var _ = require('underscore');
var util = require('util');
var parsers = require(__dirname + '/../app/modules/parsers/parsers.js');
var storage = require(__dirname + '/../app/modules/storage/mongodb.js');

var get_parser = function(name) {
  return require(__dirname + '/../app/modules/parsers/' + name + '.js');
};

var verify_parse = function(test, log, parser, expected) {
  var actual = get_parser(parser).parse(log);
  var expected_keys = Object.keys(expected);

  test.equal(Object.keys(actual).length, expected_keys.length);

  expected_keys.forEach(function(key) {
    test.equal(actual[key], expected[key]);
  });
};

exports.testNginxAccess = function(test) {
  verify_parse(
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
  verify_parse(
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
  verify_parse(
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
  verify_parse(
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
  verify_parse(
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
  verify_parse(
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
  verify_parse(
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
  verify_parse(
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
  verify_parse(
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
  parsers.parse_log(source, [message], function(err, doc) {
    storage.get_timeline({ time: time }, function(err, docs) {
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
  var str = '';
  _(10).times(function() { str += '0123456789'; });
  var expected = JSON.stringify(str).substr(0, 80);
  test.equal(get_parser('json').preview(str), expected);
  test.done();
};

exports.testGetPreviewFromTemplate = function(test) {
  var logs = [{
    parser: 'php',
    parser_subtype: 'userdef',
    time: 'Tue Feb 21 10:44:23 UTC',
    message: 'foo'
  }];
  var expected = _.clone(logs);
  expected[0].preview = 'foo';

  test.expect(4);
  parsers.addPreview(logs, function(actual) {
    _.each(_.keys(expected[0]), function(key) {
      console.log(util.format(actual));
      test.equal(actual[0][key], expected[0][key]);
    });
    test.done();
  });
};
