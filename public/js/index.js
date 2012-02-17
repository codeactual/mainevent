"use strict";

$(function(){
  var Workspace = Backbone.Router.extend({
    routes: {
      '': 'index',
      'timeline': 'timeline',
      'event/:id': 'event'
    },

    index: function() {
    },

    event: function(id) {
      window.Evento = Backbone.Model.extend({
        urlRoot: '/event',
      });

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
          var m = new Evento({id: id});
          m.set('foo', this.el);
          m.fetch();
          var view = new EventView({model: m});
          view.render();
        }
      });

      window.EventPageView= new EventPageView();
    },
  });

  new Workspace();
  Backbone.history.start();
});
