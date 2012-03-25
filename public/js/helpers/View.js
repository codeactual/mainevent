'use strict';

define([], function() {

  return {
    /**
     * Creates a Deferred dust.render() call.
     *
     * @param template {String} Ex. 'timeline_header'.
     * @param context {Object} Template context.
     * @param callback {Function} dust.render() callback.
     * @return {Object} jQuery Promise.
     */
    deferRender: function(template, context, callback) {
      var deferred = $.Deferred();
      dust.render(template, context, function(err, out) {
        callback(err, out);
        deferred.resolve();
      });
      return deferred.promise();
    }
  };
});

