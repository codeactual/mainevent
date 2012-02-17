'use strict';

var config = require(__dirname + '/../../../config/config.js').read();
var parsers = {};
var storage = null;

for (var s in config.sources) {
  parsers[config.sources[s].parser] = require(__dirname + '/' + config.sources[s].parser);
}

exports.parse_log = function(source, msg) {
  if (!storage) {
    storage = require(__dirname + '/../storage/mongodb.js');
    storage.connect(config.storage);
  }
  msg = msg.toString();
  var lines = msg.replace(/\n$/, '').split("\n");
  var docs = [];
  for (var l in lines) {
    docs.push(parsers[source.parser].parse(lines[l]));
  }
  storage.insert_log(source, docs);
};

exports.parse_log_multi = function(source, lines) {
  if (!storage) {
    storage = require(__dirname + '/../storage/mongodb.js');
    storage.connect(config.storage);
  }
  var docs = [];
  for (var l in lines) {
    docs.push(parsers[source.parser].parse(lines[l]));
  }
  storage.insert_log(source, docs);
};

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

exports.candidate_capture = function(subject, candidates) {
  var matches = {};
  for (var c in candidates) {
    matches = exports.named_capture(subject, candidates[c].names, candidates[c].regex);
    if (Object.keys(matches).length) {
      break;
    }
  }
  return matches;
};
