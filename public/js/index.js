/**
 * Log timeline and event viewer.
 *
 * Relies on app/mainevent_server for backbone.js syncs.
 * index.html provides the layout that includes #backbone-view used below.
 * content.html is injected into #content that's also in index.html.
 */

require([
  'jquery',
  'jquery-ui',
  'jquery-ui-timepicker-addon',
  'underscore',
  'backbone',
  'backbone/View',
  'bootstrap',
  'clientsiiide',
  'templates',
  'helpers/Cache',
  'helpers/Event',
  'helpers/Prefs',
  'shared/Date',
  'helpers/Widget',
  'observers/ContentPreRender'
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
          require(['dust', 'helpers/Event', 'controllers/' + config.controller], function(dust, Event, controller) {
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

  require(['dust'], function(dust) {
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

    /**
     * Respond to intercepted clicks on links with local HREFs.
     *
     * @param href {String} Ex. '/event/4f81c78146b5dac510000ef5'
     */
    mainevent.helpers.Event.on('LinkClick', function(href) {
      Backbone.history.navigate(href, {trigger: true});
    });
  });

  new Router();
  Backbone.history.start({pushState: true});
});
