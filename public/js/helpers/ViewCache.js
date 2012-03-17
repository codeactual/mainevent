/**
 * Non-persistent view caching for fragment changes.
 *
 * - Intended to store jQuery clone() objects.
 * - get() called prior to route handler execution.
 * - set() called from view classes via createSetter() callbacks. View classes
 *   may set the cache entry multiple times, e.g. for WebSocket updates.
 */

'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  var cache = {};

  diana.helpers.ViewCache = {
    /**
     * @param route {String} Ex. 'timeline/:options'.
     * @param args {Object} Route arguments.
     * @return {Object} jQuery clone() output.
     */
    get: function(route, args) {
      if (cache[route] && _.isEqual(cache[route].args, args)) {
        return cache[route].view;
      }
      return null;
    },

    /**
     * @param route {String} Ex. 'timeline/:options'.
     * @param args {Object} Route arguments.
     * @param view {Object} jQuery clone() output.
     */
    set: function(route, args, view) {
      cache[route] = {args: args, view: view};
    },

    /**
     * Curry set() with fixed 'route' and 'args' values.
     *
     * @param route {String} Ex. 'timeline/:options'.
     * @param args {Object} Route arguments.
     * @return {Function} Accepts one argument, a jQuery clone() of the view.
     */
    createSetter: function(route, args) {
      return function(view) {
        diana.helpers.ViewCache.set(route, args, view);
      };
    },

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

