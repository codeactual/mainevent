'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.models = window.diana.models || {};
  var diana = window.diana;

  /**
   * Represents one logged event. Shared by multiple views.
   * Attributes vary from one event to the next based on the parser.
   */
  diana.models.Event = Backbone.Model.extend({
    urlRoot: '/event',

    sync: function(method, model, options) {
      // Only override reads.
      if ('read' != method) {
        Backbone.sync.call(this, method, this, options);
        return;
      }

      // Divert all reads through localStorage cache.
      var cacheKey = 'id-' + model.id;
      diana.cache.get({
        ns: 'event',
        keys: cacheKey,
        onDone: function(results) {
          options.success(results[cacheKey]);
        },
        onMiss: function(keys, onMissDone) {
          Backbone.sync.call(this, method, this, {
            url: '/event/' + model.id,
            success: function(data) {
              var write = {};
              write[cacheKey] = data;
              onMissDone(write);
            },
            error: diana.helpers.Event.onFetchError
          });
        }
      });
    }
  });
})();
