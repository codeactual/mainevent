'use strict';

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
