'use strict';

define(['views/Event'], function(view) {

  /**
   * Handler for /#event/:id requests.
   *
   * @param id {String} Event ID.
   * @return {Object} View object.
   */
  return function(id, intReferer) {
    return new view({
      id: id,
      el: $('#backbone-view'),
      intReferer: intReferer
    });
  };
});
