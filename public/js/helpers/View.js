'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  var cache = {};

  diana.helpers.View = {
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
})();

