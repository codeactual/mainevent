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
        diana.helpers.View.deferRender(
          'timeline_table',
          null,
          function(err, out) {
            $(diana.viewContainer).html(out);
          }
        )
      ).done(function() {
        view.fetchTimeline.call(view, view.renderTimeline);
      });
    },

    /**
     * Fetch all log events matching the search arguments passed to the view.
     *
     * @param callback {Function} Fires on success/error.
     * - Receives an array with zero or more event objects.
     */
    fetchTimeline: function(callback) {
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
          callback.call(view, response);
        },

        error: function(collection, response) {
          diana.helpers.Event.onFetchError(response);
          callback.call(view, []);
        }
      });
    },

    /**
     * Render a set of events.
     *
     * @param events {Array}
     * @param options {Object}
      * - prepend {Boolean} If true, row is prepended (default=false).
      * - highlight {Boolean} If true, row receives styled class (default=false).
     */
    renderTimeline: function(events, options) {
      if (!events.length) {
        return;
      }

      options = options || {
        prepend: false,
        highlight: false
      };

      var view = this;

      // This function is used for both initial fetch and automatic updates.
      // Initial <tbody> is built off-screen and appended as a whole.
      // Automatic updates' <tr> nodes are added individually to an existing <tbody>.
      var existingTbody = $('#timeline-table tbody');
      var tbody = (existingTbody.length ? existingTbody : null) || $('<tbody>');

      // Deferred dust.render() calls later executed by $.when().
      var renderPromises = [];

      // Add empty <tr> nodes to the off-screen or live <tbody>.
      _.each(events, function(event) {
        var tr = $('<tr>');
        if (options.prepend) {
          if (options.highlight) {
            tr.addClass('timeline-update');
          }
          tbody.prepend(tr);
        } else {
          tbody.append(tr);
        }
        renderPromises.push(view.renderEvent(event, tr));
      });

      $.when(renderPromises).done(function() {
        if (existingTbody.length) {
          // tbody was already part of the DOM, so above rows were added live.
        } else {
          $('#timeline-table').append(tbody);
          view.startTimelineUpdate.call(view, events[0]._id);
        }
      });
    },

    /**
     * Render a single event in the timeline table.
     *
     * @param event {Object}
     * @param tr {Object} <tr> parent element.
     * @return {Object} jQuery Promise.
     */
    renderEvent: function(event, tr) {
      event.time = moment(event.time * 1000).fromNow();

      return diana.helpers.View.deferRender(
        'timeline_table_row',
        event,
        function(err, out) {
          $(tr).append(out);
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
            socket.emit('startTimelineUpdate', {
              newestEventId: view.newestEventId,
              searchArgs: view.options.searchArgs
            });
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

      this.renderTimeline(data.reverse(), {prepend: true, highlight: true});
    }
  });
})();
