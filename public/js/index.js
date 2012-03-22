/**
 * Log timeline and event viewer.
 *
 * Relies on app/ui.js for backbone.js syncs.
 * index.html provides the layout that includes #backbone-view used below.
 * content.html is injected into #content that's also in index.html.
 */

'use strict';

$(function() {
  window.diana = window.diana || {};
  var diana = window.diana;

  // localStorage cache for items like /event/:id responses.
  diana.cache = new clientsiiide('Diana');

  // Feature switches.
  diana.features = {
    // Conditionally enabled later only for compatible search conditions.
    timelineUpdate: false
  };

  // Used to close() the preexisting view during a route change.
  diana.mainView = null;

  /**
   * Custom routing used to allow 'context' attributes to support behaviors
   * like sidebar toggling per URL pattern.
   */
  var Router = Backbone.Router.extend({
    initialize: function(options) {
      /**
        * 'context' options:
        * - sidebar {Boolean} Display sidebar in layout.
        * - tab {String} DOM ID of active navigation tab.
        */
      var routes = {
        '': {
          handler: diana.controllers.ViewIndex,
          context: {sidebar: false, tab: 'nav-home'}
        },
        'timeline': {
          handler: diana.controllers.ViewTimeline,
          context: {sidebar: false, tab: 'nav-timeline'}
        },
        '^timeline/(.*)$': {
          handler: diana.controllers.ViewTimeline,
          context: {sidebar: false, tab: 'nav-timeline'}
        },
        '^event\/([a-f0-9]+)(?:\/(.*))?$': {
          handler: diana.controllers.ViewEvent,
          context: {sidebar: false, tab: 'nav-timeline'}
        }
      };

      var router = this;
      _.each(routes, function(config, route) {
        // Accept both standard routing string and RegExp() string.
        route = route.match(/\^/) ? new RegExp(route) : route;
        router.route(route, config.handler, function() {
          var routeArgs = arguments;
          // Apply 'context' options to the 'content' template, ex. show sidebar.
          dust.render(
            'content',
            config.context,
            function(err, out) {
              // Allow observers to tweak the layout based on configuration.
              diana.helpers.Event.trigger('ContentPreRender', config.context);

              // Display the rendered content container.
              $('#content').html(out);

              // Let the preexisting view clean itself up.
              if (diana.mainView) {
                diana.mainView.close();
                diana.mainView = null;
              }

              // Pass the matched route parameters to the actual handler.
              var mainView = config.handler.apply(config.context, routeArgs);
              if (mainView) {
                diana.mainView = mainView;
              }
            }
          );
        });
      });
    }
  });

  /**
   * Common error handler for all fetch/sync operations.
   *
   * @param response {Object} AJAX response.
   */
  diana.helpers.Event.on('CritFetchError', function(response) {
    var context = {message: JSON.parse(response.responseText).__error};
    dust.render('error', context, function(err, out) {
      $('#content').html(out);
    });
  });

  new Router();
  Backbone.history.start();
});
