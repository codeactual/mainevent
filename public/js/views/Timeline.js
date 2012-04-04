define([
    'collections/Timeline',
    'views/EditSingleValue',
    'views/TimelineSearch',
    'helpers/Socket',
    'helpers/View',
    'bootstrap-dropdown',
    'socket.io'
  ], function(TimelineCollection, EditSingleValue, TimelineSearch) {

  'use strict';

  /**
   * Displays the <table> into which result sets are rendered. Automatically
   * fetches the result set based on router options passed via initialize().
   */
  return Backbone.View.extend({
    // Track the most recent event seen by initial fetch() and automatic updates.
    newestEventId: null,
    newestEventTime: null,

    // socket.io connection.
    socket: null,

    subViews: {
      // Modal
      search: null
    },

    initialize: function(options) {
      var view = this;

      this.initPrefs('Timeline', {
        autoUpdate: true,
        rowLimit: 100
      });

      this.initKeyEvents({
        'Toggle automatic updates': {
          keyChar: 'u',
          shiftKey: true,
          callback: this.toggleUpdates
        },
        'Edit row limit enforced during automatic updating': {
          keyChar: 'l',
          callback: this.editRowLimit
        },
        'Search': {
          keyChar: 's',
          callback: this.openSearch
        }
      });

      $.when(
        diana.helpers.View.deferRender(
          'timeline_table',
          null,
          function(err, out) {
            view.$el.html(out);
          }
        )
      ).done(function() {
        view.renderUpdateSensitive();
        view.fetchTimeline.call(view, view.renderTimeline);
      });
    },

    events: {
      'click #timeline-open-search': 'openSearch',
      'click #timeline-toggle-updates': 'toggleUpdates',
      'click #timeline-edit-rowlimit': 'editRowLimit'
    },

    onClose: function() {
      $(document).off('keyup', this.onKey);
      this.closeSocket();
    },

    onSearchSubmit: function(searchArgs) {
      delete searchArgs.interval;
      this.navigate('timeline', searchArgs);
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

      if (this.subViews.search) {
        modal.modal('show');
      } else {
        diana.helpers.Event.on('TimelineSearchSubmit', this.onSearchSubmit, this);
        this.subViews.search = new TimelineSearch({
          el: modal,
          searchArgs: this.options.searchArgs,
          title: 'Search'
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
      this.setPref('autoUpdate', !this.getPref('autoUpdate'));

      if (this.prefs.autoUpdate) {
        this.startTimelineUpdate(this.newestEventId, this.newestEventTime);
      } else {
        this.closeSocket();
      }

      diana.helpers.Widget.alert(
        'Updates ' + (this.prefs.autoUpdate ? 'enabled' : 'disabled') + '.',
        'info',
        3
      );

      this.renderUpdateSensitive();
    },

    /**
     * Open row-limit edit modal.
     *
     * @param event {Object} jQuery event object.
     */
    editRowLimit: function(event) {
      var view = this;
      diana.helpers.Widget.closeDropdown(event);

      this.rowLimitView = new EditSingleValue({
        defaults: this.prefs.rowLimit,
        help: 'Event count. Only enforced when updates are enabled.',
        placeholder: "20-100",
        title: 'Limit Size',
        onEdit: function(value) {
          view.setPref('rowLimit', parseInt(value, 10));
          view.truncateRows();
        }
      });
    },

    /**
     * Truncate table rows based on preferred limit.
     */
    truncateRows: function() {
      if (this.prefs.autoUpdate) {
        this.$('tr').slice(1 + this.prefs.rowLimit).remove();
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
      view.collection = new TimelineCollection(
        null, {searchArgs: view.options.searchArgs}
      );

      view.collection.fetch({
        success: function(collection, response) {
          if (!response.results.length) {
            dust.render('timeline_no_results', null, function(err, out) {
              view.$el.html(out);
            });
            return;
          }

          // Reveal and configure pagination links.
          var searchArgs = _.clone(view.options.searchArgs);
          var skip = parseInt(searchArgs.skip || '0', 10); // Use '0' to avoid NaN.
          var limit = parseInt(searchArgs.limit || '0', 10); // Use '0' to avoid NaN.
          var pageSize = limit ? Math.min(limit, diana.maxResultSize) : diana.maxResultSize;
          if (response.info.prevPage) {
            searchArgs = _.clone(view.options.searchArgs);
            searchArgs.skip = Math.max(0, parseInt(skip, 10) - pageSize);
            if (!searchArgs.skip) {
              delete searchArgs.skip;
            }
            $('.prev-page')
              .removeClass('disabled')
              .attr('href', view.buildUrl('timeline', searchArgs));
          }
          if (response.info.nextPage) {
            searchArgs = _.clone(view.options.searchArgs);
            searchArgs.skip = parseInt(skip, 10) + pageSize;
            $('.next-page')
              .removeClass('disabled')
              .attr('href', view.buildUrl('timeline', searchArgs));
          }
          callback.call(view, response.results);
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
          view.startTimelineUpdate.call(view, events[0]._id, events[0].time);
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
      event.relTime = moment(event.time).fromNow();
      event.intReferer = this.buildUrl('timeline', this.options.searchArgs);

      return diana.helpers.View.deferRender(
        'timeline_table_row',
        event,
        function(err, out) {
          $(tr).append(out);
        }
      );
    },

    /**
     * Modify text on update toggling link in drop-down.
     */
    renderUpdateSensitive: function() {
      $('#timeline-toggle-updates').text(
        (this.prefs.autoUpdate ? 'Disable' : 'Enable') + ' Updates'
      );

      if (this.prefs.autoUpdate) {
        $('#timeline-edit-rowlimit').parent().show();
      } else {
        $('#timeline-edit-rowlimit').parent().hide();
      }
    },

    /**
     * Creates the automatic updates socket. Also handles reconnection and diverts
     * update payloads.
     *
     * @param initialId {String} All updates (if any) will be newer than this ID.
     * @param initialTime {Number} All updates (if any) will be newer than this time.
     */
    startTimelineUpdate: function(initialId, initialTime) {
      var view = this;
      view.newestEventId = initialId;
      view.newestEventTime = initialTime;

      if (!this.prefs.autoUpdate || !diana.features.timelineUpdate) {
        return;
      }

      this.socket = diana.helpers.Socket.create({
        event: {
          connect: function() {
            // Start/restart automatic updates.
            view.socket.emit('StartTimelineUpdate', {
              newestEventId: view.newestEventId,
              newestEventTime: view.newestEventTime,
              searchArgs: view.options.searchArgs
            });
          }
        }
      });

      // Update the view with events fresher than newestEventId.
      this.socket.on('TimelineUpdate', function(data) {
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
        a.text(moment(a.data('time')).fromNow());
      });

      this.renderTimeline(data.reverse(), {prepend: true, highlight: true});

      this.truncateRows();
    }
  });
});
