'use strict';

GLOBAL.Parser = function(name) {
  this.name = name;
};

var storage = helpers.requireModule('storage/storage').load();

/**
 * Parse each line according to its source parser. Tag unparsable.
 *
 * @param subject {String} Log line.
 * @param names {Array} Capture names, ex. 'time' or 'host'.
 * @param regex {RegExp} Pattern to capture all parts in 'names'.
 * @param bulk {Boolean} If true, DB connection is not auto-closed.
 * @return {Object} Captured properties.
 */
Parser.prototype.parseAndInsert = function(source, lines, callback, bulk) {
  callback = callback || function() {};
  lines = _.isArray(lines) ? lines : [lines];

  var parser = this;
  _.each(lines, function(line, index) {
    lines[index] = parser.parse(line);

    // Parse succeeded.
    if (_.size(lines[index])) {
      // Use a source-specific attribute for the canonical 'time' attribute.
      if (source.timeAttr && lines[index][source.timeAttr]) {
        lines[index].time = lines[index][source.timeAttr];
        delete lines[index][source.timeAttr];
      }

      lines[index].time = parser.extractTime(lines[index].time);

      // Fallback to the current time.
      if (isNaN(lines[index].time)) {
        lines[index].time = (new Date()).getTime();
        lines[index].__parse_error = 'time';
      }

      // Attach source-specific attributes.
      lines[index].previewAttr = source.previewAttr || [];

    // Parse failed. Store the line and mark it.
    } else {
      lines[index] = {
        time: (new Date()).getTime(),
        message: line,
        __parse_error: 'line'
      };
    }

    lines[index].time = Math.round(lines[index].time / 1000);
  });

  helpers.walkAsync(
    lines,
    function (line, callback) {
      storage.insertLog(source, line, callback, true);
    },
    null,
    function() {
      // insertLog() is called above in bulk-mode, so we need to close the
      // reused link after all lines are inserted. Only skip that step
      // if parseAndInsert() itself is in bulk-mode, e.g. by tail.js.
      bulk = undefined === bulk ? false : bulk;
      if (!bulk) {
        storage.dbClose();
      }
      callback();
    }
  );
};

/**
 * Augment/modify a log object for display based on its parser subtype.
 *
 * @param log {Object} Describes a parsed log line.
 */
Parser.prototype.decorateFullContext = function(log) {
  return this.decorateFullContext(log);
};

/**
 * Apply a list of potential named capture regexes. First match wins.
 *
 * @param subject {String} Log line.
 * @param names {Array} Capture names, ex. 'time' or 'host'.
 * @param regex {RegExp} Pattern to capture all parts in 'names'.
 * @return {Object} Captured properties.
 */
Parser.prototype.namedCapture = function(subject, names, regex) {
  var captures = {};
  var matches = subject.match(regex);
  if (matches) {
    matches.shift();
    for (var n in names) {
      captures[names[n]] = matches[n];
    }
  }
  return captures;
};

/**
 * Apply a list of potential named capture regexes. First match wins.
 *
 * @param subject {String} Log line.
 * @param candidates {Array} Objects, each describing a potential pattern match.
 *   - names {Array} Capture names, ex. 'time' or 'host'.
 *   - regex {RegExp} Pattern to capture all parts in 'names'.
 * @return {Object}
 */
Parser.prototype.candidateCapture = function(subject, candidates) {
  var captured = {};
  for (var c in candidates) {
    captured = this.namedCapture(subject, candidates[c].names, candidates[c].regex);
    if (_.size(captured)) {
      captured.parser_subtype = candidates[c].subtype;
      break;
    }
  }
  return captured;
};

Parser.prototype.parse = function(log) {
  return {};
};

Parser.prototype.addPreviewContext = function(log) {
  return log;
};

Parser.prototype.getPreview = function(parsed) {
  return null;
};

Parser.prototype.decorateFullContext = function(log) {
  return log;
};

// Convert source-specific time formats to UNIX timestamps.
Parser.prototype.extractTime = function(date) {
  // No custom extraction, try direct parsing/extraction.
  if (_.isNumber(date)) {
    if (date < 10000000000) {
      date *= 1000;
    }
    return (new Date(date)).getTime();
  } else {
    return Date.parse(date);
  }
};