'use strict';

var extend = require(__dirname + '/../../prototype.js').extend;

exports.SymfonyParser = extend({name: 'Symfony', humanName: 'Symfony'}, {

  parse: function(log) {
    return this.candidateCapture(log, [
      {
        'regex' : '^\\[(?<time>[^\\]]+)\\] (?<type>[^\\.]+)\\.(?<level>[^:]+): Notified event "(?<event>[^\\"]+)" to listener "(?<listener>[^\\"]+)"',
        subtype: 'event'
      },
      {
        'regex' : '^\\[(?<time>[^\\]]+)\\] (?<type>[^\\.]+)\\.(?<level>[^:]+): (?<class>[^:]+): (?<message>.*) at (?<file>\\/.*) line (?<line>\\d+)',
        subtype: 'uncaught_exception'
      }
    ]);
  },

  buildTemplateContext: function(template, log) {
    if ('full' === template) {
      return log;
    }

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

  extractTime: function(log) {
    return Date.parse(log.time.replace(/-/, '/'));
  }
});
