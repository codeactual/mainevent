'use strict';

var extend = require(__dirname + '/../../prototype.js').extend;

exports.PhpParser = extend({name: 'Php'}, {

  parse: function(log) {
    return this.candidateCapture(log, [
                                 {
      names: ['time', 'level', 'message', 'file', 'line'],
      regex : /^\[([^\]]+)\] PHP ([^:]+):\s+(?:(.*) in )(\/.*) on line (\d+)$/,
      subtype: 'BuiltIn'
    },
    {
      names: ['time', 'message'],
      regex : /^\[([^\]]*)\]\s+(.*)$/,
      subtype: 'UserDefined'
    }
    ]);
  },

  buildTemplateContext: function(template, log) {
    if ('full' == template) {
      return log;
    }

    if (log.level) {
      switch (log.level) {
        case 'Warning': log.__levelClass = 'warning'; break;
        default: log.__levelClass = 'important'; break;
      }
    }
    return log;
  },

  extractTime: function(date) {
    var matches = date.match(/(\d+)-([A-Za-z]+)-(\d{4}) (\d{2}:\d{2}:\d{2} [A-Z]+)/);
    if (!matches) {
      return NaN;
    }

    var parsable = util.format(
      '%d/%d/%d %s',
      mainevent.shared.Date.monthNameToNum(matches[2]),
      matches[1],
      matches[3],
      matches[4]
    );
    return Date.parse(parsable);
  }
});
