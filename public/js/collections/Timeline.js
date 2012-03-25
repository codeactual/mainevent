'use strict';

define([], function() {

  /**
   * Holds events from a timeline search result set.
   */
  return Backbone.Collection.extend({
    url: '/timeline?',
    initialize: function(models, options) {
      this.url += $.param(options.searchArgs);
    }
  });
});
