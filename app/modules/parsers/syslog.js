'use strict';

exports.parse = function(log) {
  return require(__dirname + '/parsers').named_capture(
    log,
    ['time', 'host', 'ident', 'pid', 'message'],
    // From fluentd-0.10.9/lib/fluent/parser.rb:
    /^([^ ]*\s*[^ ]* [^ ]*) ([^ ]*) ([a-zA-Z0-9_\/\.\-]*)(?:\[([0-9]+)\])?[^\:]*\: *(.*)$/
  );
};
