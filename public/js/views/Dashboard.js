define([
    'views/TimelineSearch'
  ], function(TimelineSearch) {

  'use strict';

  // View the dashboard container.
  return Backbone.View.extend({
    // Modal sub-views.
    searchView: null,

    // Reused selectors.
    searchModal: null,
    searchTimeInterval: null,
    searchParser: null,
    dashTimeInterval: null,
    dashParser: null,

    initialize: function(options) {
      this.initKeyEvents({
        'Create From Search': {
          keyChar: 's',
          callback: this.onCreateFromSearch
        }
      });
      this.wasCreatedFromSearch();
      this.render();
    },

    events: {
      'change #dashboard-header-grid .time-interval': 'onTimeIntervalChange',
      'change #dashboard-header-grid .parser': 'onParserChange',
      'click #create-from-search': 'onCreateFromSearch'
    },

    onTimeIntervalChange: function() {
      var interval = this.$('.time-interval').val(),
          now = (new Date()).getTime(),
          changed = {'time-gte': now - interval, 'time-lte': now};

      if (this.wasCreatedFromSearch()) {
        changed = {query: _.extend(_.clone(this.options.dashArgs), changed)};
      }
      diana.helpers.Event.trigger('DashboardArgsChange', changed);

      this.options.dashArgs['time-gte'] = changed['time-gte'];
      this.options.dashArgs['time-lte'] = changed['time-lte'];
    },

    onParserChange: function() {
      var changed = {parser: this.$('.parser').val()};
      if (this.wasCreatedFromSearch()) {
        changed = {query: _.extend(_.clone(this.options.dashArgs), changed)};
      }
      diana.helpers.Event.trigger('DashboardArgsChange', changed);
    },

    onSearchSubmit: function(searchArgs) {
      // Sync the drop-downs and state.
      this.dashParser.val(this.searchParser.val());
      this.dashTimeInterval.val(this.searchTimeInterval.val());
      this.options.dashArgs = searchArgs;

      // Trigger the data fetch and graph refresh.
      diana.helpers.Event.trigger('DashboardArgsChange', {query: searchArgs});
    },

    onCreateFromSearch: function(event) {
      event.preventDefault();

      if (!this.searchModal) {
        this.searchModal = $('#timeline-search-modal');
        this.searchTimeInterval = this.searchModal.find('.time-interval');
        this.searchParser = this.searchModal.find('.parser');
        this.dashTimeInterval = this.$('.time-interval');
        this.dashParser = this.$('.parser');
      }

      // Synchronize the search modal's time-interval with the dashboard's.
      // Trigger a change so that the start/end dates adjusted relative to now.
      var view = this;
      var syncDropDowns = function() {
        view.searchTimeInterval
          .val(view.dashTimeInterval.val());
        view.searchParser
          .val(view.dashParser.val());
      };

      if (this.searchModal.is(':visible')) {
        return;
      }

      if (this.searchView) {
        syncDropDowns();
        this.searchModal.modal('show');
      } else {
        diana.helpers.Event.on('TimelineSearchSubmit', this.onSearchSubmit, this);
        this.searchView = new TimelineSearch({
          el: this.searchModal,
          searchArgs: {},
          title: 'Create From Search',
          acceptAnyTime: false,
          acceptSortOptions: false
        });
        syncDropDowns();
      }
    },

    /**
     * Check if the current dashboard arguments were created from a submitted search.
     *
     * @return {Boolean}
     */
    wasCreatedFromSearch: function() {
      return _.without(Object.keys(this.options.dashArgs), ['time-gte', 'time-lte', 'parser']).length > 0;
    },

    render: function() {
      var view = this;
      dust.render(
        'dashboard',
        null,
        function(err, out) {
          view.$el.html(out);
          view.renderMainGraph();

          var parser = $('#dashboard-header-grid .parser'),
              timeInterval = $('#dashboard-header-grid .time-interval');

          diana.helpers.Widget.fillParserSelect(parser);
          parser.val(view.options.dashArgs.parser);

          diana.helpers.Widget.fillPresetTimeSelect(timeInterval, false);
          timeInterval.val(view.options.dashArgs.interval);
        }
      );
    },

    renderMainGraph: function() {
      var view = this;
      require(['views/DashboardMainGraph'], function(DashboardMainGraph) {
        view.mainGraph = new DashboardMainGraph({
          el: $('#dashboard-main-graph'),
          dashArgs: view.options.dashArgs
        });
      });
    }
  });
});
