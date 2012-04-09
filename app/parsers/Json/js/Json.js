'use strict';

exports.createInstance = function() {
  return new JsonParser();
};

var JsonParser = function() {
  Parser.call(this, 'Json');
};

mainevent.shared.Lang.inheritPrototype(JsonParser, Parser);

JsonParser.prototype.parse = function(log) {
  return JSON.parse(log);
};

JsonParser.prototype.addPreviewContext = function(log) {
  // Only use keys selected in config.js 'previewAttr' lists.
  if (log.previewAttr) {
    log.previewAttr = _.isArray(log.previewAttr) ? log.previewAttr : [log.previewAttr];

    var updated = {};
    _.each(log.previewAttr, function(name) {
      if (log[name]) {
        updated[name] = log[name];
      }
    });
    return updated;
  }
  return log;
};

JsonParser.prototype.getPreview = function(parsed) {
  var preview = [];
  _.each(parsed, function(value, key) {
    preview.push(key + '=' + value);
  });
  return preview.join(', ');
};
