'use strict';

var _ = require('underscore');

// Parser modules indexed by name, ex. 'nginx_access'.
var config = require(__dirname + '/../../../config/config.js').read();
var parsers = {};
_.each(config.sources, function(source) {
  parsers[source.parser] = require(__dirname + '/' + source.parser);
});

var storage = require(__dirname + '/../storage/mongodb.js');

/**
  * Parse each line according to its source parser. Tag unparsable.
  *
  * @param subject {String} Log line.
  * @param names {Array} Capture names, ex. 'time' or 'host'.
  * @param regex {RegExp} Pattern to capture all parts in 'names'.
  * @return {Object} Captured properties.
  */
exports.parse_log = function(source, lines, callback) {
  _.each(lines, function(line) {
    var parsed = parsers[source.parser].parse(line);
    if (!_.size(parsed)) {
      parsed = {
        time: new Date().toUTCString(),
        message: line
      };
      source.tags.push('parse_error');
    }
    storage.insert_log(source, parsed, callback);
  });
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
      break;
    }
  }
  return captured;
};
