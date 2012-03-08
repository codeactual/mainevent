'use strict';

var storage = helpers.requireModule('storage/storage').load();

/**
 * Return a named parser.
 *
 * @param name {String} Ex. 'nginx_access'
 * @return {Object} Copy of a cached parser module.
 */
exports.get = function(name) {
  return require(__dirname + '/' + name + '.js');
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
    var parser = exports.get(source.parser);
    lines[index] = parser.parse(line);

    // Parse succeeded.
    if (_.size(lines[index])) {
      // Use a source-specific attribute for the canonical 'time' attribute.
      if (source.timeAttr && lines[index][source.timeAttr]) {
        lines[index].time = lines[index][source.timeAttr];
        delete lines[index][source.timeAttr];
      }

      // Convert source-specific time formats to UNIX timestamps.
      if (_.has(parser, 'extractTime')) {
        lines[index].time = parser.extractTime(lines[index].time);
      } else {
        // No custom extraction, try direct parsing/extraction.
        if (_.isNumber(lines[index].time)) {
          if (lines[index].time < 10000000000) {
            lines[index].time *= 1000;
          }
          lines[index].time = (new Date(lines[index].time)).getTime();
        } else {
          lines[index].time = Date.parse(lines[index].time);
        }
      }

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
 * Return a template name based on a log's attributes.
 *
  * @param log {Object} Parsed log line attributes.
  * @return {String}
 */
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

  var updateLogFromTemplate = function(name, log, context, callback) {
    dust.loadSource(
      require('fs')
        .readFileSync(__dirname + '/../../../public/templates/compiled.js')
    );
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

  helpers.walkAsync(
    logs,
    function(log, onSingleDone) {
      if (_.has(exports.get(log.parser), 'getPreviewContext')) {
        var context = exports.get(log.parser).getPreviewContext(log);
      } else {
        var context = log;
      }

      // Use parser module's preview function, e.g. for parsers/json.js.
      if (_.has(exports.get(log.parser), 'getPreview')) {
        log.preview = exports.get(log.parser).getPreview(context);
        updatedLogs.push(log);
        onSingleDone();

      // 'log' does not have a predictable structure.
      } else if (log.__parse_error) {
        updateLogFromTemplate('preview_parse_error', log, context, onSingleDone);

      // Use parser's template.
      } else {
        updateLogFromTemplate(
          exports.getPreviewTemplate(log), log, context, onSingleDone
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
exports.namedCapture = function(subject, names, regex) {
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
exports.candidateCapture = function(subject, candidates) {
  var captured = {};
  for (var c in candidates) {
    captured = exports.namedCapture(subject, candidates[c].names, candidates[c].regex);
    if (_.size(captured)) {
      captured.parser_subtype = candidates[c].subtype;
      break;
    }
  }
  return captured;
};
