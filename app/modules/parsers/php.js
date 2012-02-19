'use strict';

exports.parse = function(log) {
  return require('./parsers').candidate_capture(log, [
    // Built-in
    {
      names: ['time', 'level', 'message', 'file', 'line'],
      regex : /^\[([^\]]+)\] PHP ([^:]+):\s+(?:(.*) in )(\/.*) on line (\d+)$/
    },
    // Non-builtin
    {
      names: ['time', 'message'],
      regex : /^\[([^\]]*)\]\s+(.*)$/
    }
  ]);
};
