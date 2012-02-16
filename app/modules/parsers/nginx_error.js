'use strict';

exports.parse = function(log) {
  return require('./parsers').named_capture(
    log,
    ['time', 'level', 'errno', 'errstr', 'client', 'server', 'method', 'path', 'upstream', 'host'],
    /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}) \[([^\]]*)\] ([0-9#]*): (?:(.*), client:)(?: (.*), server:)(?: (.*), request:) "(\S+)(?: +([^ ]*) +\S*)?".*upstream: "([^\"]*)", host: "([^\"]*)"/
  );
}
