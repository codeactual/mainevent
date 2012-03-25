'use strict';

define([
    'helpers/Widget',
    'templates',
    'bootstrap-modal'
  ], function(Widget) {

  /**
   * Displays the shortcut list modal.
   */
  return Backbone.View.extend({
    initialize: function(options) {
      this.setElement('#keyboard-shortcuts-modal');
      this.render();
    },

    events: {
      'submit': 'submit'
    },

    /**
     * Use the injected setter to save the value.
     *
     * @param event {Object} jQuery event object.
     */
    submit: function(event) {
      Widget.closeModal(event);
    },

    render: function() {
      // Remove elements added by past renderings.
      this.$('tr').slice(1).remove();

      var view = this;
      var list = this.$('tbody');
      var count = 0;
      _.each(this.options.keyEventConfig, function(handlers) {
        _.each(handlers, function(handler) {
          // One <tr> already exists. Use it for the 1st, clones for the rest.
          var itemProto = view.$('table tr:first-child')
          var item = count ? itemProto.clone() : itemProto;

          var modifiers = [];
          if (handler.shiftKey) { modifiers.push('<Shift>'); }
          if (handler.ctrlKey) { modifiers.push('<Ctrl>'); }

          var keyChar = handler.keyChar;
          if (modifiers.length) {
            keyChar = modifiers.join() + ' + ' + keyChar;
          }
          item.find('.keyChar').text(keyChar + ':');
          item.find('.description').text(handler.description);
          count++ == 0 || list.append(item);
        });
      });
      this.$el.modal('show');
    }
  });
});
