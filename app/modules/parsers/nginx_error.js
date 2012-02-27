'use strict';

exports.parse = function(log) {
  return require(__dirname + '/parsers').candidate_capture(log, [
    {
      // Ex. 2012/02/05 00:19:34 [error] 13816#0: *1 recv() failed (104: Connection reset by peer) while reading response header from upstream, client: 127.0.0.1, server: diana, request: "GET / HTTP/1.1", upstream: "fastcgi://unix:/path/to/php-fpm.sock:", host: "diana"
      names: ['time', 'level', 'errno', 'errstr', 'client', 'server', 'method', 'path', 'upstream', 'host'],
      regex: /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \[([^\]]*)\] ([0-9#]*): (?:(.*), client:)(?: (.*), server:)(?: (.*), request:) "(\S+)(?: +([^ ]*) +\S*)?".*upstream: "([^\"]*)", host: "([^\"]*)"/,
      subtype: 'standard'
    },
    {
      // Ex. 2012/02/05 00:26:21 [error] 18242#0: *1 access forbidden by rule, client: 127.0.0.1, server: diana, request: "GET /.htaccess HTTP/1.1", host: "diana"
      names: ['time', 'level', 'errno', 'errstr', 'client', 'server', 'method', 'path', 'host'],
      regex: /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \[([^\]]*)\] ([0-9#]*): (?:(.*), client:)(?: (.*), server:)(?: (.*), request:) "(\S+)(?: +([^ ]*) +\S*)?".*host: "([^\"]*)"/,
      subtype: 'no_upstream'
    },
    {
      // Ex. 2012/02/05 00:25:54 [emerg] 18108#0: invalid number of arguments in "server_tokens" directive in /path/to/config:9
      names: ['time', 'level', 'errno', 'errstr'],
      regex: /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \[([^\]]*)\] ([0-9#]*): (.*)/,
      subtype: 'internal'
    }
  ]);
};

exports.getPreviewContext = function(log) {
  if (log.level) {
    switch (log.level) {
      case 'debug': log.levelClass = 'info'; break;
      case 'info': log.levelClass = 'info'; break;
      case 'warn': log.levelClass = 'warning'; break;
      default: log.levelClass = 'important'; break;
    }
  }
  return log;
};
