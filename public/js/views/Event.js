define([
    'models/Event',
    'views/TimelineSearch'
  ], function(EventModel, TimelineSearch) {

  'use strict';

  // View of an individual event.
  return Backbone.View.extend({

    subViews: {
      // 'Find Similar' modal.
      search: null
    },

    initialize: function(options) {
      this.initKeyEvents({
        'Find similar events': {
          keyChar: 's',
          callback: this.onFindSimilar
        }
      });

      this.model = new EventModel({id: options.id});
      this.model.bind('change', this.render, this);

      // Bubble up the model error, ex. 'Event not found.'
      diana.helpers.Event.on('EventSyncError', this.onEventSyncError);

      this.model.fetch();
    },

    events: {
      'click #event-find-similar': 'onFindSimilar'
    },

    onClose: function() {
      this.model.unbind('change', this.render);
      diana.helpers.Event.off('EventSyncError', this.onEventSyncError);
    },

    /**
     * Open search modal seeded with this event's properties.
     *
     * @param event {Object} jQuery event object.
     */
    onFindSimilar: function(event) {
      event.preventDefault();

      var modal = $('#timeline-search-modal');

      if (modal.is(':visible')) {
        return;
      }

      if (this.subViews.search) {
        modal.modal('show');
      } else {
        var searchArgs = this.model.toJSON();
        _.each(searchArgs, function(value, key) {
          if ('_' == key[0] || '' == value || key.match(/^(previewAttr|time|id)$/)) {
            delete searchArgs[key];
          }
        });
        this.subViews.search = new TimelineSearch({
          el: modal,
          searchArgs: searchArgs,
          title: 'Find Similar'
        });
      }
    },

    onEventSyncError: function(response) {
      diana.helpers.Event.trigger('CritFetchError', response);
    },

    render: function() {
      var event = this.model.toJSON();
      if (Object.keys(event).length < 3) {
        return;
      }

      var context = {};

      // Attributes are in an array of key/value pair objects, ex. from json parser.
      if (event.__list) {
        event.__list = _.filter(event.__list, function(pair) {
          // Omit database ID.
          if (pair.key == '_id') {
            return false;
          } else if (pair.key == 'tags') {
            context.tags = pair.value;
            return false;
          }
          // Ex. avoid rendering empty 'tags' lists.
          if (pair.value === null) {
            return false;
          }
          return true;
        });

        context.list = event.__list;
        context.parser = event.parser;

        // Ex. format the time attribute.
        context.list = _.map(context.list, function(pair, index) {
          if ('time' == pair.key) {
            context.time = diana.shared.Date.formatTime(pair.value);
            context.timeFromNow = moment(pair.value).fromNow();
          }
          return pair;
        });

        // Ex. remove internal attributes for display.
        context.list = _.filter(context.list, function(pair, index) {
          var blacklist = ['parser', 'previewAttr', 'time'];
          return -1 == blacklist.indexOf(pair.key);
        });

      // Attributes are in a one-dimensional object, ex. from nginx_access parser.
      } else {
        var context = event;
        context.timeFromNow = moment(context.time).fromNow();
        context.time = diana.shared.Date.formatTime(context.time);
        delete context.previewAttr;
      }

      context.tags = _.map(context.tags, function(value) {
        return {name: value};
      });

      context.intReferer = this.options.intReferer;

      var view = this;
      dust.render(
        // ex. 'event_nginx_access'
        'event_' + this.model.attributes.parser,
        context,
        function(err, out) {
          view.$el.html(out);
        }
      );
    }
  });
});
