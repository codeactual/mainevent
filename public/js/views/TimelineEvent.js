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

    /**
     * Render a single event in the timeline table.
     *
     * @param options {Object}
     * - prepend {Boolean} If true, row is prepended (default=false).
     */
    render: function(options) {
      options = options || {
        prepend: false,
        highlight: false
      };

      this.model.attributes.time = moment(this.model.attributes.time * 1000).fromNow();

      dust.render(
        'timeline_table_row',
        this.model.toJSON(),
        function(err, out) {
          if (options.prepend) {
            var update = $(out);

            if (options.highlight) {
              update.addClass('timeline-update');
            }

            $('#timeline-table tbody').prepend(update);
          } else {
            $('#timeline-table tbody').append(out);
          }
        }
      );
    }
  });
})();
