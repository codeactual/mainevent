define([], function() {

  'use strict';

  if ('undefined' != typeof require) {
    var moment = require('moment');
  }

  var root = 'undefined' == typeof window ? GLOBAL : window;
  root.diana = root.diana || {};
  root.diana.shared = root.diana.shared || {};
  var diana = root.diana;

  diana.shared.Date = {
    /**
     * Time units used by background jobs and UI widgets.
     */
    presetTimeIntervals: {
      'Last 1 min': 60000,
      'Last 5 mins': 300000,
      'Last 15 mins': 900000,
      'Last 1 hour': 3600000,
      'Last 1 day': 86400000,
      'Last 1 week': 604800000,
      'Last 30 days': 2592000000
    },

    /**
     * Convert a UNIX timestamp in seconds to string format.
     *
     * @param time {Number}
     * @return {String}
     */
    formatTime: function(time) {
      return moment(new Date(time)).format('ddd, MMM D YYYY, HH:mm:ss');
    },

    /**
     * Convert a month name, abbreviated or full, to its number.
     *
     * @param name {String}
     * @return {Number} Starting at 1.
     */
    monthNameToNum: function(name) {
      return moment(name + ' 1 2012').month() + 1;
    },

    /**
     * Convert a string date/time to UNIX timestamp in milliseconds.
     *
     * @param str {String}
     * @return {Number}
     */
     strtotime: function(str) {
       return (new Date(str)).getTime();
     }
  };
});
