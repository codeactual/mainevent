define([], function() {

  'use strict';

  /**
   * Represents one logged event. Shared by multiple views.
   * Attributes vary from one event to the next based on the parser.
   */
  return Backbone.Model.extend({
    urlRoot: '/api/event',

    sync: function(method, model, options) {
      // Only override reads.
      if ('read' != method) {
        Backbone.sync.call(this, method, this, options);
        return;
      }

      // Divert all reads through localStorage cache.
      var cacheKey = 'id-' + model.id, model = this;
      mainevent.helpers.cache.get({
        ns: 'event',
        keys: cacheKey,
        onDone: function(results) {
          options.success(results[cacheKey]);
        },
        onMiss: function(keys, onMissDone) {
          Backbone.sync.call(this, method, this, {
            url: model.urlRoot + '/' + model.id,
            success: function(data) {
              var write = {};
              write[cacheKey] = data;
              onMissDone(write);
            },
            error: function(response) {
              mainevent.helpers.Event.trigger('EventSyncError', response);
            }
          });
        }
      });
    }
  });
});
