define([], function() {

  'use strict';

  return Backbone.View.extend({
    jqplotId: null,

    initialize: function(options) {
      this.render();

      var view = this;
      diana.helpers.Event.on('DashboardArgsChange', function(changed) {
        // Merge changed args with current.
        view.options.dashArgs = _.extend(view.options.dashArgs, changed);
        // Save a history point but don't trigger the router.
        view.navigate('dashboard', view.options.dashArgs, {trigger: false});
        // Apply updated args.
        view.render();
      });
    },

    render: function() {
      // Use convention-based IDs so markup can just hold positional containers.
      this.jqplotId = this.el.id + '-canvas';

      var url = this.buildUrl('/job/count_all_graph?', {
        interval: this.options.dashArgs.interval,
        parser: this.options.dashArgs.parser
      }, false);

      var view = this;
      $.ajax(
        url, {
        success: function(data) {
          view.$el.empty();
          view.$el.append($('<div>').attr('id', view.jqplotId));

          var defaultAxes = {
            xaxis: {
              renderer: $.jqplot.DateAxisRenderer
            }
          };

          if (_.size(data)) {
            var graphData = [];
            _.each(data, function(result, time) {
              graphData.push([time, result.count]);
            });

            var axes = diana.helpers.Graph.adjustAxes(graphData, defaultAxes);
          } else {
            var axes = defaultAxes;
            var graphData = [[0,0]];
            diana.helpers.Widget.alert('No events found.', 'info', 3);
          }

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
