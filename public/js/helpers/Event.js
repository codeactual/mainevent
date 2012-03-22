'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  /**
   * Global dispatch object.
   *
   * @author SendHub http://goo.gl/mEMwr
   */
  diana.helpers.Event = _.extend({}, Backbone.Events);

  $('body').delegate('.modal', 'show', function() {
    console.log('open');
    diana.helpers.Event.trigger('ModalOpen');
  });
  $('body').delegate('.modal', 'hide', function() {
    diana.helpers.Event.trigger('ModalClose');
  });
})();

