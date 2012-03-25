'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.controllers = window.diana.controllers || {};
  var diana = window.diana;

  /**
   * Handler for / requests.
   *
   * @return {Object} View object.
   */
  diana.controllers.ViewDashboard = function() {
    return new diana.views.Dashboard({
      el: $('#backbone-view')
    });
  };
})();
