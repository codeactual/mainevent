define([], function() {

  'use strict';

  window.mainevent = window.mainevent || {};
  window.mainevent.helpers = window.mainevent.helpers || {};
  var mainevent = window.mainevent;

  mainevent.helpers.Prefs = {
    ns: 'prefs',
    set: function(key, value) {
      var data = {};
      data[key] = value;
      mainevent.helpers.cache.syncSet({ns: mainevent.helpers.Prefs.ns, data: data});
    },
    get: function(key) {
      var data = mainevent.helpers.cache.syncGet({ns: mainevent.helpers.Prefs.ns, keys: key});
      return _.has(data, key) ? data[key] : null;
    }
  };
});
