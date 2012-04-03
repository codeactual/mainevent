define(['shared/Date'], function() {

  'use strict';

  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  var Graph = diana.helpers.Graph = {

    formatRegex: {
      'minute|second': /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/,
      hour: /^\d{2}\/\d{2}\/\d{4} \d{2}:00$/,
      day: /^\d{2}\/\d{2}\/\d{4}$/,
      month: /^\d{4}-\d{2}$/,
      year: /^\d{4}$/
    },

    momentFormat: {
      second: 'MM/DD/YYYY HH:mm:ss',
      minute: 'MM/DD/YYYY HH:mm:ss',
      hour: 'MM/DD/YYYY HH:mm',
      day: 'MM/DD/YYYY',
      month: 'YYYY-MM',
      year: 'YYYY'
    },

    jqplotFormat: {
      second: ':%S',
      minute: '%H:%M',
      hour: '%H:00',
      day: '%m/%d',
      month: '%Y-%m',
      year: '%Y'
    },

    // Estimates
    xLabelWidth: 50,
    xMinTickWidth: 50,
    yLabelWidth: 50,
    yMinTickWidth: 25,

    /**
     * Adjust graph axis options based on a data set and default options.
     *
     * Ex. if there is only one data point, then ensure the axis scope is zoomed
     * in on that point.
     *
     * @param container {Object} Container element's jQuery object.
     * @param data {Array} Array of [x,y] arrays.
     * @param axes {Object} Default options for each axis.
     * - x {Object}
     * - y {Object}
     * @return {Object} Modified 'axes'.
     */
    adjustAxes: function(container, data, axes) {
      if (!data || !data.length) {
        return axes;
      }

      var date = diana.shared.Date;
      axes = _.clone(axes);
      axes.xaxis = axes.xaxis || {};
      axes.yaxis = axes.yaxis || {};

      if (data.length == 1) {
        // Zoom in, one unit padding on both sides.
        axes.xaxis.min = Graph.subtractDateUnit(data[0][0], 1);
        axes.xaxis.max = Graph.addDateUnit(data[0][0], 1);

        var xunit = Graph.detectDateUnit(data[0][0]);
        axes.xaxis.tickInterval = '1 ' + xunit;
        axes.xaxis.tickOptions = {formatString: Graph.jqplotFormat[xunit]};

        // Add proportional top-padding.
        axes.yaxis.max = data[0][1] * 1.5;
      } else {
        // Remove all x-axis padding.
        axes.xaxis.min = data[0][0];
        axes.xaxis.max = data[data.length - 1][0];

        var span = date.strtotime(data[data.length - 1][0]) - date.strtotime(data[0][0]);
        var bestFitInterval = date.bestFitInterval(span);

        // For spans <= than the best-fit interval, parition data into ticks
        // using the next-smaller interval.
        if (span <= date.unitToMilli(1, bestFitInterval)) {
          var xunit = date.partitions[bestFitInterval];
        } else {
          var xunit = bestFitInterval;
        }

        axes.xaxis.tickInterval = '1 ' + xunit;
        axes.xaxis.tickOptions = {formatString: Graph.jqplotFormat[xunit]};

        // Estiamte x-axis numberTicks based on current dimensions.
        var graphWidth = container.width() - Graph.yLabelWidth,
            maxTicks = Math.floor(graphWidth / Graph.xMinTickWidth);
        axes.xaxis.numberTicks = Math.min(maxTicks, data.length);
      }

      // Estimate y-axis numberTicks and tickInterval based on current dimensions.
      var graphHeight = container.parent().height() - Graph.xLabelWidth,
          ymax = 0;
      _.each(data, function(point) {
        ymax = point[1] > ymax ? point[1] : ymax;
      });
      axes.yaxis.numberTicks = Math.ceil(graphHeight / Graph.yMinTickWidth);
      axes.yaxis.tickInterval = Math.max(1, Math.ceil(ymax / axes.yaxis.numberTicks));

      // Adjust y-axis numberTicks and tickInterval estimates to powers of ten.
      var floorTensUnit = Math.pow(10, Graph.magnitude(axes.yaxis.tickInterval)),
          tensRoundedTickInterval = Math.ceil(axes.yaxis.tickInterval / floorTensUnit);
      axes.yaxis.tickInterval = tensRoundedTickInterval * floorTensUnit;
      axes.yaxis.max = axes.yaxis.numberTicks * axes.yaxis.tickInterval;

      axes.yaxis.min = 0;

      return axes;
    },

    /**
     * Detect a formatted date/time's unit and add an amount of them
     *
     * @param str {String} Ex. '03/12/2012'.
     * @param amount {Number} Ex. 1
     * @param unit {String} (Optional) Override unit detection.
     * @return {String} Ex. '03/11/2012'
     */
    addDateUnit: function(str, amount, unit) {
      unit = unit || Graph.detectDateUnit(str);
      var format = Graph.momentFormat[unit];
      switch (unit) {
        case 'second':
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
     * @param unit {String} (Optional) Override unit detection.
     * @return {String} Ex. '03/11/2012'
     */
    subtractDateUnit: function(str, amount, unit) {
      return Graph.addDateUnit(str, -1 * amount, unit);
    },

    /**
     * Detect a formatted date/time's unit.
     *
     * @param str {String} Ex. '03/12/2012'.
     * @param hint {String} (Optional) Unit hint.
     * - Ex. 'second' hint will tie-break a regex match on 'minute|second'.
     * @return {String} minute, hour, day, month, year
     */
    detectDateUnit: function(str, hint) {
      var match = null;
      _.any(Graph.formatRegex, function(regex, unit) {
        if (str.match(regex)) {
          var candidates = unit.split('|');
          if (hint) {
            var hintIndex = _.indexOf(candidates, hint);
            // Unhelpful hint, just pick the first one.
            match = -1 == hintIndex ? candidates[0] : candidates[hintIndex];
          } else {
            match = candidates[0];
          }
          return true;
        }
        return false;
      });
      return match;
    },

    /**
     * Trim trailing zeros off 'mm/dd/yyyy hh:mm:ii' strings.
     *
     * @param date {String}
     * @return {String}
     */
     trimDate: function(date) {
       return date
         .replace(/ 00:00:00/, '')
         .replace(/:00:00/, ':00')
         .replace(/(:\d{2}):00$/, '$1');
     },

     /**
      * Return the magnitude of a given number.
      *
      * @param num {Number|String}
      * @return Number
      */
     magnitude: function(num) {
       num = _.isNumber(num) ? num : parseInt(num, 10);
       return Math.floor((Math.log(num))/(Math.log(10)));
     }
  };
});
