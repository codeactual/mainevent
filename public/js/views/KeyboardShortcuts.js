'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.views = window.diana.views || {};
  var diana = window.diana;

  /**
   * Displays the shortcut list modal.
   */
  diana.views.KeyboardShortcuts = Backbone.View.extend({
    initialize: function(options) {
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
      diana.helpers.Widget.closeModal(event);
    },

    render: function() {
      this.setElement('#keyboard-shortcuts-modal');
      this.$el.modal('show');
    }
  });
})();
