'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.views = window.diana.views || {};
  var diana = window.diana;

  /**
   * Displays the <table> into which result sets are rendered. Automatically
   * fetches the result set based on router options passed via initialize().
   */
  diana.views.Timeline = Backbone.View.extend({
    // Track the most recent event ID seen by initial fetch() and automatic updates.
    newestEventId: null,

    // socket.io connection.
    socket: null,

    // Modal sub-view.
    searchView: null,

    // Default preferences.
    prefs: {
      autoUpdate: true
    },

    initialize: function(options) {
      var view = this;

      var savedPrefs = diana.helpers.Prefs.get('TimelineSearch');
      this.prefs = _.isEmpty(savedPrefs) ? this.prefs : savedPrefs;

      $.when(
        diana.helpers.View.deferRender(
          'timeline_table',
          null,
          function(err, out) {
            view.$el.html(out);
          }
        )
      ).done(function() {
        $('#timeline-toggle-updates').text(
          (view.prefs.autoUpdate ? 'Disable' : 'Enable') + ' Updates'
        );
        view.fetchTimeline.call(view, view.renderTimeline);
      });

      if (!this.searchView) {
        $(document).on('keyup', {view: this}, view.onKey);
      }
    },

    onKey: function(event) {
      switch (event.which) {
        case 83: event.data.view.openSearch(event); break; // 's'
      }
    },

    onClose: function() {
      $(document).off('keyup', this.onKey);
      this.closeSocket();
    },

    events: {
      'click #timeline-open-search': 'openSearch',
      'click #timeline-toggle-updates': 'toggleUpdates'
    },

    /**
     * Open search modal.
     *
     * @param event {Object} jQuery event object.
     */
    openSearch: function(event) {
      diana.helpers.Widget.closeDropdown(event);

      var modal = $('#timeline-search-modal');

      if (modal.is(':visible')) {
        return;
      }

      if (this.searchView) {
        modal.modal('show');
      } else {
        this.searchView = new diana.views.TimelineSearch({
          el: modal,
          searchArgs: this.options.searchArgs
        });
      }
    },

    /**
     * Toggle automatic updates.
     *
     * @param event {Object} jQuery event object.
     */
    toggleUpdates: function(event) {
      diana.helpers.Widget.closeDropdown(event);
      this.prefs.autoUpdate = !this.prefs.autoUpdate;
      diana.helpers.Prefs.set('TimelineSearch', this.prefs);

      if (this.prefs.autoUpdate) {
        this.startTimelineUpdate(this.newestEventId);
      } else {
        this.closeSocket();
      }
    },

    /**
     * Close auto-update socket.
     */
    closeSocket: function() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
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
              view.$el.html(out);
            });
            return;
          }
          callback.call(view, response);
        },

        error: function(collection, response) {
          diana.helpers.Event.trigger('CritFetchError', response);
          callback.call(view, []);
        }
      });
    },

    /**
     * Render a set of events.
     *
     * - Used for both the intiial fetch and socket.io update payloads.
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
      event.relTime = moment(event.time * 1000).fromNow();

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
      var view = this;
      view.newestEventId = initialId;

      if (!this.prefs.autoUpdate || !diana.features.timelineUpdate) {
        return;
      }

      this.socket = diana.helpers.Socket.create({
        event: {
          connect: function() {
            // Start/restart automatic updates.
            view.socket.emit('startTimelineUpdate', {
              newestEventId: view.newestEventId,
              searchArgs: view.options.searchArgs
            });
          }
        }
      });

      // Update the view with events fresher than newestEventId.
      this.socket.on('timelineUpdate', function(data) {
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

      // Update relative dates.
      this.$('td:first-child a').each(function() {
        var a = $(this);
        a.text(moment(a.data('time') * 1000).fromNow());
      });

      this.renderTimeline(data.reverse(), {prepend: true, highlight: true});
    }
  });
})();
