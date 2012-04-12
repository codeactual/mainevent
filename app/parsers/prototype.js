'use strict';

var Parser = function() {};

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
    if (log && _.size(log)) {
      // Use a source-specific attribute for the canonical 'time' attribute.
      if (source.timeAttr && log[source.timeAttr]) {
        log.time = log[source.timeAttr];
        delete log[source.timeAttr];
      }

      log.time = parser.extractTime(_.clone(log));

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

    log.time = Math.round(log.time);
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
 * @param regex {String} XRegExp pattern.
 * @return {Object} Captured properties.
 */
Parser.prototype.namedCapture = function(subject, regex) {
  return mainevent.shared.XRegExp.namedCaptureMatch(subject, XRegExp(regex));
};

/**
 * Apply a list of potential named capture regexes. First match wins.
 *
 * @param subject {String} Log line.
 * @param candidates {Array} Potential pattern in XRegExp format.
 * @return {Object} Capture properties; otherwise empty object.
 */
Parser.prototype.candidateCapture = function(subject, candidates) {
  var captured = {};
  for (var c in candidates) {
    captured = this.namedCapture(subject, candidates[c].regex);
    if (captured && _.size(captured)) {
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
 * Augment the context object sent to templates.
 *
 * @param template {String}
 * - 'preview': Augment/modify 'log' for use in its parser's preview template.
 * - 'full': Augment/modify 'log' for use in the full-view template for /event/:id pages.
 * @param log {Object} Parsed key/value pairs from the database.
 * @return {Object} Augmented input.
 */
Parser.prototype.buildTemplateContext = function(template, log) {
  return log;
};

/**
 * Build a log preview string.
 *
 * - Alternative to using a preview template.
 *
 * @param log {Object} Parsed key/value pairs from the database.
 * @return {String} Exact 'preview' attribute buildTemplateContext() adds to each log object.
 */
Parser.prototype.buildPreviewText = function(parsed) {
  return null;
};

/**
 * Convert a date/time string into a millisecond-based timestamp.
 *
 * @param log {Object} Ex. log.time: '12/Mar/2012:09:03:31 +0000'
 * @return {Number} Milliseconds since UNIX epoch.
 */
Parser.prototype.extractTime = function(log) {
  // No custom extraction, try direct parsing/extraction.
  if (_.isNumber(log.time)) {
    if (log.time < 10000000000) {
      log.time *= 1000;
    }
    return (new Date(log.time)).getTime();
  } else {
    return Date.parse(log.time);
  }
};

/**
 * Convenience wrapper around mainevent.shared.Lang.extend().
 *
 * - Curries the super class argument.
 */
exports.extend = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(Parser);
  return mainevent.shared.Lang.extend.apply(null, args);
};

exports.Parser = Parser;
