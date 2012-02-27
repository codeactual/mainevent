'use strict';

exports.parse = function(log) {
  return require(__dirname + '/parsers').candidate_capture(log, [
    {
      names: ['time', 'level', 'message', 'file', 'line'],
      regex : /^\[([^\]]+)\] PHP ([^:]+):\s+(?:(.*) in )(\/.*) on line (\d+)$/,
      subtype: 'builtin'
    },
    {
      names: ['time', 'message'],
      regex : /^\[([^\]]*)\]\s+(.*)$/,
      subtype: 'userdef'
    }
  ]);
};

exports.getPreviewContext = function(log) {
  if (log.level) {
    switch (log.level) {
      case 'Warning': log.levelClass = 'warning'; break;
      default: log.levelClass = 'important'; break;
    }
  }
  return log;
};
