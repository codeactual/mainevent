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
 */
exports.parseAndInsert = function(mongodb, sourceLines, callback) {
  var lines = [];
  _.each(_.isArray(sourceLines) ? sourceLines : [sourceLines], function(sl) {
    var parser = exports.createInstance(sl.source.parser);
    sl.lines = _.isArray(sl.lines) ? sl.lines : [sl.lines];
    lines = lines.concat(parser.parseLines(sl.source, sl.lines));
  });

  mongodb.insertLog(lines, function() {
    mongodb.dbClose();
    (callback || function() {})();
  });
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
exports.addPreviewContext = function(logs, onAllDone) {
  var dust = require('dust');
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

  mainevent.shared.Async.runSync(
    logs,
    function(log, onSingleDone) {
      var parser = exports.createInstance(log.parser);
      var context = parser.addPreviewContext(log);

      // 'log' does not have a predictable structure.
      if (log.__parse_error) {
        updateLogFromTemplate('preview_parse_error', log, context, onSingleDone);

      // Use parser's template.
      } else {
        // Use parser module's preview function.
        log.preview = parser.getPreview(context);

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
 * @return {Array}
 */
exports.getConfiguredParsers = function() {
  var parsers = {};
  _.each(mainevent.getConfig().sources, function(source) {
    parsers[source.parser] = 1;
  });
  return _.keys(parsers);
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
