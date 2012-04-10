'use strict';

var extend = require(__dirname + '/../../prototype.js').extend;

exports.JsonParser = extend({name: 'Json', humanName: 'JSON'}, {

  parse: function(log) {
    return JSON.parse(log);
  },

  buildTemplateContext: function(template, log) {
    if ('full' == template) {
      return log;
    }

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

  buildPreviewText: function(parsed) {
    var preview = [];
    _.each(parsed, function(value, key) {
      preview.push(key + '=' + value);
    });
    return preview.join(', ');
  }
});
