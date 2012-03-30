define([], function() {

  'use strict';

  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  var Graph = diana.helpers.Graph = {

    formatRegex: {
      minute: /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:00$/,
      hour: /^\d{2}\/\d{2}\/\d{4} \d{2}:00$/,
      day: /^\d{2}\/\d{2}\/\d{4}$/,
      month: /^\d{4}-\d{2}$/,
      year: /^\d{4}$/
    },

    momentFormat: {
      minute: 'MM/DD/YYYY HH:mm:ss',
      hour: 'MM/DD/YYYY HH:mm',
      day: 'MM/DD/YYYY',
      month: 'YYYY-MM',
      year: 'YYYY'
    },

    jqplotFormat: {
      minute: '%m/%d/%Y %H:%M:%S',
      hour: '%m/%d/%Y %H:%M',
      day: '%m/%d/%Y',
      month: '%Y-%m',
      year: '%Y'
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
      var date = diana.shared.Date;
      axes = _.clone(axes);
      axes.xaxis = axes.xaxis || {};
      axes.yaxis = axes.yaxis || {};

      if (data.length == 1) {
        // Zoom in, one unit padding on both sides.
        axes.xaxis.min = Graph.subtractDateUnit(data[0][0], 1);
        axes.xaxis.max = Graph.addDateUnit(data[0][0], 1);
        axes.xaxis.tickInterval = '1 ' + Graph.detectDateUnit(data[0][0]);

        // Add proportional top-padding.
        axes.yaxis.max = data[0][1] * 1.5;
      } else {
        // Remove all x-axis padding.
        axes.xaxis.min = data[0][0];
        axes.xaxis.max = data[data.length - 1][0];

        var xunit = date.bestFitInterval(
          date.strtotime(data[data.length - 1][0]) - date.strtotime(data[0][0])
        );
        axes.xaxis.tickInterval = '1 ' + xunit;
        axes.xaxis.tickOptions = {formatString: Graph.jqplotFormat[xunit]};
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
      var unit = Graph.detectDateUnit(str);
      var format = Graph.momentFormat[unit];
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
      return Graph.addDateUnit(str, -1 * amount);
    },

    /**
     * Detect a formatted date/time's unit.
     *
     * @param str {String} Ex. '03/12/2012'.
     * @return {String} minute, hour, day, month, year
     */
    detectDateUnit: function(str) {
      var match = null;
      _.any(Graph.formatRegex, function(regex, unit) {
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
