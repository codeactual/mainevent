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

  // Parent element for all backbone.js views.
  diana.viewContainer = '#backbone-view';

  // localStorage cache for items like /event/:id responses.
  diana.cache = new clientsiiide('Diana');

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
          handler: viewIndex,
          context: {sidebar: false, tab: 'nav-home'}
       },
        'timeline': {
          handler: viewTimelineSearch,
          context: {sidebar: false, tab: 'nav-timeline'}
       },
        'timeline/:options': {
          handler: viewTimelineSearch,
          context: {sidebar: false, tab: 'nav-timeline'}
       },
        'event/:id': {
          handler: viewEvent,
          context: {sidebar: false, tab: 'nav-timeline'}
        }
      };

      var router = this;
      _.each(routes, function(config, route) {
        // Register route.
        router.route(route, config.handler, function() {
          var routeOptions = arguments;
          // Apply 'context' options to the 'content' template, ex. show sidebar.
          dust.render(
            'content',
            config.context,
            function(err, out) {
              // Apply context.tab option.
              $('#nav-list > li').removeClass('active');
              $('#' + config.context.tab).addClass('active');
              $('#content').html(out);
              // Pass routeOptions to the actual handler.
              config.handler.apply(config.context, routeOptions);
            }
          );
        });
      });
    }
  });

  /**
   * Router handler for / requests.
   */
  var viewIndex = function() {
    // TBD
  };

  /**
   * Router handler for /#event/:id requests.
   *
   * @param id {String} Database primary key.
   */
  var viewEvent = function(id) {
    new diana.views.Event({id: id});
  };

  /**
   * Router handler for /#timeline* requests.
   *
   * @param options {Object} Search/pagination options. See searchArgs below.
   */
  var viewTimelineSearch = function(options) {
    var searchArgs = {
      // Holds all pairs with keys that do not match those below, ex. parser=php.
      conditions: {},

      limit: null,
      skip: null,
      sort_attr: '_id',
      sort_dir: 'desc'
    };

    if (undefined !== options) {
      // Ex. '/#timeline/limit=10;skip=20;host=127.0.0.1'.
      var parts = options.split(';');
      _.each(parts, function(part) {
        // Ex. 'limit=10'. Push key/value pairs into searchArgs.
        var assign_part = part.split('=');
        if (2 == assign_part.length) {
          if (_.has(searchArgs, assign_part[0])) {
            searchArgs[assign_part[0]] = assign_part[1];
          } else {
            searchArgs.conditions[assign_part[0]] = assign_part[1];
          }
        }
      });
    }

    // Move searchArgs.conditions properties into searchArgs.
    _.each(searchArgs.conditions, function(value, key) {
      searchArgs[key] = value;
    });
    delete searchArgs.conditions;

    // Remove unused options.
    _.each(searchArgs, function(value, key) {
      if (null === value) {
        delete searchArgs[key];
      }
    });

    new diana.views.Timeline({searchArgs: searchArgs});
  };

  new Router();
  Backbone.history.start();
});
