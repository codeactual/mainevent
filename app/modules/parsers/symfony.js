'use strict';

exports.parse = function(log) {
  return require('./parsers').candidate_capture(log, [
    // event debug
    {
      'names': ['time', 'type', 'level', 'event', 'listener'],
      'regex' : /^\[([^\]]+)\] ([^\.]+)\.([^:]+): Notified event "([^\"]*)" to listener "([^\"]*)"/
    },
    // uncaught exception
    {
      'names': ['time', 'type', 'level', 'class', 'message', 'file', 'line'],
      'regex' : /^\[([^\]]*)\] ([^\.]+)\.([^:]+): ([^:]+):(?: (.*) at )(?:(\/.*) line )(\d+)/
    }
  ]);
}
