'use strict';

var config = helpers.getConfig();
var storage = helpers.requireModule('storage/storage').load();

// Parser modules indexed by name, ex. 'nginx_access'.
var parsers = {};
_.each(config.sources, function(source) {
  parsers[source.parser] = require(__dirname + '/' + source.parser);
});

/**
 * Return a named parser.
 *
 * @param name {String} Ex. 'nginx_access'
 * @return {Object} Copy of a cached parser module.
 */
exports.get = function(name) {
  return _.clone(parsers[name]);
};

/**
  * Parse each line according to its source parser. Tag unparsable.
  *
  * @param subject {String} Log line.
  * @param names {Array} Capture names, ex. 'time' or 'host'.
  * @param regex {RegExp} Pattern to capture all parts in 'names'.
  * @param bulk {Boolean} If true, DB connection is not auto-closed.
  * @return {Object} Captured properties.
  */
exports.parseAndInsert = function(source, lines, callback, bulk) {
  callback = callback || function() {};
  lines = _.isArray(lines) ? lines : [lines];

  _.each(lines, function(line, index) {
    lines[index] = parsers[source.parser].parse(line);
    if (!_.size(lines[index])) {
      lines[index] = {
        time: new Date().toUTCString(),
        message: line,
        __parse_error: 1
      };
    }
  });

  bulk = undefined === bulk ? false : bulk;

  helpers.walkAsync(
    lines,
    function (line, callback) {
      storage.insertLog(source, line, callback, true);
    },
    null,
    function() {
      // Manually close -- insertLog won't when bulk=true.
      if (!bulk) {
        storage.dbClose();
      }
      callback();
    }
  );
};

exports.getPreviewTemplate = function(log) {
  return 'preview_' + log.parser + (undefined === log.parser_subtype ? '' : '_' + log.parser_subtype);
};

/**
 * Augment each log object with preview HTML based on its parser subtype.
 *
  * @param log {Array} List of objects describing parsed log lines.
  * @param onAllDone {Function} Called after all previews have been added.
 */
exports.addPreview = function(logs, onAllDone) {
  var dust = require('dust');
  var updatedLogs = [];

  var views = require(__dirname + '/../views.js');

  helpers.walkAsync(
    logs,
    function(log, onSingleDone) {
      if (_.has(parsers[log.parser], 'getPreviewContext')) {
        log = parsers[log.parser].getPreviewContext(log);
      }

      // Use parser module's preview function, e.g. for parsers/json.js.
      if (_.has(parsers[log.parser], 'getPreview')) {
        log.preview = parsers[log.parser].getPreview(log);
        updatedLogs.push(log);
        onSingleDone();
      // Use parser's template.
      } else {
        var templateName = exports.getPreviewTemplate(log);
        dust.loadSource(require('fs').readFileSync(__dirname + '/../../../public/templates/compiled.js'));
        dust.render(
          templateName,
          log,
          function(err, out) {
            log.preview = out;
            updatedLogs.push(log);
            onSingleDone();
          }
        );
      }
    },
    null,
    function() {
      onAllDone(updatedLogs);
    }
  );
};

/**
  * Apply a list of potential named capture regexes. First match wins.
  *
  * @param subject {String} Log line.
  * @param names {Array} Capture names, ex. 'time' or 'host'.
  * @param regex {RegExp} Pattern to capture all parts in 'names'.
  * @return {Object} Captured properties.
  */
exports.named_capture = function(subject, names, regex) {
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
exports.candidate_capture = function(subject, candidates) {
  var captured = {};
  for (var c in candidates) {
    captured = exports.named_capture(subject, candidates[c].names, candidates[c].regex);
    if (_.size(captured)) {
      captured.parser_subtype = candidates[c].subtype;
      break;
    }
  }
  return captured;
};
