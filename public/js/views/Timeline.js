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

        var timeline = new diana.collections.Timeline(null, {searchArgs: options.searchArgs});
        timeline.fetch({
          success: function(collection, response) {
            if (response.length) {
              _.each(response, function(event) {
                var model = new diana.models.Event(event);
                timeline.add(model);
                var view = new diana.views.TimelineEvent({ model: model });
                view.render();
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
