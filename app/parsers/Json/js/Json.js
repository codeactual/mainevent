'use strict';

var extend = require(__dirname + '/../../prototype.js').extend;

exports.JsonParser = extend({name: 'Json'}, {

  parse: function(log) {
    return JSON.parse(log);
  },

  addPreviewContext: function(log) {
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
  },

  getPreview: function(parsed) {
    var preview = [];
    _.each(parsed, function(value, key) {
      preview.push(key + '=' + value);
    });
    return preview.join(', ');
  }
});
