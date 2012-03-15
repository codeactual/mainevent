'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.views = window.diana.views || {};
  var diana = window.diana;

  /**
   * Displays the <table> into which result sets are rendered. Automatically
   * fetches the result set based on router options.
   */
  diana.views.Timeline = Backbone.View.extend({
    el: $(diana.viewContainer),

    initialize: function(options) {
      // Sync template with data fetched from server.
      var onTemplateRendered = function(err, out) {
        $(diana.viewContainer).html(out);

        var timeline = new diana.collections.Timeline(
          null, {searchArgs: options.searchArgs}
        );
        timeline.fetch({
          success: function(collection, response) {
            if (response.length) {
              _.each(response, function(event) {
                var model = new diana.models.Event(event);
                timeline.add(model);
                (new diana.views.TimelineEvent({model: model})).render();
              });

              // Seed/start automatic updates with the result set's newest ID.
              var socket = io.connect('http://localhost:8080');
              socket.emit('startTimelineUpdate', response[0]._id);

              // Update the view with automatic update results.
              socket.on('timelineUpdate', function (data) {
                if (!data) {
                  return;
                }
                if (data.__socket_error) {
                  // TODO: Update view.
                } else {
                  // TODO: Update view.
                }
              });
            } else {
              dust.render('timeline_no_results', null, function(err, out) {
                $(diana.viewContainer).html(out);
              });
            }
          },
          error: function(collection, response) {
            diana.helpers.Event.onFetchError(response);
          }
        });
      };
      dust.render('timeline_table', null, onTemplateRendered);
    }
  });
})();
