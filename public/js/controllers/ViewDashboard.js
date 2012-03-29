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
  return function() {
    return new view({
      el: $('#backbone-view')
    });
  };
});
