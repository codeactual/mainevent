'use strict';

define(['views/Dashboard' ], function(view) {

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
