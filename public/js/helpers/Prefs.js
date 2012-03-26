define([], function() {

  'use strict';

  var Prefs = {
    ns: 'prefs',
    set: function(key, value) {
      var data = {};
      data[key] = value;
      diana.cache.syncSet({ns: Prefs.ns, data: data});
    },
    get: function(key) {
      var data = diana.cache.syncGet({ns: Prefs.ns, keys: key});
      return _.has(data, key) ? data[key] : null;
    }
  };

  return Prefs;
});
