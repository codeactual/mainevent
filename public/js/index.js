/**
 * Log timeline and event viewer.
 *
 * Relies on app/ui.js for backbone.js syncs.
 * index.html provides the layout that includes #backbone-view used below.
 * content.html is injected into #content that's also in index.html.
 */

'use strict';

$(function() {
  // localStorage cache for items like /event/:id responses.
  var cache = new clientsiiide('Diana');

  /**
   * Convert a UNIX timestamp in seconds to string format.
   *
   * @param time {Number}
   * @return {String}
   */
  var formatTime = function(time) {
    return (new Date(time * 1000)).toUTCString();
  };

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
   * Represents one logged event. Shared by multiple views.
   * Attributes vary from one event to the next based on the parser.
   */
  window.Event = Backbone.Model.extend({
    urlRoot: '/event',

    sync: function(method, model, options) {
      // Only override reads.
      if ('read' != method) {
        Backbone.sync.call(this, method, this, options);
        return;
      }

      // Divert all reads through localStorage cache.
      var cacheKey = 'id-' + model.id;
      cache.get({
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
            }
          });
        }
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
  // View of an individual event.
    window.EventView = Backbone.View.extend({
      el: $('#backbone-view'),

      initialize: function() {
        this.model = new Event({id: id});
        this.model.bind('change', this.render, this);
        this.model.set('parent', this.el);
        this.model.fetch();
      },

      // Populate parent element with processed event template.
      render: function() {
        var event = this.model.toJSON();
        if (Object.keys(event).length < 3) {
          return;
        }

        // Attributes are in an array of key/value pair objects, ex. from json parser.
        if (event.__list) {
          event.__list = _.filter(event.__list, function(pair) {
            // Omit database ID.
            if (pair.key == '_id') {
              return false;
            }
            // Ex. avoid rendering empty 'tags' lists.
            if (pair.value === null) {
              return false;
            }
            return true;
          });

          var context = {list: event.__list};

          // Ex. remove internal attributes for display.
          context.list = _.filter(context.list, function(pair, index) {
            var blacklist = ['parser', 'previewAttr'];
            return -1 == blacklist.indexOf(pair.key);
          });

          // Ex. format the time attribute.
          context.list = _.map(context.list, function(pair, index) {
            if ('time' == pair.key) {
              pair.value = formatTime(pair.value);
            }
            return pair;
          });

        // Attributes are in a one-dimensional object, ex. from nginx_access parser.
        } else {
          var context = event;
          context.time = formatTime(context.time);
          delete context.previewAttr;
        }

        var parent = this.model.get('parent');
        dust.render(
          // ex. 'event_nginx_access'
          'event_' + this.model.attributes.parser,
          context,
          function(err, out) {
            $(parent).html(out);
          }
        );
      }
    });

    window.EventPage = new EventView();
  };

  /**
   * Router handler for /#timeline* requests.
   *
   * @param options {Object} Search/pagination options. See search_args below.
   */
  var viewTimelineSearch = function(options) {
    var search_args = {
      // Holds all pairs with keys that do not match those below, ex. parser=php.
      conditions: {},

      limit: null,
      skip: null,
      sort_attr: null,
      sort_dir: null
    };

    if (undefined !== options) {
      // Ex. '/#timeline/limit=10;skip=20;host=127.0.0.1'.
      var parts = options.split(';');
      _.each(parts, function(part) {
        // Ex. 'limit=10'. Push key/value pairs into search_args.
        var assign_part = part.split('=');
        if (2 == assign_part.length) {
          if (_.has(search_args, assign_part[0])) {
            search_args[assign_part[0]] = assign_part[1];
          } else {
            search_args.conditions[assign_part[0]] = assign_part[1];
          }
        }
      });
    }

    // Move search_args.conditions properties into search_args.
    _.each(search_args.conditions, function(value, key) {
      search_args[key] = value;
    });
    delete search_args.conditions;

    // Remove unused options.
    _.each(search_args, function(value, key) {
      if (null === value) {
        delete search_args[key];
      }
    });

    /**
     * Holds events from a timeline search result set.
     */
    window.Timeline = Backbone.Collection.extend({
      url: '/timeline?' + $.param(search_args)
    });

    /**
     * Displays a single <table> row for a single Event in the result set.
     */
    window.TimelineEventView = Backbone.View.extend({
      initialize: function() {
        this.model.bind('change', this.render, this);
      },
      render: function(callback) {
        this.model.attributes.time = formatTime(this.model.attributes.time);
        dust.render(
          'timeline_table_row',
          this.model.toJSON(),
          function(err, out) {
            $('#timeline-table tbody').append(out);
          }
        );
      }
    });

    /**
     * Displays the <table> into which result sets are rendered. Automatically
     * fetches the result set based on router options.
     */
    window.TimelinePageView = Backbone.View.extend({
      el: $('#backbone-view'),
      initialize: function() {
        // Sync template with data fetched from server.
        var onTemplateRendered = function(err, out) {
          $('#backbone-view').html(out);

          var timeline = new Timeline();
          timeline.fetch({
            success: function(collection, response) {
              _.each(response, function(event) {
                var model = new Event(event);
                timeline.add(model);
                var view = new TimelineEventView({ model: model });
                view.render();
              });
            }
          });
        };
        dust.render('timeline_table', null, onTemplateRendered);
      }
    });
    window.TimelinePage = new TimelinePageView();
  };

  new Router();
  Backbone.history.start();
});
