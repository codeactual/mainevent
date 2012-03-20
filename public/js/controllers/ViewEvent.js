'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.controllers = window.diana.controllers || {};
  var diana = window.diana;

  /**
   * Handler for /#event/:id requests.
   *
   * @param id {String} Event ID.
   * @return {Object} View object.
   */
  diana.controllers.ViewEvent = function(id) {
   return new diana.views.Event({id: id, el: $('#content')});
  };
})();
