define([], function() {

  'use strict';

  var Graph = diana.helpers.Graph;

  return Backbone.View.extend({
    /**
     * Object retrieved by fetchData().
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
      var view = this;

      this.fetchData(function() {
        view.render.call(view);
      });

      diana.helpers.Event.on('DashboardArgsChange', function(changed) {
        // Merge changed args with current.
        view.options.dashArgs = _.extend(view.options.dashArgs, changed);
        // Save a history point but don't trigger the router.
        view.navigate('dashboard', view.options.dashArgs, {trigger: false});
        // Apply updated args.
        view.fetchData(function() {
          view.render.call(view);
        });
      });

      this.resizeGraph = _.debounce(function() {
        view.render();
      }, 300),

      $(window).resize(view.resizeGraph);
    },

    onClose: function() {
      $(window).off('resize'. this.resizeGraph);
    },

    fetchData: function(callback) {
      var view = this,
          url = '/jobresult/count_all_graph'
            + (this.options.dashArgs.parser ? '_' + this.options.dashArgs.parser : '')
            + (this.options.dashArgs.interval ? '_' + this.options.dashArgs.interval : '');
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
            series: [{lineWidth:2}]
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
