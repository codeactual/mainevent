'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.views = window.diana.views || {};
  var diana = window.diana;

  /**
   * Displays the editor modal.
   */
  diana.views.EditSingleValue = Backbone.View.extend({
    initialize: function(options) {
      this.setElement('#edit-singlevalue-modal');
      this.render();
    },

    render: function() {
      this.$el.modal('show');
      this.$('#modal-title').text(this.options.title);
      this.$('.help-block').text(this.options.help);
      var input = this.$('input').focus().select();
      input.val(this.options.default || '')
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
      diana.helpers.Widget.closeModal(event);
      this.options.onEdit(this.$('input').val());
    }
  });
})();
