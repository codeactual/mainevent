define([
    'collections/Timeline',
    'views/EditSingleValue',
    'views/TimelineSearch',
    'helpers/Socket',
    'helpers/View',
    'socket.io'
  ], function(TimelineCollection, EditSingleValue, TimelineSearch) {

  'use strict';

  /**
   * Displays the <table> into which result sets are rendered. Automatically
   * fetches the result set based on router options passed via initialize().
   */
  return Backbone.View.extend({

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
        mainevent.helpers.View.deferRender(
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

      this.initWebNotify();

      _.bindAll(this);
    },

    events: {
      'click #timeline-open-search': 'openSearch',
      'click #timeline-toggle-updates': 'toggleUpdates',
      'click #timeline-edit-rowlimit': 'editRowLimit',
      'click #timeline-enable-webnotify': 'requestWebNotifyPerm'
    },

    onClose: function() {
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
      mainevent.helpers.Widget.closeDropdown(event);

      var modal = $('#timeline-search-modal');

      if (modal.is(':visible')) {
        return;
      }

      if (this.subViews.search) {
        modal.modal('show');
      } else {
        mainevent.helpers.Event.on('TimelineSearchSubmit', this.onSearchSubmit, this);
        this.subViews.search = new TimelineSearch({
          el: modal,
          searchArgs: this.options.searchArgs,
          title: 'Search'
        });
      }
    },

    /**
     * Request Web Notifications permission.
     */
    requestWebNotifyPerm: function() {
      var self = this;
      this.webNotifyApi.requestPermission(function() {
        self.$('#timeline-enable-webnotify').remove();
      });
    },

    /**
     * Allow Web Notifications to be enabled via drop-down menu.
     */
    initWebNotify: function() {
      this.webNotifyApi = window.webkitNotifications;
      if (!this.webNotifyApi) {
        console.log('no api');
        return;
      }

      var perm = this.webNotifyApi.checkPermission();

      // User has not yet been asked for permission.
      if (1 === perm) {
        $('#timeline-enable-webnotify').parent().show();
      } else {
        $('#timeline-enable-webnotify').remove();
      }
    },

    /**
     * Toggle automatic updates.
     *
     * @param event {Object} jQuery event object.
     */
    toggleUpdates: function(event) {
      mainevent.helpers.Widget.closeDropdown(event);
      this.setPref('autoUpdate', !this.getPref('autoUpdate'));

      if (this.prefs.autoUpdate) {
        this.startTimelineUpdate();
      } else {
        this.closeSocket();
      }

      mainevent.helpers.Widget.alert(
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
      mainevent.helpers.Widget.closeDropdown(event);

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
          var pageSize = limit ? Math.min(limit, mainevent.maxResultSize) : mainevent.maxResultSize;
          if (response.info.prevPage) {
            searchArgs = _.clone(view.options.searchArgs);
            searchArgs.skip = Math.max(0, parseInt(skip, 10) - pageSize);
            if (!searchArgs.skip) {
              delete searchArgs.skip;
            }
            $('.prev-page')
              .removeClass('disabled')
              .attr('href', view.buildUrl('/timeline', searchArgs));
          }
          if (response.info.nextPage) {
            searchArgs = _.clone(view.options.searchArgs);
            searchArgs.skip = parseInt(skip, 10) + pageSize;
            $('.next-page')
              .removeClass('disabled')
              .attr('href', view.buildUrl('/timeline', searchArgs));
          }
          callback.call(view, response.results);
        },

        error: function(collection, response) {
          mainevent.helpers.Event.trigger('CritFetchError', response);
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

      return mainevent.helpers.View.deferRender(
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
     */
    startTimelineUpdate: function() {
      console.log('startTimelineUpdate');
      var view = this;

      if (!this.prefs.autoUpdate || !mainevent.features.timelineUpdate) {
        return;
      }

      console.log('startTimelineUpdate', 'creating socket');
      this.socket = mainevent.helpers.Socket.create({
        event: {
          connect: function() {
            console.log('startTimelineUpdate', 'socket connected', view.socket);
/*
            S -> im ready -> C
            500ms
            S -> im ready -> C
            C -> me too (stop listening/responding for imready) -> S (stops listening/responding for me-too)
            C/S -> first non-setup event -> S/C (who starts doesn't matter now because both have had just enough time to set up their observers)?*/


            var serverReady = false;

            var sendReady = function() {
              if (serverReady) {
                return; // Break cycle.
              }
              console.log('asking server to reply');

              // All server observers created.
              view.socket.emit('ClientReady');

              // Send the event again soon.
              //setTimeout(sendReady, 500);
            };

            view.socket.on('TimelineUpdate', view.addUpdateToTable);
            view.socket.on('TimelineUpdate', view.addUpdateToDesktop);

            // All client observers ready.
            view.socket.on('ServerReady', function() {
              serverReady = true;

              console.log('server is ready, sending StartTimelineUpdate');

              view.socket.emit('ClientReady');

              // Start/restart automatic updates.
              view.socket.emit('StartTimelineUpdate');
            });

            //sendReady();
          }
        }
      });
    },

    /**
     * @param data {Array} List of event objects on success.
     */
    dispatchTimelineUpdates: function(data) {
      this.addUpdateToTable(data);
      this.addUpdateToDesktop(data);
    },

    /**
     * Add timeline updates to the table as a new row at the top.
     *
     * @param data {Array} List of event objects on success.
     */
    addUpdateToTable: function(data) {
      // Un-highlight any past updates.
      $('.timeline-update').removeClass('timeline-update');

      // Update relative dates.
      this.$('td:first-child a').each(function() {
        var a = $(this);
        a.text(moment(a.data('time')).fromNow());
      });

      this.renderTimeline(data.reverse(), {prepend: true, highlight: true});

      this.truncateRows();
    },

    /**
     * Add timeline updates to the desktop via Web Notifications API.
     *
     * @param data {Array|Object} List of event objects on success.
     */
    addUpdateToDesktop: function(data) {
      var self = this;
      _.each(data, function(event) {
        if (-1 === event.tags.indexOf('WebNotificationApi')) {
          return;
        }
        self.webNotifyApi.createNotifiation(
          null,
          event.parser,
          event.preview
        );
      });
    }
  });
});
