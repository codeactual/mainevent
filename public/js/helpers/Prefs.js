'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  diana.helpers.Prefs = {
    ns: 'prefs',
    set: function(key, value) {
      var data = {};
      data[key] = value;
      diana.cache.syncSet({ns: diana.helpers.Prefs.ns, data: data});
    },
    get: function(key) {
      return diana.cache.syncGet({ns: diana.helpers.Prefs.ns, keys: key});
    }
  };
})();
