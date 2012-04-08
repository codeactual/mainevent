'use strict';

exports.createInstance = function() {
  return new SymfonyParser();
};

var SymfonyParser = function() {
  Parser.call(this, 'symfony');
};

mainevent.shared.Lang.inheritPrototype(SymfonyParser, Parser);

SymfonyParser.prototype.parse = function(log) {
  return this.candidateCapture(log, [
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

SymfonyParser.prototype.addPreviewContext = function(log) {
  if (log.level) {
    switch (log.level) {
      case 'DEBUG': log.__levelClass = 'default'; break;
      case 'INFO': log.__levelClass = 'info'; break;
      case 'WARNING': log.__levelClass = 'warning'; break;
      default: log.__levelClass = 'important'; break;
    }
  }
  return log;
};

SymfonyParser.prototype.extractTime = function(date) {
  return Date.parse(date.replace(/-/, '/'));
};
