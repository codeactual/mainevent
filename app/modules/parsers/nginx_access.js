'use strict';

exports.parse = function(log) {
  return require('./parsers').named_capture(
    log,
    ['host', 'user', 'time', 'method', 'path', 'code', 'size', 'referer', 'agent'],
    // From fluentd-0.10.9/lib/fluent/parser.rb:
    /^([^ ]*) [^ ]* ([^ ]*) \[([^\]]*)\] "(\S+)(?: +([^ ]*) +\S*)?" ([^ ]*) ([^ ]*)(?: "([^\"]*)" "([^\"]*)")?$/
  );
};
