"use strict";

$(function(){
  var Workspace = Backbone.Router.extend({
    routes: {
      "": "index",
      "event/:id": "event"
    },

    index: function() {
      console.log('showing index');
    },

    event: function(id) {
      console.log('showing event');

      window.Evento = Backbone.Model.extend({
        url: '/event'
      });

      window.EventList = Backbone.Collection.extend({
        url: '/event-col',
        model: Evento
      });

      window.Events = new EventList;

      window.EventView = Backbone.View.extend({
        initialize: function() {
          //this.model.bind('change', this.render, this);
          //this.model.bind('destroy', this.remove, this);


          console.log('EventView: init');
        },
        remove: function() {
          $(this.el).remove();
        },
        render: function(callback) {
          dust.render("event", this.model.toJSON(), function(err, out) {
            console.log('rendering', err, out);
            console.log('EventView: rendering', this.parent);
            callback(out);
          });
        }
      });

      window.EventPageView = Backbone.View.extend({
        el: $('#backbone-view'),
        initialize: function() {
          Events.bind('add', this.addOne, this);

          /*var data = {
    "host": "127.0.0.1",
    "user": "-",
    "time": "16/Feb/2012:12:05:59 +0000",
    "method": "GET",
    "path": "/js/jquery-ui-1.8.16.custom.min.js",
    "code": "200",
    "size": "581",
    "referer": "http://diana/js/jquery-1.7.1.min.js",
    "agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:10.0.1) Gecko/20100101 Firefox/10.0.1",
    "parser": "nginx_access",
    "tags": 'none'
          };*/
          /*var m = new Evento({id: "4f3cf1279010fd0a11000004"});
          console.log(m.url());
          m.fetch({
            success: function(model, response) {
              console.log('fetch success', model, response);
              Events.create(m);
            },
            error: function(model, response) {
              console.log('fetch error', model, response);
            }
          });*/
          var m = new Evento();
          m.fetch({
            url: '/event/' + id,
            success: function(model, response) {
              console.log('fetch success', model, response);
              Events.add(m);
            },
            error: function(model, response) {
              console.log('fetch error', model, response);
            }
          });*/
          console.log('fetch called');
        },
        addOne: function(event) {
          // not really adding one, just updating the template with actual values
          //this.render();
          var view = new EventView({model: event});
          var parent = $(this.el);
          view.render(function(out) {
            console.log('addone got', out);
            parent.html(out);
          });
          console.log('adding one', event);
        },
      });

      window.EventPageView= new EventPageView();
    },
  });


  new Workspace();
  Backbone.history.start();
});
