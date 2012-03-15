'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.controllers = window.diana.controllers || {};
  var diana = window.diana;

  /**
   * Handler for /#event/:id requests.
   *
   * @param id {String} Event ID.
   */
  diana.controllers.ViewEvent = function(id) {
    new diana.views.Event({id: id});
  };
})();
