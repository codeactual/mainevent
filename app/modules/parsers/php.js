'use strict';

exports.parse = function(log) {
  return require(__dirname + '/parsers').candidateCapture(log, [
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

exports.addPreviewContext = function(log) {
  if (log.level) {
    switch (log.level) {
      case 'Warning': log.levelClass = 'warning'; break;
      default: log.levelClass = 'important'; break;
    }
  }
  return log;
};

exports.extractTime = function(date) {
  var matches = date.match(/(\d+)-([A-Za-z]+)-(\d{4}) (\d{2}:\d{2}:\d{2} [A-Z]+)/);
  if (!matches) {
    return NaN;
  }

  var parsable = util.format(
    '%d/%d/%d %s',
    months.indexOf(matches[2]) + 1,
    matches[1],
    matches[3],
    matches[4]
  );
  return Date.parse(parsable);
};
