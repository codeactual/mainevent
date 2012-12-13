define(['moment'], function() {

  'use strict';

  var root = 'undefined' === typeof window ? GLOBAL : window;
  root.mainevent = root.mainevent || {};
  root.mainevent.shared = root.mainevent.shared || {};
  var mainevent = root.mainevent;

  mainevent.shared.Date = {
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
     * Time units and their partitioning unit.
     */
    partitions: {
      second: 'second',
      minute: 'second',
      hour: 'minute',
      day: 'hour',
      month: 'day',
      year: 'month'
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
     },

     /**
      * Find the best-fit time interval for a given duration.
      *
      * @param duration {Number} Milliseconds
      * @param asString {Boolean} (Optional, Default: true)
      * - If false, interval is returned in milliseconds.
      * @return {mixed}
      * - asNumber = true: Unit in milliseconds.
      * - asNumber = false: year, month, day, hour, minute
      */
     bestFitInterval: function(duration, asString) {
       var interval = '';
       if (duration < 60000) {
         interval = 'second';
       } else if (duration < 3600000) {
         interval = 'minute';
       } else if (duration < 86400000) {
         interval = 'hour';
       } else if (duration < 2419200000) { // 28 days
         interval = 'day';
       } else if (duration < 31536000000) { // 365 days
         interval = 'month';
       } else {
         interval = 'year';
       }
       if (_.isUndefined(asString) || asString) {
         return interval;
       }
       return mainevent.shared.Date.unitToMilli(1, interval);
     },

     /**
      * Return the milliseconds in the given unit amount.
      *
      * @param num {Number|String}
      * @param unit {String}
      * @return Number
      */
     unitToMilli: function(amount, unit) {
       var now = moment().valueOf();
       return moment(now).add(unit + 's', amount).valueOf() - now;
     }
  };
});
