'use strict';

define([
  'order!underscore',
  'order!backbone'
  ], function() {

  /**
   * Global dispatch object.
   *
   * @author SendHub http://goo.gl/mEMwr
   */
  var Event = _.extend({}, Backbone.Events);

  /**
   * Global events.
   */
  $('body').delegate('.modal', 'show', function() {
    Event.trigger('ModalOpen');
  });
  $('body').delegate('.modal', 'hide', function() {
    Event.trigger('ModalClose');
  });
  $('body').delegate('a.disabled', 'click', function(event) {
    event.preventDefault();
  });
  // Use a global delegate to bypass view delegation/interception. Otherwise each
  // view's 'events' map would need to handle it redundantly.
  $('body').delegate('#keyboard-shortcuts', 'click', function(event) {
    event.preventDefault();
    Event.trigger('KeyboardShortcutsHelp');
  });

  return Event;
});

