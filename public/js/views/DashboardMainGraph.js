define([], function() {

  'use strict';

  return Backbone.View.extend({
    jqplotId: null,

    initialize: function(options) {
      this.render();

      var view = this;
      diana.helpers.Event.on('DashboardTimeIntervalChange', function(interval) {
        view.options.dashArgs.interval = interval;
        view.render();
      });
    },

    render: function() {
      // Use convention-based IDs so markup can just hold positional containers.
      this.jqplotId = this.el.id + '-canvas';

      var url = this.buildUrl('/job/count_all_graph?', {
        interval: this.options.dashArgs.interval
      }, false);

      var view = this;
      $.ajax(
        url, {
        success: function(data) {
          view.$el.empty();
          view.$el.append($('<div>').attr('id', view.jqplotId));

          var graphData = [];
          _.each(data, function(result, time) {
            graphData.push([time, result.count]);
          });

          var defaults = {
            xaxis: {
              renderer: $.jqplot.DateAxisRenderer
            }
          };
          var axes = diana.helpers.Graph.adjustAxes(graphData, defaults);

          try {
            $.jqplot(
              view.jqplotId,
              [graphData],
              {
                title: 'Events',
                axes: axes,
                series:[{lineWidth:2}]
              }
            );
          } catch (e) {
            if (e.message != 'No data to plot.') {
              console.log(e);
            }
          }
        }
      });
    }
  });
});
