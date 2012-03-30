define([], function() {

  'use strict';

  // View the dashboard container.
  return Backbone.View.extend({
    interval: '',

    initialize: function(options) {
      this.initKeyEvents({});
      this.render();
    },

    events: {
      'change .time-interval': 'onTimeIntervalChange'
    },

    onTimeIntervalChange: function() {
      diana.helpers.Event.trigger(
        'DashboardTimeIntervalChange',
        this.$('.time-interval').val()
      );
    },

    render: function() {
      var view = this;
      dust.render(
        'dashboard',
        null,
        function(err, out) {
          view.$el.html(out);
          view.renderMainGraph();
          diana.helpers.Widget.fillParserSelect('#parser');

          var timeInterval = view.$('.time-interval');
          diana.helpers.Widget.fillPresetTimeSelect(timeInterval);
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
