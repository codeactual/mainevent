'use strict';

var moment = require('moment');

(function() {
  var root = "undefined" == typeof window ? GLOBAL : window;
  root.diana = root.diana || {};
  root.diana.shared = root.diana.shared || {};

  var diana = root.diana;

  diana.shared.Date = {
    /**
     * Convert a UNIX timestamp in seconds to string format.
     *
     * @param time {Number}
     * @return {String}
     */
    formatTime: function(time) {
      return moment(new Date(time * 1000)).format('LLLL z');
    },

    /**
     * Convert a month name, abbreviated or full, to its number.
     *
     * @param name {String}
     * @return {Number} Starting at 1.
     */
    monthNameToNum: function(name) {
      return moment(name + ' 1 2012').month() + 1;
    }
  };
})();

