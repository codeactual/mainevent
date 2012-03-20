'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.views = window.diana.views || {};
  var diana = window.diana;

  /**
   * Displays the search box modal.
   */
  diana.views.TimelineSearch = Backbone.View.extend({
    initialize: function(options) {
      var view = this;

      // Auto-expand the 'x = y' <input> rows.
      $(this.el).delegate('.condition-pair:last-child', 'focus', function() {
        view.addConditionRow();
      });

      this.render();
    },

    render: function() {
      var body = this.$('.modal-body');

      // Add text boxes for each 'x = y' condition.
      var condCount = 0;
      var condPairModel = this.$('.condition-pair');
      _.each(this.options.searchArgs, function(value, key) {
        // Reuse markup for the 1st pair.
        var condPair = condCount++ ? condPairModel.clone() : condPairModel;
        $('input:nth-child(1)', condPair).val(key);
        $('input:nth-child(2)', condPair).val(value);
        body.append(condPair);
      });

      this.$el.modal('show');
    },

    events: {
      'submit': 'submit'
    },

    /**
     * Append a pair of text boxes for defining 'x = y' conditions.
     */
    addConditionRow: function() {
      var body = this.$('.modal-body');
      var condPair = this.$('.condition-pair:first-child').clone();
      $('input:nth-child(1)', condPair).val('');
      $('input:nth-child(2)', condPair).val('');
      body.append(condPair);
    },

    /**
     * Collect all search arguments.
     *
     * @return {Object}
     */
    getSearchArgs: function() {
      var args = {};

      // Collect all arbitrary 'x=y' condition pairs.
      var condPairs = this.$('.condition-pair').each(function(index, pair) {
        var input = $('input', pair);
        args[$(input[0]).val()] = $(input[1]).val();
      });

      return args;
    },

    /**
     * Submit search modal filters.
     *
     * @param event {Object} jQuery event object.
     */
    submit: function(event) {
      diana.helpers.Widget.closeModal(event);
      var urlArgs = [];
      _.each(this.getSearchArgs(), function(value, key) {
        if (key.length && value.length) {
          urlArgs.push(key + '=' + value);
        }
      });
      diana.navigate('timeline/' + urlArgs.join(';'));
    }
  });
})();
