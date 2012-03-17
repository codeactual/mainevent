'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.views = window.diana.views || {};
  var diana = window.diana;

  // Reuse the socket if the view is reopened w/out a page refresh.
  var socket = null;

  /**
   * Displays the <table> into which result sets are rendered. Automatically
   * fetches the result set based on router options passed via initialize().
   */
  diana.views.Timeline = Backbone.View.extend({
    el: $(diana.viewContainer),

    // Track the most recent event ID seen by initial fetch() and automatic updates.
    newestEventId: null,

    /**
     * Render the base timeline template.
     */
    initialize: function(options) {
      var view = this;

      $.when(
        diana.helpers.ViewCache.deferRender(
          'timeline_table',
          null,
          function(err, out) {
            $(diana.viewContainer).html(out);
          }
        )
      ).done(function() {
        view.renderTimeline.call(view);
      });
    },

    /**
     * Render timeline rows into a preexisting table.
     */
    renderTimeline: function() {
      var view = this;

      // Supply search filters/options for the collection's URL generation.
      view.collection = new diana.collections.Timeline(
        null, {searchArgs: view.options.searchArgs}
      );

      view.collection.fetch({
        success: function(collection, response) {
          if (!response.length) {
            dust.render('timeline_no_results', null, function(err, out) {
              $(diana.viewContainer).html(out);
            });
            return;
          }

          // Append a new <tr> for each event.
          var renderings = [];
          _.each(response, function(event) {
            renderings.push(view.renderEvent(event));
          });

          $.when(renderings).done(function() {
            view.options.cacheSetter($('*', diana.viewContainer).clone());
            view.startTimelineUpdate.call(view, response[0]._id);
          });
        },

        error: function(collection, response) {
          diana.helpers.Event.onFetchError(response);
        }
      });
    },

    /**
     * Render a single event in the timeline table.
     *
     * @param event {Object}
     * @param options {Object}
     * - prepend {Boolean} If true, row is prepended (default=false).
     */
    renderEvent: function(event, options) {
      options = options || {
        prepend: false,
        highlight: false
      };

      event.time = moment(event.time * 1000).fromNow();

      return diana.helpers.ViewCache.deferRender(
        'timeline_table_row',
        event,
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
    },

    /**
     * Creates the automatic updates socket. Also handles reconnection and diverts
     * update payloads.
     *
     * @param initialId {String} All updates (if any) will be newer than this ID.
     */
    startTimelineUpdate: function(initialId) {
      if (socket || !diana.features.timelineUpdate) {
        return;
      }

      var view = this;
      view.newestEventId = initialId;

      socket = diana.helpers.Socket.reuse({
        event: {
          connect: function() {
            // Start/restart automatic updates.
            socket.emit('startTimelineUpdate', view.newestEventId);
          }
        }
      });

      // Update the view with events fresher than newestEventId.
      socket.on('timelineUpdate', function(data) {
        view.onTimelineUpdate.call(view, data);
      });
    },

    /**
     * Fires on received responses from the automatic updates socket.
     *
     * @param data {Array|Object} List of event objects on success.
     * - On error, __socket_error string is set.
     */
    onTimelineUpdate: function(data) {
      if (!data || !data.length) {
        return;
      }

      // Advance the manual cursor.
      this.newestEventId = data[0]._id;

      // Un-highlight any past updates.
      $('.timeline-update').removeClass('timeline-update');

      // Same steps as for the initial payload except events are prepended
      // to the <table> via render() options.
      var view = this;
      _.each(data.reverse(), function(event) {
        view.renderEvent(event, {prepend: true, highlight: true});
      });
    }
  });
})();
