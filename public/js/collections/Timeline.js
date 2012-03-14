'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.collections = window.diana.collections || {};
  var diana = window.diana;

  /**
   * Holds events from a timeline search result set.
   */
  diana.collections.Timeline = Backbone.Collection.extend({
    url: '/timeline?',
    initialize: function(models, options) {
      this.url += $.param(options.searchArgs);
    }
  });
})();
