'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.views = window.diana.views || {};
  var diana = window.diana;

  // View the dashboard container.
  diana.views.Dashboard = Backbone.View.extend({
    initialize: function(options) {
      this.initKeyEvents({});
      this.render();
      diana.helpers.Widget.fillParserSelect('#parser');
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
        }
      );
    }
  });
})();
