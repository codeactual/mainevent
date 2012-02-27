'use strict';

exports.parse = function(log) {
  return JSON.parse(log);
};

exports.getPreviewContext = function(log) {
  // Only use keys selected in config.js 'previewAttr' lists.
  if (this.previewAttr) {
    var context = {};
    var previewAttr = this.previewAttr;
    _.each(log, function(value, key) {
      if (-1 !== _.indexOf(previewAttr, key)) {
        context[key] = value;
      }
    });
    return context;
  }
  return log;
};

exports.getPreview = function(parsed) {
  return JSON.stringify(parsed).substr(0, 80);
};
