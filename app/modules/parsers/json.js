'use strict';

exports.parse = function(log) {
  return JSON.parse(log);
};

exports.getPreview = function(parsed) {
  return JSON.stringify(parsed).substr(0, 80);
};
