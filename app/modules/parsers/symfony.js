'use strict';

exports.parse = function(log) {
  return require(__dirname + '/parsers').candidate_capture(log, [
    {
      'names': ['time', 'type', 'level', 'event', 'listener'],
      'regex' : /^\[([^\]]+)\] ([^\.]+)\.([^:]+): Notified event "([^\"]*)" to listener "([^\"]*)"/,
      subtype: 'event_debug'
    },
    {
      'names': ['time', 'type', 'level', 'class', 'message', 'file', 'line'],
      'regex' : /^\[([^\]]*)\] ([^\.]+)\.([^:]+): ([^:]+):(?: (.*) at )(?:(\/.*) line )(\d+)/,
      subtype: 'uncaught_exception'
    }
  ]);
};
