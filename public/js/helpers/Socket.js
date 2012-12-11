define([], function() {

  'use strict';

  window.mainevent = window.mainevent || {};
  window.mainevent.helpers = window.mainevent.helpers || {};
  var mainevent = window.mainevent;

  mainevent.helpers.Socket = {
    /**
     * socket.io events observable via create()/reuse() options parameter.
     */
    eventNames: [
      'connect', 'connect_failed',
      'reconnect', 'reconnect_failed',
      'disconnect', 'message',
      'connecting', 'reconnecting'
    ],

    /**
     * Initialize an options object with defaults for any missing properties.
     *
     * @param options {Object} See create().
     * @return {Object}
     */
    initOptions: function(options) {
      options = options || {};
      options.event = options.event || {};
      _.each(this.eventNames, function(name) {
        options.event[name] = options.event[name] || function() {};
      });
      options.socket = options.socket || {
        'reconnect': true,

        // Required to allow views to close sockets onClose().
        'force new connection': true
      };
    },

    /**
     * Create a new socket.
     *
     * @param options {Object} Properties:
     * - event {Object} socket.io event handlers (all but 'close').
     * - socket {Object} Options compatible with io.connect().
     * @return {Object} io.connect() output.
     */
    create: function(options) {
      this.initOptions(options);

      // Create connection based on custom/default attributes.
      var socket = io.connect(location.protocol + location.host, options.socket);

      // Attach optional event handlers.
      _.each(this.eventNames, function(name) {
        if (options.event[name]) {
          socket.on(name, options.event[name]);
        }
      });

      return socket;
    }
  };
});
