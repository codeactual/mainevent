define([], function() {

  'use strict';

  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  diana.helpers.Graph = {
    detectDateInterval: function(str) {
      var formats = {
        minute: /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:00$/,
        hour: /^\d{2}\/\d{2}\/\d{4} \d{2}:00$/,
        day: /^\d{2}\/\d{2}\/\d{4}$/,
        month: /^\d{4}-\d{2}$/,
        year: /^\d{4}$/
      };
      var match = null;
      _.any(formats, function(regex, interval) {
        if (str.match(regex)) {
          match = interval;
          return true;
        }
        return false;
      });
      return match;
    }
  };
});
