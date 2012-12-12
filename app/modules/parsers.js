'use strict';

var templatesDir = require('fs').readFileSync(mainevent.requireModule('build').getTemplatesPath());

/**
 * Return a named parser.
 *
 * @param name {String} Ex. 'nginx_access'
 * @return {Object} Copy of a cached parser module.
 */
exports.createInstance = function(name) {
  var classFile = util.format('%s/../parsers/%s/js/%s', __dirname, name, name);
  return new (require(classFile)[name + 'Parser'])();
};

/**
 * Parse each line list according to its source parser.
 *
 * @param mongodb {Object} MongoDb instance.
 * @param sourceLines {Array|Object} Line object(s).
 * - source {Object} Source properties from config.js
 * - lines {Array|String} Unparsed line(s).
 * @param callback {Function} Fires after success/error.
 * @param bulk {Boolean} (Optional, Default: false) If true, auto-close connection.
 */
exports.parseAndInsert = function(mongodb, sourceLines, callback, bulk) {
  var lines = [];
  _.each(_.isArray(sourceLines) ? sourceLines : [sourceLines], function(sl) {
    var parser = exports.createInstance(sl.source.parser);
    sl.lines = _.isArray(sl.lines) ? sl.lines : [sl.lines];
    lines = lines.concat(parser.parseLines(sl.source, sl.lines));
  });

  mongodb.insertLog(lines, function() {
    (callback || function() {})();
  }, bulk);
};

/**
 * Return a template name based on a log's attributes.
 *
 * @param log {Object} Parsed log line attributes.
 * @return {String}
 */
exports.getPreviewTemplate = function(log) {
  return util.format('%s%sPreview', log.parser, log.parser_subtype || '');
};

/**
 * Augment each log object with preview HTML based on its parser subtype.
 *
 * @param log {Array} List of objects describing parsed log lines.
 * @param onAllDone {Function} Called after all previews have been added.
 */
exports.buildPreviewTemplateContext = function(logs, onAllDone) {
  var dust = require('dustjs-linkedin');
  var updatedLogs = [];

  var updateLogFromTemplate = function(name, log, context, callback) {
    dust.loadSource(templatesDir);
    dust.render(
      name,
      context,
      function(err, out) {
        log.preview = out;
        updatedLogs.push(log);
        callback();
      }
    );
  };

  async.forEachSeries(
    logs,
    function(log, onSingleDone) {
      var parser = exports.createInstance(log.parser);
      var context = parser.buildTemplateContext('preview', log);

      // 'log' does not have a predictable structure.
      if (log.__parse_error) {
        updateLogFromTemplate('preview_parse_error', log, context, onSingleDone);

      // Use parser's template.
      } else {
        // Let the parser define its own preview text.
        log.preview = parser.buildPreviewText(context);

        if (_.isNull(log.preview)) {
          updateLogFromTemplate(
            exports.getPreviewTemplate(log), log, context, onSingleDone
          );
        } else {
          updatedLogs.push(log);
          onSingleDone();
        }
      }
    },
    function() {
      onAllDone(updatedLogs);
    }
  );
};

/**
 * Get all parsers selected in app/config.js.
 *
 * @return {Object} Keys: internal name, Values: humanized names.
 */
exports.getConfiguredParsers = function() {
  var parsers = {};
  _.each(mainevent.getConfig().sources, function(source) {
    var parser = exports.createInstance(source.parser);
    parsers[source.parser] = parser.humanName || parser.name;
  });
  return parsers;
};

/**
 * Split a string into lines for parsing.
 *
 * @param str {String}
 * @return {Array}
 */
exports.splitString = function(str) {
  // Remove trailing whitespace and split on newline.
  return _.reject(_.compact(str.trim().split("\n")), function(line) {
    // Remove any lines composed of only whitespace.
    return line.match(/^\s+$/);
  });
};

/**
 * Extract parsable lines from a collection of partials.
 *
 * @param {Array} rawLines Partial lines.
 * @param {Object} parser Parser instance.
 * @param {Function} consumeLine Callback fires for each line.
 *   {String} Parsable line.
 *   {Function} Callback to fire after line has been consumed.
 * @param {Function} extractDone Callback fires after all lines have been consumed.
 */
exports.extractLines = function(rawLines, parser, consumeLine, extractDone) {
  var async = require('async');
  var currentLine = '';
  var detectDelimiter = parser.detectDelimiter;

  async.forEachSeries(
    rawLines,
    function(line, nextLine) {
      async.until(
        function() {
          return '' === line;
        },
        function(continueLineRead) {
          var delimPos = detectDelimiter(line);

          // No delimter found. Keep building a full line.
          if (-1 === delimPos) {
            currentLine += line;
            line = '';
            continueLineRead();
          } else {
            // Append everything up to, but not including, the delimiter.
            currentLine += line.substr(0, delimPos);

            var consumable = currentLine;
            currentLine = '';

            // Remaining characters after the delimiter.
            line = line.substr(delimPos + 1);

            consumeLine(consumable, continueLineRead);
          }
        },
        nextLine
      );
    },
    function() {
      if (parser.isLineParsable(currentLine)) {
        consumeLine(currentLine, extractDone);
      } else {
        // Send back overflow.
        extractDone(currentLine);
      }
    }
  );
};
