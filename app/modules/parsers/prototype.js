'use strict';

GLOBAL.Parser = function(name) {
  this.name = name;
};

var storage = diana.requireModule('storage/storage').createInstance();

/**
 * Parse each line according to its source parser.
 *
 * @param source {Object}  Source properties from config.js
 * @param lines {Array|String} Log line string(s).
 * @return {Array} Log objects.
 */
Parser.prototype.parseLines = function(source, lines) {
  var parser = this;
  var logs = [];

  _.each(_.isArray(lines) ? lines : [lines], function(line, index) {
    var log = parser.parse(line);

    // Parse succeeded.
    if (_.size(log)) {
      // Use a source-specific attribute for the canonical 'time' attribute.
      if (source.timeAttr && log[source.timeAttr]) {
        log.time = log[source.timeAttr];
        delete log[source.timeAttr];
      }

      log.time = parser.extractTime(log.time);

      // Fallback to the current time.
      if (isNaN(log.time)) {
        log.time = (new Date()).getTime();
        log.__parse_error = 'time';
      }

      // Attach source-specific attributes.
      log.previewAttr = source.previewAttr || [];

    // Parse failed. Store the line and mark it.
    } else {
      log = {
        time: (new Date()).getTime(),
        message: line,
        __parse_error: 'line'
      };
    }

    log.time = Math.round(log.time / 1000);
    log.parser = source.parser;
    log.tags = source.tags || [];

    logs.push(log);
  });

  return logs;
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

/**
 * Convert a log line string into an object of parsed key/value pairs
 *
 * @param log {String} Ex. web access log line.
 * @return {Object} Parsed keys/values.
 */
Parser.prototype.parse = function(log) {
  return {};
};

/**
 * Augment the context object sent to the preview template.
 *
 * - Used by addPreviewContext() in the parsers.js module to augment a list of objects.
 * - Used to assist either getPreview() or template-based preview building.
 *
 * @param log {Object} Parsed key/value pairs from the database.
 * @return {Object} Augmented input.
 */
Parser.prototype.addPreviewContext = function(log) {
  return log;
};

/**
 * Build a log preview string.
 *
 * - Alternative to using a preview template.
 *
 * @param log {Object} Parsed key/value pairs from the database.
 * @return {String} Exact 'preview' attribute addPreviewContext() adds to each log object.
 */
Parser.prototype.getPreview = function(parsed) {
  return null;
};

/**
 * Augment/modify a log object for display based on its parser subtype.
 *
 * @param log {Object} Describes a parsed log line.
 */
Parser.prototype.decorateFullContext = function(log) {
  return log;
};

/**
 * Convert a date/time string into a millisecond-based timestamp.
 *
 * @param date {String} Ex. '12/Mar/2012:09:03:31 +0000'
 * @return {Number} Milliseconds since UNIX epoch.
 */
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
