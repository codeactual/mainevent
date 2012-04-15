define([], function() {

  'use strict';

  var Graph = mainevent.helpers.Graph;

  return Backbone.View.extend({

    /**
     * Callback for window resize events.
     */
    resizeGraph: null,

    initialize: function(options) {
      this.options.dashArgs = options.dashArgs || {};

      mainevent.helpers.Event.on('DashboardArgsChange', this.onArgsChange, this);

      /**
       * Re-render the graph, in response to resize events, every 300ms at the most.
       */
      var view = this;
      this.resizeGraph = _.debounce(function() {
        view.render();
      }, 300),
      $(window).on('resize', view.resizeGraph);
    },

    onClose: function() {
      $(window).off('resize', this.resizeGraph);
      mainevent.helpers.Event.off('DashboardArgsChange', this.onArgsChange);
    },

    /**
     * Triggered by search/drop-down events in the parent Dashboard view.
     *
     * @param changed {Object} Pairs that have changed since the last event.
     * - Search events must be wrapped: {query: {k: v, ...}}.
     * - Non-search events: {k: v, ...}
     */
    onArgsChange: function(changed) {
      var view = this;

      // Change triggerd by search modal submit.
      if (changed.query) {
        // Replace dashboard settings with submitted args.
        view.options.dashArgs = changed.query;

        view.renderPointsFromAdhocJob();

        // Save a history point but don't trigger the router.
        var dashArgs = _.clone(view.options.dashArgs);
        view.navigate('dashboard', dashArgs, {trigger: false});

      } else {
        // Merge changed args with current.
        view.options.dashArgs = _.extend(view.options.dashArgs, changed);

        view.renderPointsFromCache();

        // Save a history point but don't trigger the router.
        var dashArgs = _.clone(view.options.dashArgs);
        dashArgs['dd'] = 1; // Indicate change came from drop-downs, not search.

        // Don't re-navigate after opening /dashboard.
        if (!_.isEqual(view.options.defaultDashArgs, changed)) {
          view.navigate('dashboard', dashArgs, {trigger: false});
        }
      }
    },

    /**
     * Run the MapReduce job for this graph, ex. total JSON events
     * between timestamp X and Y with the condition 'code > 200',
     * and render the results.
     */
    renderPointsFromAdhocJob: function() {
      var dashArgs = _.clone(this.options.dashArgs),
          date = mainevent.shared.Date,
          span = dashArgs['time-lte'] - dashArgs['time-gte'];

      dashArgs.partition = date.partitions[date.bestFitInterval(span)];

      var view = this,
          url = this.buildUrl(
            '/api/job/CountAllPartitioned',
            dashArgs,
            false
          );

      $.ajax(
        url, {
          success: function(data) {
            view.render(_.clone(data));
          }
        }
      );
    },

    /**
     * Render the graph from data points cached by a background process.
     */
    renderPointsFromCache: function() {
      var dashArgs = _.clone(this.options.dashArgs),
          date = mainevent.shared.Date,
          span = dashArgs['time-lte'] - dashArgs['time-gte'];

      dashArgs.partition = date.partitions[date.bestFitInterval(span)];

      var view = this,
          url = this.buildUrl(
            '/api/graph/CountAllPartitioned',
            dashArgs,
            false
          );

      $.ajax(
        url, {
          success: function(data) {
            view.render(_.clone(data));
          }
        }
      );
    },

    render: function(data) {
      // Use convention-based IDs so markup can just hold positional containers.
      var jqplotId = this.el.id + '-canvas',
          defaultAxes = {
            xaxis: {
              renderer: $.jqplot.DateAxisRenderer
            }
          };

      // Remove existing graph.
      this.$el.empty();
      this.$el.append($('<div>').attr('id', jqplotId));

      if (_.size(data)) {
        var graphData = [];
        _.each(data, function(result, time) {
          graphData.push([time, result.count]);
        });

        var axes = Graph.adjustAxes(this.$el, graphData, defaultAxes),
            title =
              mainevent.shared.Date.formatTime(parseInt(this.options.dashArgs['time-gte'], 10))
              + ' &mdash; ' +  mainevent.shared.Date.formatTime(parseInt(this.options.dashArgs['time-lte'], 10));
      } else {
        var axes = defaultAxes,
             graphData = [[0,0]],
             title = 'No events found.';
      }

      try {
        $.jqplot(
          jqplotId,
          [graphData],
          {
            title: title,
            axes: axes,
            series: [{lineWidth: 1}],
            highlighter: {
              show: true,
              sizeAdjust: 7.5,
            },
            cursor: {
              show: false
            }
          }
        );
      } catch (e) {
        if (e.message != 'No data to plot.') {
          console.log(e);
        }
      }
    }
  });
});
