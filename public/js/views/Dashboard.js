define([
    'views/TimelineSearch',
    'views/CountAllPartitioned'
  ], function(TimelineSearch, CountAllPartitioned) {

  'use strict';

  // Dashboard container.
  return Backbone.View.extend({

    subViews: {
      // 'Create From Search' modal.
      search: null
    },

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
      this.render();
    },

    events: {
      'change #dashboard-header-grid .time-interval': 'onTimeIntervalChange',
      'change #dashboard-header-grid .parser': 'onParserChange',
      'click #dashboard-create-from-search': 'onCreateFromSearch',
      'click #dashboard-cancel-search': 'onCancelSearch',
      'click #dashboard-related-timeline': 'onRelatedTimeline'
    },

    onClose: function() {
      if (this.subViews.search) {
        mainevent.helpers.Event.off('TimelineSearchSubmit', this.onSearchSubmit);
      }
    },

    /**
     * "Last 1 min"-type drop-down changes.
     */
    onTimeIntervalChange: function() {
      var interval = this.$('.time-interval').val(),
          now = (new Date()).getTime(),
          changed = {'time-gte': now - interval, 'time-lte': now};

      // Apply state change to listening dashboards.
      mainevent.helpers.Event.trigger('DashboardArgsChange', changed);

      // Save the new state.
      this.options.dashArgs['time-gte'] = changed['time-gte'];
      this.options.dashArgs['time-lte'] = changed['time-lte'];
    },

    /**
     * "Any Event Type"-type drop-down changes.
     */
    onParserChange: function() {
      var changed = {parser: this.$('.parser').val()};

      // Apply state change to listening dashboards.
      mainevent.helpers.Event.trigger('DashboardArgsChange', changed);

      // Save the new state.
      this.options.dashArgs.parser = changed.parser;
    },

    /**
     * Clicked 'Create From Search' button.
     */
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
        if (view.searchMode) {
          if (view.options.dashArgs['time-lte']) {
            view.searchTimeInterval.val(
              view.options.dashArgs['time-lte'] - view.options.dashArgs['time-gte']
            );
          }
          view.searchParser.val(view.options.dashArgs.parser);
        } else {
          view.searchTimeInterval.val(view.dashTimeInterval.val());
          view.searchParser.val(view.dashParser.val());
        }
      };

      if (this.searchModal.is(':visible')) {
        return;
      }

      if (this.subViews.search) {
        syncDropDowns();
        this.searchModal.modal('show');
      } else {
        mainevent.helpers.Event.on('TimelineSearchSubmit', this.onSearchSubmit, this);
        this.subViews.search = new TimelineSearch({
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
     * Submitted search modal form.
     */
    onSearchSubmit: function(searchArgs) {
      // Sync the drop-downs and state.
      this.options.dashArgs = _.clone(searchArgs);
      delete this.options.dashArgs.interval;

      // Trigger the data fetch and graph refresh.
      mainevent.helpers.Event.trigger('DashboardArgsChange', {query: this.options.dashArgs});

      this.searchMode = true;
      this.toggleDropDowns();
    },

    /**
     * Clicked 'Cancel Search' button that replaced the dashboard's drop-down
     * controls after the search modal form was submitted.
     */
    onCancelSearch: function(event) {
      event.preventDefault();
      this.searchMode = false;
      this.toggleDropDowns();
      this.navigate('dashboard');
    },

    /**
     * Clicked 'Related Timeline' button.
     */
    onRelatedTimeline: function(event) {
      event.preventDefault();
      this.navigate('timeline', this.options.dashArgs);
    },

    /**
     * Show/hide dashboard drop-downs (and show/hide the 'Cancel Search' button)
     * based on the current 'searchMode' value. 'searchMode' is set to TRUE
     * after search modal forms are submitted; set to FALSE after 'Cancel Search'
     * is clicked.
     */
    toggleDropDowns: function() {
      if (this.searchMode) {
        this.$('#dashboard-search-mode-controls').show();
        this.$('#dashboard-dropdowns').hide();
        this.$('#dashboard-create-from-search').addClass('btn-primary');
      } else {
        this.$('#dashboard-search-mode-controls').hide();
        this.$('#dashboard-dropdowns').show();
        this.$('#dashboard-create-from-search').removeClass('btn-primary');
      }
    },

    /**
     * Render basic template and sub-view containers. Then create all necessary
     * sub-views and let them render their graph independently.
     */
    render: function() {
      var view = this;
      dust.render(
        'dashboard',
        null,
        function(err, out) {
          view.$el.html(out);
          view.renderCountAllPartitioned();

          var parser = $('#dashboard-header-grid .parser'),
              timeInterval = $('#dashboard-header-grid .time-interval');

          if (parser) {
            mainevent.helpers.Widget.fillParserSelect(parser, false);
            parser.val(view.options.dashArgs.parser);
          }
          if (timeInterval) {
            mainevent.helpers.Widget.fillPresetTimeSelect(timeInterval, false);
            timeInterval.val(view.options.dashArgs['time-lte'] - view.options.dashArgs['time-gte']);
          }
        }
      );
    },

    /**
     * Create the sub-view for the "main" (largest/most prominent) graph.
     */
    renderCountAllPartitioned: function() {
      // Graph arguments came from drop-down changes.
      if (this.options.dashArgs['dd']) {
        // Avoid having 'dd' used as a query condition.
        delete this.options.dashArgs['dd'];
        var initialDashArgs = this.options.dashArgs;

      // Default dashboard.
      } else if (_.isEqual(this.options.defaultDashArgs, this.options.dashArgs)) {
        var initialDashArgs = this.options.dashArgs;

      // Apply any route-based search arguments, e.g. a dashboard created from
      // a search was refreshed by the user.
      } else {
        // Search arguments detected -- wrap in a query object.
        var initialDashArgs = {query: this.options.dashArgs};

        this.searchMode = true;
        this.toggleDropDowns();
      }

      this.subViews.mainGraph = new CountAllPartitioned({el: $('#dashboard-main-graph')});

      // Reuse the change event so the arguments pass through the same logic
      // as do changes originating from drop-downs or search modal.
      mainevent.helpers.Event.trigger('DashboardArgsChange', initialDashArgs);
    }
  });
});
