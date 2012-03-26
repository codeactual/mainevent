define(['views/Dashboard' ], function(view) {

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
