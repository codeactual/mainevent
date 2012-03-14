'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.views = window.diana.views || {};
  var diana = window.diana;

  /**
   * Displays a single <table> row for a single Event in the result set.
   */
  diana.views.TimelineEvent = Backbone.View.extend({
    initialize: function() {
      this.model.bind('change', this.render, this);
    },
    render: function(callback) {
      this.model.attributes.time = moment(this.model.attributes.time * 1000).fromNow();
      dust.render(
        'timeline_table_row',
        this.model.toJSON(),
        function(err, out) {
          $('#timeline-table tbody').append(out);
        }
      );
    }
  });
})();
