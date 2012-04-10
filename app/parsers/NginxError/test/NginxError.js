var testutil = require(__dirname + '/../../testutil.js');

exports.NginxError = {

  setUp: function(callback) { testutil.setUp.apply(this, arguments); },
  tearDown: function(callback) { testutil.tearDown.apply(this, arguments); },

  testParse: function(test) {
    testutil.assertParseValid(
      test,
      '2012/02/12 09:03:31 [error] 16939#0: *491 recv() failed (104: Connection reset by peer) while reading response header from upstream, client: 127.0.0.1, server: mainevent, request: "GET /timeline HTTP/1.1", upstream: "fastcgi://unix:/usr/var/run/php-fpm.sock:", host: "mainevent"',
      'NginxError',
      {
        time: '2012/02/12 09:03:31',
        level: 'error',
        errno: '16939#0',
        errstr: '*491 recv() failed (104: Connection reset by peer) while reading response header from upstream',
        client: '127.0.0.1',
        server: 'mainevent',
        method: 'GET',
        path: '/timeline',
        upstream: 'fastcgi://unix:/usr/var/run/php-fpm.sock:',
        host: 'mainevent',
        parser_subtype: 'standard'
      }
    );
    testutil.assertParseValid(
      test,
      '2012/02/05 00:26:21 [error] 18242#0: *1 access forbidden by rule, client: 127.0.0.1, server: mainevent, request: "GET /.htaccess HTTP/1.1", host: "mainevent"',
      'NginxError',
      {
        time: '2012/02/05 00:26:21',
        level: 'error',
        errno: '18242#0',
        errstr: '*1 access forbidden by rule',
        client: '127.0.0.1',
        server: 'mainevent',
        method: 'GET',
        path: '/.htaccess',
        host: 'mainevent',
        parser_subtype: 'no_upstream'
      }
    );
    testutil.assertParseValid(
      test,
      '2012/02/05 00:25:54 [emerg] 18108#0: invalid number of arguments in "server_tokens" directive in /path/to/config:9',
      'NginxError',
      {
        time: '2012/02/05 00:25:54',
        level: 'emerg',
        errno: '18108#0',
        errstr: 'invalid number of arguments in "server_tokens" directive in /path/to/config:9',
        parser_subtype: 'internal'
      }
    );
    test.done();
  },

  testExtractTime: function(test) {
    var parser = testutil.parsers.createInstance('NginxError'),
        log = {time: '2012/03/12 09:03:31'};
    test.equal(parser.extractTime(log), 1331543011000);
    test.done();
  }
};
