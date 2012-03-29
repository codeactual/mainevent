define([], function() {

  'use strict';

  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  diana.helpers.Graph = {

    formatRegex: {
      minute: /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:00$/,
      hour: /^\d{2}\/\d{2}\/\d{4} \d{2}:00$/,
      day: /^\d{2}\/\d{2}\/\d{4}$/,
      month: /^\d{4}-\d{2}$/,
      year: /^\d{4}$/
    },

    unitFormat: {
      minute: 'MM/DD/YYYY HH:mm:ss',
      hour: 'MM/DD/YYYY HH:mm',
      day: 'MM/DD/YYYY',
      month: 'YYYY-MM',
      year: 'YYYY'
    },

    /**
     * Adjust graph axis options based on a data set and default options.
     *
     * Ex. if there is only one data point, then ensure the axis scope is zoomed
     * in on that point.
     *
     * @param data {Array} Array of [x,y] arrays.
     * @param axes {Object} Default options for each axis.
     * - x {Object}
     * - y {Object}
     * @return {Object} Modified 'axes'.
     */
    adjustAxes: function(data, axes) {
      axes = _.clone(axes);
      axes.xaxis = axes.xaxis || {};
      axes.yaxis = axes.yaxis || {};

      var xunit = diana.helpers.Graph.detectDateUnit(data[0][0]);

      if (data.length == 1) {
        // Zoom in, one unit padding on both sides.
        axes.xaxis.min = diana.helpers.Graph.subtractDateUnit(data[0][0], 1);
        axes.xaxis.max = diana.helpers.Graph.addDateUnit(data[0][0], 1);
        axes.xaxis.tickInterval = '1 ' + xunit;

        // Add proportional top-padding.
        axes.yaxis.max = data[0][1] * 1.5;
      }

      axes.yaxis.min = 0;

      return axes;
    },

    /**
     * Detect a formatted date/time's unit and add an amount of them
     *
     * @param str {String} Ex. '03/12/2012'.
     * @param amount {Number} Ex. 1
     * @return {String} Ex. '03/11/2012'
     */
    addDateUnit: function(str, amount) {
      var unit = diana.helpers.Graph.detectDateUnit(str);
      var format = diana.helpers.Graph.unitFormat[unit];
      switch (unit) {
        case 'minute':
        case 'hour':
        case 'day':
        case 'month':
        case 'year':
          return moment(str).add(unit + 's', amount).format(format);
        default: return null;
      }
    },

    /**
     * Detect a formatted date/time's unit and subtract an amount of them.
     *
     * @param str {String} Ex. '03/12/2012'.
     * @param amount {Number} Ex. 1
     * @return {String} Ex. '03/11/2012'
     */
    subtractDateUnit: function(str, amount) {
      return diana.helpers.Graph.addDateUnit(str, -1 * amount);
    },

    /**
     * Detect a formatted date/time's unit.
     *
     * @param str {String} Ex. '03/12/2012'.
     * @return {String} minute, hour, day, month, year
     */
    detectDateUnit: function(str) {
      var match = null;
      _.any(diana.helpers.Graph.formatRegex, function(regex, unit) {
        if (str.match(regex)) {
          match = unit;
          return true;
        }
        return false;
      });
      return match;
    }
  };
});
