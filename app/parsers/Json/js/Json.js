'use strict';

var extend = require(__dirname + '/../../prototype.js').extend;

exports.JsonParser = extend({name: 'Json', humanName: 'JSON'}, {

  parse: function(log) {
    try {
      var parsed = JSON.parse(log);
    } catch (e) {
      if (e.toString().match(/Unexpected/)) {
        return null; // Treat as general parse error.
      } else {
        throw e;
      }
    }
    return parsed;
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
  },

  detectDelimiter: function(line) {
    return line.indexOf('\n');
  },

  isParsable: function(line) {
    try {
      JSON.parse(line);
      return true;
    } catch (e) {
      return false;
    }
  }
});
