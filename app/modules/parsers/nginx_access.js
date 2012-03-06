'use strict';

exports.parse = function(log) {
  return require(__dirname + '/parsers').named_capture(
    log,
    ['host', 'user', 'time', 'method', 'path', 'code', 'size', 'referer', 'agent'],
    // From fluentd-0.10.9/lib/fluent/parser.rb:
    /^([^ ]*) [^ ]* ([^ ]*) \[([^\]]*)\] "(\S+)(?: +([^ ]*) +\S*)?" ([^ ]*) ([^ ]*)(?: "([^\"]*)" "([^\"]*)")?$/
  );
};

exports.getPreviewContext = function(log) {
  if (log.code) {
    switch (log.code[0]) {
      case '2': log.codeClass = 'success'; break;
      case '3': log.codeClass = 'info'; break;
      case '4': log.codeClass = 'important'; break;
      case '5': log.codeClass = 'important'; break;
    }
  }

  if (log.referer) {
    log.referer = '-' == log.referer ? '' : log.referer;
    log.referer_min = log.referer.replace(/^http(s)?:\/\//, '');
  }
  return log;
};

exports.extractTime = function(date) {
  var matches = date.match(/(\d+)\/([A-Za-z]+)\/(\d{4}):(\d{2}:\d{2}:\d{2} \+\d{4})/);
  var parsable = util.format(
    '%d/%d/%d %s',
    months.indexOf(matches[2]) + 1,
    matches[1],
    matches[3],
    matches[4]
  );
  return Date.parse(parsable);
};
