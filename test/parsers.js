'use strict';

var util = require('util');

var verify_parse = function(test, log, parser, expected) {
  var actual = require('../app/modules/parsers/' + parser + '.js').parse(log);
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
      host: 'diana'
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
      listener: 'Symfony\Bundle\SecurityBundle\EventListener\ResponseListener::onKernelResponse'
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
      line: '8024'
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
      line: '2'
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
      message: 'something terrible happened'
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
