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

      $('#time-gte').datetimepicker({});
      $('#time-lte').datetimepicker({});

      this.render();
    },

    render: function() {
      var view = this;
      var body = this.$('.modal-body');
      var parser = this.$('#parser');

      parser.append('<option value="">Any Type</option>');
      _.each(diana.parsers, function(name) {
        parser.append('<option value="' + name + '">' + name + '</option>');
      });

      var basicArgNames = ['time-gte', 'time-lte', 'sort-attr', 'sort-dir', 'parser'];
      _.each(basicArgNames, function(name) {
        if (view.options.searchArgs[name]) {
          if (('time-gte' == name || 'time-lte' == name)) {
            view.options.searchArgs[name] = moment(view.options.searchArgs[name] * 1000).format('MM/DD/YYYY HH:mm:ss');
          }
          view.$('#' + name).val(view.options.searchArgs[name]);
          delete view.options.searchArgs[name];
        }
      });

      // Add text boxes for each 'x = y' condition.
      var condCount = 0;
      var condPairModel = this.$('.condition-pair');
      _.each(this.options.searchArgs, function(value, key) {
        // Reuse markup for the 1st pair.
        var condPair = condCount++ ? condPairModel.clone() : condPairModel;
        $('input:nth-child(1)', condPair).val(key);
        $('input:nth-child(3)', condPair).val(value);
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
      var condPair = body.find('.condition-pair:last-child').clone();
      $('input:nth-child(1)', condPair).val('');
      $('input:nth-child(3)', condPair).val('');
      body.append(condPair);
    },

    /**
     * Collect all search arguments.
     *
     * @return {Object}
     */
    getSearchArgs: function() {
      var args = {};

      args['parser'] = $('#parser').val();
      args['time-gte'] = (new Date($('#time-gte').val())).getTime() / 1000;
      args['time-lte'] = (new Date($('#time-lte').val())).getTime() / 1000;

      // Collect 'x = y', 'x >= y', etc. condition pairs.
      var condPairs = this.$('.condition-pair').each(function(index, pair) {
        var input = $('input', pair);
        var conditional = $('select', pair).val();  // Ex. 'gte'
        if (conditional) {
          // Ex. args['code-gte'] = 302
          args[$(input[0]).val() + '-' + conditional] = $(input[1]).val();
        } else {
          // Ex. args['code'] = 302
          args[$(input[0]).val()] = $(input[1]).val();
        }
      });

      args['sort-attr'] = $('#sort-attr').val();
      if (args['sort-attr']) {
        args['sort-dir'] = $('#sort-dir').val();
      }

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
        if (!key.toString().length || !value.toString().length) {
          return;
        }
        if (_.isNaN(value)) {
          return;
        }
        urlArgs.push(key + '=' + value);
      });
      urlArgs = urlArgs.join('&');
      diana.navigate('timeline' + (urlArgs ? '/' + urlArgs : ''));
    }
  });
})();
