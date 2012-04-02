'use strict';

define([], function() {

  /**
   * Displays the search box modal.
   */
  return Backbone.View.extend({
    datetimePickerFormat: 'MM/DD/YYYY HH:mm:ss',

    initialize: function(options) {
      this.render();
    },

    render: function() {
      var view = this;
      var body = this.$('.modal-body');
      var parser = this.$('.parser');

      this.$('.modal-header > h4').text(this.options.title);

      // Auto-expand the 'x = y' <input> rows.
      $(this.el).delegate('.condition-pair:last-child', 'focus', function(event) {
        if (!$(event.target).hasClass('btn-danger')) {
          view.addConditionRow();
        }
      });

      $('#time-gte,#time-lte').each(function() {
        var input = $(this);
        // Invalidate the preset time range after a custom one is selected.
        input.change(function() { view.$('.time-interval').val(''); });
        // Activate date/time widgets when inputs gain focus.
        input.datetimepicker({});
      });

      // Each trash can button will remove the adjacent condition row,
      // or clear the last remaining row's values.
      $(this.el).delegate('.btn-danger', 'click', function(event) {
        event.preventDefault();
        if (view.$('.condition-pair').length > 1) {
          view.$(this).parent().remove();
        } else {
          view.$(this).parent().find('input,select').val('');
        }
      });

      $('#time-interval-clear').on('click', function(event) {
        event.preventDefault();
        $('#time-interval,#time-gte,#time-lte').val('');
      });

      diana.helpers.Widget.fillParserSelect(parser);
      diana.helpers.Widget.fillPresetTimeSelect(this.$('.time-interval'));

      var basicArgNames = ['time-gte', 'time-lte', 'sort-attr', 'sort-dir', 'parser'];
      _.each(basicArgNames, function(name) {
        if (_.has(view.options.searchArgs, name)) {
          var value = view.options.searchArgs[name];
          if (('time-gte' == name || 'time-lte' == name)) {
            value = moment(parseInt(value, 10)).format(view.datetimePickerFormat);
          }
          view.$('#' + name).val(value);
          delete view.options.searchArgs[name];
        }
      });

      // Add text boxes for each 'x = y' condition.
      var condCount = 0;
      var condPairModel = this.$('.condition-pair');
      _.each(this.options.searchArgs, function(value, key) {
        if ('skip' == key || 'limit' == key) {
          return;
        }

        // Reuse markup for the 1st pair.
        var condPair = condCount++ ? condPairModel.clone() : condPairModel;
        $('input:nth-child(1)', condPair).val(key);
        $('input:nth-child(3)', condPair).val(value);
        body.append(condPair);
      });
      if (condCount) { // And an extra to hint at expansion behavior.
        view.addConditionRow();
      }

      this.$el.modal('show');
      parser.focus().select();
    },

    events: {
      'submit': 'submit',
      'change .time-interval': 'applyPresetTime'
    },

    /**
     * Submit search modal filters.
     *
     * @param event {Object} jQuery event object.
     */
    submit: function(event) {
      diana.helpers.Widget.closeModal(event);
      this.navigate('timeline', this.getSearchArgs());
    },

    /**
     * Update time range inputs with a preset relative range.
     *
     * @param event {Object} jQuery event object.
     */
    applyPresetTime: function(event) {
      $('#time-gte').val(moment().subtract('milliseconds', this.$('.time-interval').val()).format(this.datetimePickerFormat));
      $('#time-lte').val(moment().format(this.datetimePickerFormat));

      // Ex. search modal may be a sub-view of the dashboard, which also
      // has a time interval drop-down that reuses the same class.
      event.stopImmediatePropagation();
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

      args['parser'] = this.$('.parser').val();
      args['time-gte'] = (new Date($('#time-gte').val())).getTime();
      args['time-lte'] = (new Date($('#time-lte').val())).getTime();

      // Collect 'x = y', 'x >= y', etc. condition pairs.
      var condPairs = this.$('.condition-pair').each(function(index, pair) {
        var input = $('input', pair),
            key = $(input[0]).val();

        if (!key.length) {
          return;
        }

        var conditional = $('select', pair).val();  // Ex. 'gte'
        if (conditional) {
          // Ex. args['code-gte'] = 302
          args[key + '-' + conditional] = $(input[1]).val();
        } else {
          // Ex. args['code'] = 302
          args[key] = $(input[1]).val();
        }
      });

      args['sort-attr'] = $('#sort-attr').val();
      if (args['sort-attr']) {
        args['sort-dir'] = $('#sort-dir').val();
      }

      return args;
    }
  });
});
