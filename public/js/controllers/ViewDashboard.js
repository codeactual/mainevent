define([
  'order!views/Dashboard',
  'order!helpers/Graph',
  'order!jquery.jqplot',
  'order!jqplot.dateAxisRenderer'
  ], function(view) {

  'use strict';

  /**
   * Handler for / requests.
   *
   * @return {Object} View object.
   */
  return function(options) {
    var now = (new Date()).getTime(),
        dashArgs = {
        'time-gte': now - 60000,
        'time-lte': now,
        parser: ''
      };

    if (undefined !== options) {
      // Ex. '/#dashboard/time-gte=1333494849798&time-lte=1333495749798'.
      var parts = options.split('&');
      _.each(parts, function(part) {
        // Ex. 'time-lte=1333495749798'. Push key/value pairs into dashArgs.
        var assign_part = part.split('=');
        if (2 == assign_part.length) {
          dashArgs[assign_part[0]] = assign_part[1];
        }
      });
    }

    return new view({
      el: $('#backbone-view'),
      dashArgs: dashArgs
    });
  };
});
