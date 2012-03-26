define([], function() {

  'use strict';

  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  diana.helpers.Prefs = {
    ns: 'prefs',
    set: function(key, value) {
      var data = {};
      data[key] = value;
      diana.helpers.cache.syncSet({ns: diana.helpers.Prefs.ns, data: data});
    },
    get: function(key) {
      var data = diana.helpers.cache.syncGet({ns: diana.helpers.Prefs.ns, keys: key});
      return _.has(data, key) ? data[key] : null;
    }
  };
});
