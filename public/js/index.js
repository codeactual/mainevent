"use strict";

$(function(){
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
      var o = {
        filters: {},
        skip: null,
        limit: null,
        sort_attr: null,
        sort_dir: null
      };

      if (undefined !== options) {
        var parts = options.split(';');
        _.each(parts, function(part) {
          console.log('part', part);
          var kv = part.split('=');
          if (2 == kv.length) {
            if (o.hasOwnProperty(kv[0])) {
              o[kv[0]] = kv[1];
            } else {
              o.filters[kv[0]] = kv[1];
            }
          }
        });
      }

      _.each(o.filters, function(value, key) {
        o[key] = value;
      });
      delete o.filters;

      this._timeline(o);
    },

    _timeline: function(options) {
      var url = '/timeline?' + $.param(options);

      window.Timeline = Backbone.Collection.extend({
        model: Event,
        url: url,
        initialize: function() {
          this.bind('add', function(model) {
            console.log('Timeline->add()', model);
          });
          this.bind('remove', function(model) {
            console.log('Timeline->remove()', model);
          });
        }
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
          dust.render(
            'timeline_table',
            null,
            function(err, out) {
              $('#backbone-view').html(out);
              var tl = new Timeline();
              tl.fetch({
                success: function(collection, response) {
                  _.each(response, function(eventdata) {
                    var newmodel = new Event(eventdata);
                    tl.add(newmodel);
                    var view = new TimelineEventView({model: newmodel});
                    view.render();
                  });
                }
              });
            }
          );
        }
      });
      window.TimelinePage = new TimelinePageView();
    },

    event: function(id) {
      window.EventView = Backbone.View.extend({
        initialize: function() {
          this.model.bind('change', this.render, this);
        },
        render: function(callback) {
          var foo = this.model.get('foo');
          dust.render(
            'event_' + this.model.attributes.parser,
            this.model.toJSON(),
            function(err, out) {
              $(foo).html(out);
            }
          );
        }
      });

      window.EventPageView = Backbone.View.extend({
        el: $('#backbone-view'),
        initialize: function() {
          var m = new Event({id: id});
          m.set('foo', this.el);
          m.fetch();
          var view = new EventView({model: m});
          view.render();
        }
      });

      window.EventPage = new EventPageView();
    },
  });

  window.Event = Backbone.Model.extend({
    urlRoot: '/event',
  });

  new Workspace();
  Backbone.history.start();
});
