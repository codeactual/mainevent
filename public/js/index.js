/**
 * Log timeline and event viewer.
 *
 * Relies on app/ui.js for backbone.js syncs.
 * index.html provides the layout that includes #backbone-view used below.
 * content.html is injected into #content that's also in index.html.
 */

require([
  'order!jquery',
  'order!jquery-ui',
  'order!jquery-ui-timepicker-addon',
  'order!underscore',
  'order!backbone',
  'order!backbone/View',
  'order!bootstrap-modal',
  'order!moment',
  'order!clientsiiide',
  'order!templates',
  'order!helpers/Cache',
  'order!helpers/Event',
  'order!helpers/Prefs',
  'order!shared/Date',
  'order!helpers/Widget',
  'order!observers/ContentPreRender'
  ], function() {

  'use strict';

  window.mainevent = window.mainevent || {};
  var mainevent = window.mainevent;

  // Feature switches.
  mainevent.features = {
    // Conditionally enabled later only for compatible search conditions.
    timelineUpdate: false
  };

  // Used to close() the preexisting view during a route change.
  mainevent.mainView = null;

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
           controller: 'ViewDashboard',
           context: {sidebar: false, tab: 'nav-dashboard'}
        },
        '^dashboard(?:\/?(.*))$': {
          controller: 'ViewDashboard',
          context: {sidebar: false, tab: 'nav-dashboard'}
        },
        '^timeline(?:\/?(.*))$': {
          controller: 'ViewTimeline',
          context: {sidebar: false, tab: 'nav-timeline'}
        },
        '^event\/([a-f0-9]+)(?:\/(.*))?$': {
          controller: 'ViewEvent',
          context: {sidebar: false, tab: 'nav-timeline'}
        }
      };

      var router = this;
      _.each(routes, function(config, route) {
        // Accept both standard routing string and RegExp() string.
        route = route.match(/\^/) ? new RegExp(route) : route;
        router.route(route, config.controller, function() {
          var routeArgs = arguments;
          require(['helpers/Event', 'controllers/' + config.controller], function(Event, controller) {
            // Apply 'context' options to the 'content' template, ex. show sidebar.
            dust.render(
              'content',
              config.context,
              function(err, out) {
                // Allow observers to tweak the layout based on configuration.
                mainevent.helpers.Event.trigger('ContentPreRender', config.context);

                // Display the rendered content container.
                $('#content').html(out);

                // Let the preexisting view clean itself up.
                if (mainevent.mainView) {
                  mainevent.mainView.close();
                  mainevent.mainView = null;
                }

                routeArgs = _.map(routeArgs, decodeURIComponent);

                // Pass the matched route parameters to the actual controller.
                var mainView = controller.apply(config.context, routeArgs);
                if (mainView) {
                  mainevent.mainView = mainView;
                }
              }
            );
          });
        });
      });
    }
  });

  require([], function() {
    /**
     * Common error handler for all fetch/sync operations.
     *
     * @param response {Object} AJAX response.
     */
    mainevent.helpers.Event.on('CritFetchError', function(response) {
      var context = {message: JSON.parse(response.responseText).__error};
      dust.render('error', context, function(err, out) {
        $('#content').html(out);
      });
    });
  });

  new Router();
  Backbone.history.start();
});
