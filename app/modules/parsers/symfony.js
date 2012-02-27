'use strict';

exports.parse = function(log) {
  return require(__dirname + '/parsers').candidate_capture(log, [
    {
      'names': ['time', 'type', 'level', 'event', 'listener'],
      'regex' : /^\[([^\]]+)\] ([^\.]+)\.([^:]+): Notified event "([^\"]*)" to listener "([^\"]*)"/,
      subtype: 'event'
    },
    {
      'names': ['time', 'type', 'level', 'class', 'message', 'file', 'line'],
      'regex' : /^\[([^\]]*)\] ([^\.]+)\.([^:]+): ([^:]+):(?: (.*) at )(?:(\/.*) line )(\d+)/,
      subtype: 'uncaught_exception'
    }
  ]);
};

exports.getPreviewContext = function(log) {
  if (log.level) {
    switch (log.level) {
      case 'DEBUG': log.levelClass = 'default'; break;
      case 'INFO': log.levelClass = 'info'; break;
      case 'WARNING': log.levelClass = 'warning'; break;
      default: log.levelClass = 'important'; break;
    }
  }
  return log;
};
