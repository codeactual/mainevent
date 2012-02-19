"use strict";

$(function(){
  var cache = new clientsiiide('Diana');

  var Workspace = Backbone.Router.extend({
    routes: {
      '': 'index',
      'timeline': 'timeline',
      'timeline/:options': 'timeline',
      'event/:id': 'event'
    },

    index: function() {
    },

    timeline: function(options) {
      var search_args = {
        conditions: {},
        skip: null,
        limit: null,
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
      this.timeline_search(search_args);
    },

    timeline_search: function(options) {
      window.Timeline = Backbone.Collection.extend({
        url: '/timeline?' + $.param(options)
      });

      window.TimelineEventView = Backbone.View.extend({
        initialize: function() {
          this.model.bind('change', this.render, this);
        },
        render: function(callback) {
          dust.render(
            'timeline_table_row',
            this.model.toJSON(),
            function(err, out) {
              $('#timeline-table tbody').append(out);
            }
          );
        }
      });

      window.TimelinePageView = Backbone.View.extend({
        el: $('#backbone-view'),
        initialize: function() {
          // Sync template with data fetched from server.
          var on_template_rendered = function(err, out) {
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
          dust.render('timeline_table', null, on_template_rendered);
        }
      });
      window.TimelinePage = new TimelinePageView();
    },

    event: function(id) {
      // View of an individual event.
      window.EventView = Backbone.View.extend({
        el: $('#backbone-view'),
        initialize: function() {
          this.model = new Event({id: id});
          this.model.bind('change', this.render, this);
          this.model.set('parent', this.el);
          this.model.fetch();
          this.render();
        },

        // Populate parent element with processed event template.
        render: function() {
          var parent = this.model.get('parent');
          dust.render(
            // ex. 'event_nginx_access'
            'event_' + this.model.attributes.parser,
            this.model.toJSON(),
            function(err, out) {
              $(parent).html(out);
            }
          );
        }
      });

      window.EventPage = new EventView();
    },
  });

  window.Event = Backbone.Model.extend({
    urlRoot: '/event',

    // Divert all reads through localStorage cache.
    sync: function(method, model, options) {
      if ('read' != method) {
        Backbone.sync.call(this, method, this, options);
      }
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

  new Workspace();
  Backbone.history.start();
});
