define([], function() {

  'use strict';

  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  /**
   * Global dispatch object.
   *
   * @author SendHub http://goo.gl/mEMwr
   */
  diana.helpers.Event = _.extend({}, Backbone.Events);

  /**
   * Global events.
   */
  $('body').delegate('.modal', 'show', function() {
    diana.helpers.Event.trigger('ModalOpen');
  });
  $('body').delegate('.modal', 'hide', function() {
    diana.helpers.Event.trigger('ModalClose');
  });
  $('body').delegate('a.disabled', 'click', function(event) {
    event.preventDefault();
  });
  // Use a global delegate to bypass view delegation/interception. Otherwise each
  // view's 'events' map would need to handle it redundantly.
  $('body').delegate('#keyboard-shortcuts', 'click', function(event) {
    event.preventDefault();
    diana.helpers.Event.trigger('KeyboardShortcutsHelp');
  });
});

