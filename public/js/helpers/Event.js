define([], function() {

  'use strict';

  window.mainevent = window.mainevent || {};
  window.mainevent.helpers = window.mainevent.helpers || {};
  var mainevent = window.mainevent;

  /**
   * Global dispatch object.
   *
   * @author SendHub http://goo.gl/mEMwr
   */
  mainevent.helpers.Event = _.extend({}, Backbone.Events);

  /**
   * Global events.
   */
  $('body').delegate('.modal', 'show', function() {
    mainevent.helpers.Event.trigger('ModalOpen');
  });
  $('body').delegate('.modal', 'hide', function() {
    mainevent.helpers.Event.trigger('ModalClose');
  });
  $('body').delegate('a.disabled', 'click', function(event) {
    event.preventDefault();
  });
  $('body').delegate('a', 'click', function(event) {
    var href = $(this).attr('href');
    if (href[0] === '/') {
      event.preventDefault();
      mainevent.helpers.Event.trigger('LinkClick', href);
    };
  });
  // Use a global delegate to bypass view delegation/interception. Otherwise each
  // view's 'events' map would need to handle it redundantly.
  $('body').delegate('#keyboard-shortcuts', 'click', function(event) {
    event.preventDefault();
    mainevent.helpers.Event.trigger('KeyboardShortcutsHelp');
  });
});

