define([], function() {

  'use strict';

  return Backbone.View.extend({
    graphId: null,

    interval: '',

    initialize: function(options) {
      this.render();

      var view = this;
      diana.helpers.Event.on('DashboardTimeIntervalChange', function(interval) {
        view.interval = interval;
        view.render();
      });
    },

    render: function() {
      // Use convention-based IDs so markup can just hold positional containers.
      this.graphId = this.el.id + '-canvas';

      var url = this.buildUrl('/job/count_all_graph?', {
        interval: this.interval
      }, false);

      var view = this;
      $.ajax(
        url, {
        success: function(data) {
          view.$el.empty();
          view.$el.append($('<div>').attr('id', view.graphId));

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
              view.graphId,
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
