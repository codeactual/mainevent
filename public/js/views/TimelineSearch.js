'use strict';

define([], function() {

  /**
   * Displays the search box modal.
   */
  return Backbone.View.extend({
    datetimePickerFormat: 'MM/DD/YYYY HH:mm:ss',

    initialize: function(options) {
      this.options = _.defaults(options, {
        acceptAnyTime: true,
        acceptSortOptions: true
      });
      this.render();
    },

    render: function() {
      var view = this,
          modal = this.$('.modal-body'),
          parser = this.$('.parser'),
          coreArgSelectors = ['.parser'];

      this.$('.modal-header > h4').text(this.options.title);

      if (this.options.acceptAnyTime) {
        $('#time-gte,#time-lte').each(function() {
          var input = $(this);
          // Invalidate the preset time range after a custom one is selected.
          input.change(function() { view.$('.time-interval').val(''); });
          // Activate date/time widgets when inputs gain focus.
          input.datetimepicker({});
        });

        coreArgSelectors.push('#time-gte', '#time-lte');
      } else {
        $('.any-time').remove();
      }

      if (this.options.acceptSortOptions) {
        coreArgSelectors.push('#sort-attr', '#sort-dir');
      } else {
        $('.sort-option').remove();
      }

      // Populate drop-downs.
      mainevent.helpers.Widget.fillParserSelect(parser);
      mainevent.helpers.Widget.fillPresetTimeSelect(
        this.$('.time-interval'),
        this.options.acceptAnyTime
      );

      // Apply core attributes (e.g. 'parser') that are already represented
      // by drop-downs or other widgets. Remove them from view.options.searchArgs
      // so they are not redundantly represented as 'x = y' conditions below.
      _.each(coreArgSelectors, function(selector) {
        var name = selector.substr(1);
        if (_.has(view.options.searchArgs, name)) {
          var value = view.options.searchArgs[name];
          if (('time-gte' == name || 'time-lte' == name)) {
            value = moment(parseInt(value, 10)).format(view.datetimePickerFormat);
          }
          view.$(selector).val(value);
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
        modal.append(condPair);
      });
      if (condCount) { // And an extra to hint at expansion behavior.
        view.addConditionRow();
      }

      this.$el.modal('show');
      parser.focus().select();
    },

    events: {
      'submit': 'submit',
      'change .time-interval': 'applyPresetTime',
      'click #time-interval-clear': 'onTimeIntervalClear',
      'click .condition-pair .btn-danger': 'onConditionRowRemove',
      'focus .condition-pair:last-child': 'onLastConditionPairFocus'
    },

    /**
     * Submit search modal filters.
     *
     * @param event {Object} jQuery event object.
     */
    submit: function(event) {
      mainevent.helpers.Widget.closeModal(event);
      mainevent.helpers.Event.trigger('TimelineSearchSubmit', this.getSearchArgs());
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

    onTimeIntervalClear: function(event) {
      event.preventDefault();
      $('#time-interval,#time-gte,#time-lte').val('');
    },

    onConditionRowRemove: function(event) {
      event.preventDefault();
      if (this.$('.condition-pair').length > 1) {
        $(event.currentTarget).parent().remove();
      } else {
        $(event.currentTarget).parent().find('input,select').val('');
      }
    },

    onLastConditionPairFocus: function(event) {
      // Auto-expand the 'x = y' <input> rows.
      if (!$(event.target).hasClass('btn-danger')) {
        this.addConditionRow();
      }
    },

    /**
     * Append a pair of text boxes for defining 'x = y' conditions.
     */
    addConditionRow: function() {
      var modal = this.$('.modal-body');
      var condPair = modal.find('.condition-pair:last-child').clone();
      $('input:nth-child(1)', condPair).val('');
      $('input:nth-child(3)', condPair).val('');
      modal.append(condPair);
    },

    /**
     * Collect all search arguments.
     *
     * @return {Object}
     */
    getSearchArgs: function() {
      var args = {};

      args['parser'] = this.$('.parser').val();
      args['interval'] = this.$('.time-interval').val();

      if (this.options.acceptAnyTime) {
        args['time-gte'] = (new Date($('#time-gte').val())).getTime();
        args['time-lte'] = (new Date($('#time-lte').val())).getTime();
      } else {
        args['time-lte'] = (new Date()).getTime();
        args['time-gte'] = args['time-lte'] - args['interval'];
      }

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

      if (this.options.acceptSortOptions) {
        args['sort-attr'] = $('#sort-attr').val();
        if (args['sort-attr']) {
          args['sort-dir'] = $('#sort-dir').val();
        }
      }

      return args;
    }
  });
});
