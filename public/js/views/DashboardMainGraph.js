define([], function() {

  'use strict';

  var Graph = diana.helpers.Graph;

  return Backbone.View.extend({

    /**
     * Object retrieved by fetchJobResult().
     */
    data: null,

    /**
     * Defined during render().
     */
    jqplotId: null,

    /**
     * Callback for window resize events.
     */
    resizeGraph: null,

    initialize: function(options) {
      this.options.dashArgs = options.dashArgs || {};

      diana.helpers.Event.on('DashboardArgsChange', this.onArgsChange, this);

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
      diana.helpers.Event.off('DashboardArgsChange', this.onArgsChange);
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

        view.runJobAndFetchResult(function() {
          view.render.call(view);
        });

        // Save a history point but don't trigger the router.
        var dashArgs = _.clone(view.options.dashArgs);
        view.navigate('dashboard', dashArgs, {trigger: false});

      } else {
        // Merge changed args with current.
        view.options.dashArgs = _.extend(view.options.dashArgs, changed);

        view.fetchJobResult(function() {
          view.render.call(view);
        });

        // Save a history point but don't trigger the router.
        var dashArgs = _.clone(view.options.dashArgs);
        dashArgs['dd'] = 1; // Indicate change came from drop-downs, not search.
        view.navigate('dashboard', dashArgs, {trigger: false});
      }

      this.changed++;
    },

    /**
     * Run the graph data job with an ad-hoc query, ex. total JSON events
     * between timestamp X and Y with the condition 'code > 200'.
     */
    runJobAndFetchResult: function(callback) {
      var dashArgs = _.clone(this.options.dashArgs);

      var view = this,
          url = this.buildUrl(
            '/jobrun/count_all_graph?',
            dashArgs,
            false
          );

      $.ajax(
        url, {
          success: function(data) {
            view.data = data;
            data = null;
            callback();
          }
        }
      );
    },

    /**
     * Fetch a pre-cached result set, ex. total JSON events from the last 1 day.
     */
    fetchJobResult: function(callback) {
      var view = this,
          url = _.filterTruthy([
            '/jobresult/count_all_graph',
            this.options.dashArgs.parser,
            this.options.dashArgs['time-lte'] - this.options.dashArgs['time-gte']
          ]).join('_');
      $.ajax(
        url, {
          success: function(data) {
            view.data = data;
            data = null;
            callback();
          }
        }
      );
    },

    render: function() {
      // Use convention-based IDs so markup can just hold positional containers.
      this.jqplotId = this.el.id + '-canvas';

      var view = this;
          view.$el.empty();
          view.$el.append($('<div>').attr('id', view.jqplotId));

      var defaultAxes = {
        xaxis: {
          renderer: $.jqplot.DateAxisRenderer
        }
      };

      if (_.size(this.data)) {
        var graphData = [];
        _.each(this.data, function(result, time) {
          graphData.push([time, result.count]);
        });

        var axes = Graph.adjustAxes(view.$el, graphData, defaultAxes),
            title =
              'Total Events, '
              + Graph.trimDate(graphData[0][0])
              + ' - ' + Graph.trimDate(graphData[graphData.length - 1][0]);
      } else {
        var axes = defaultAxes,
             graphData = [[0,0]],
             title = 'No events found.';
      }

      try {
        $.jqplot(
          view.jqplotId,
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
