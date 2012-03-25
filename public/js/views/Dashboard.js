'use strict';

define([
    'helpers/Widget'
  ], function(Widget) {

  // View the dashboard container.
  return Backbone.View.extend({
    initialize: function(options) {
      this.initKeyEvents({});
      this.render();
    },

    events: {
    },

    onClose: function() {
    },

    render: function() {
      var view = this;
      dust.render(
        'dashboard',
        null,
        function(err, out) {
          view.$el.html(out);
          require(['views/DashboardMainGraph'], function(DashboardMainGraph) {
            new DashboardMainGraph({
              el: $('#dashboard-main-graph')
            });
            Widget.fillParserSelect('#parser');
          });
        }
      );
    }
  });
});
