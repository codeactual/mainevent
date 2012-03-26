define([
  'views/Dashboard',
  'jquery.jqplot'
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
