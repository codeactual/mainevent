define([
    'helpers/Widget'
  ], function(Widget) {

  'use strict';

  /**
   * Displays the editor modal.
   */
  return Backbone.View.extend({
    initialize: function(options) {
      this.setElement('#edit-singlevalue-modal');
      this.render();
    },

    render: function() {
      this.$el.modal('show');
      this.$('#modal-title').text(this.options.title);
      this.$('.help-block').text(this.options.help);
      var input = this.$('input').focus().select();
      input.val(this.options.defaults || '')
      input.attr('placeholder', this.options.placeholder);
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
      this.options.onEdit(this.$('input').val());
    }
  });
});
