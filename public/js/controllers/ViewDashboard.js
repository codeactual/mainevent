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
    var dashArgs = {interval: ''};

    if (undefined !== options) {
      // Ex. '/#dashboard/interval=60000'.
      var parts = options.split('&');
      _.each(parts, function(part) {
        // Ex. 'interval=60000'. Push key/value pairs into dashArgs.
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
