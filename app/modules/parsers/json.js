'use strict';

exports.parse = function(log) {
  return JSON.parse(log);
};

exports.preview = function(parsed) {
  return JSON.stringify(parsed).substr(0, 80);
};
