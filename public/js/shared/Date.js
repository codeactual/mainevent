define([], function() {

  'use strict';

  if ('undefined' != typeof require) {
    var moment = require('moment');
  }

  return{
    /**
     * Convert a UNIX timestamp in seconds to string format.
     *
     * @param time {Number}
     * @return {String}
     */
    formatTime: function(time) {
      return moment(new Date(time * 1000)).format('ddd, MMM D YYYY, HH:mm:ss');
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
