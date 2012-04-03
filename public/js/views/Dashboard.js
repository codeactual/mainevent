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

    // Toggled TRUE by search modal submission,
    // toggled FALSE by clicks to 'Cancel Search' button.
    searchMode: false,

    initialize: function(options) {
      this.initKeyEvents({
        'Create From Search': {
          keyChar: 's',
          callback: this.onCreateFromSearch
        }
      });
      diana.helpers.Event.on('DashboardArgsChange', this.toggleDropDowns, this);
      this.render();
    },

    events: {
      'change #dashboard-header-grid .time-interval': 'onTimeIntervalChange',
      'change #dashboard-header-grid .parser': 'onParserChange',
      'click #dashboard-create-from-search': 'onCreateFromSearch',
      'click #dashboard-cancel-search': 'onCancelSearch'
    },

    onTimeIntervalChange: function() {
      var interval = this.$('.time-interval').val(),
          now = (new Date()).getTime(),
          changed = {'time-gte': now - interval, 'time-lte': now};

      diana.helpers.Event.trigger('DashboardArgsChange', changed);

      this.options.dashArgs['time-gte'] = changed['time-gte'];
      this.options.dashArgs['time-lte'] = changed['time-lte'];
    },

    onParserChange: function() {
      var changed = {parser: this.$('.parser').val()};
      diana.helpers.Event.trigger('DashboardArgsChange', changed);
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
      // Trigger a change so that the start/end dates toggled relative to now.
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

    onSearchSubmit: function(searchArgs) {
      // Sync the drop-downs and state.
      this.dashParser.val(this.searchParser.val());
      this.dashTimeInterval.val(this.searchTimeInterval.val());
      this.options.dashArgs = _.clone(searchArgs);
      delete this.options.dashArgs.interval;

      // Trigger the data fetch and graph refrashArgs
      diana.helpers.Event.trigger('DashboardArgsChange', {query: this.options.dashArgs});

      this.searchMode = true;
      this.toggleDropDowns();
    },

    onCancelSearch: function(event) {
      event.preventDefault();
      this.searchMode = false;
      this.toggleDropDowns();
      this.navigate('dashboard');
    },

    toggleDropDowns: function() {
      if (this.searchMode) {
        this.$('#dashboard-search-mode-controls').show();
        this.$('#dashboard-dropdowns').hide();
      } else {
        this.$('#dashboard-search-mode-controls').hide();
        this.$('#dashboard-dropdowns').show();
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
          timeInterval.val(view.options.dashArgs['time-lte'] - view.options.dashArgs['time-gte']);
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
