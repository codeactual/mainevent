'use strict';

var extend = require(__dirname + '/../../prototype.js').extend;

exports.SymfonyParser = extend({name: 'Symfony'}, {

  parse: function(log) {
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
  },

  addPreviewContext: function(log) {
    if (log.level) {
      switch (log.level) {
        case 'DEBUG': log.__levelClass = 'default'; break;
        case 'INFO': log.__levelClass = 'info'; break;
        case 'WARNING': log.__levelClass = 'warning'; break;
        default: log.__levelClass = 'important'; break;
      }
    }
    return log;
  },

  extractTime: function(date) {
    return Date.parse(date.replace(/-/, '/'));
  }
});
