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
      this.render();
    },

    events: {
      'change #dashboard-header-grid .time-interval': 'onTimeIntervalChange',
      'change #dashboard-header-grid .parser': 'onParserChange',
      'click #create-from-search': 'onCreateFromSearch'
    },

    onTimeIntervalChange: function() {
      diana.helpers.Event.trigger(
        'DashboardArgsChange',
        {interval: this.$('.time-interval').val()}
      );
    },

    onParserChange: function() {
      diana.helpers.Event.trigger(
        'DashboardArgsChange',
        {parser: this.$('.parser').val()}
      );
    },

    onSearchSubmit: function(searchArgs) {
      var date = diana.shared.Date;
      searchArgs.interval = date.partitions[date.bestFitInterval(searchArgs.interval)];
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
          .val(view.dashTimeInterval.val())
          .trigger('change');
        view.searchParser
          .val(view.dashParser.val())
          .trigger('change');
      };

      if (this.searchModal.is(':visible')) {
        return;
      }

      if (this.searchView) {
        syncDropDowns();
        this.searchModal.modal('show');
      } else {
        diana.helpers.Event.on('TimelineSearchSubmit', this.onSearchSubmit);
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
