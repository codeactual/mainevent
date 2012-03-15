'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  var sharedSocket = null;

  diana.helpers.Socket = {

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
        'reconnection delay': 500,
        'max reconnection attempts': 10
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
    },

    /**
     * Reuse an existing socket; create one if needed.
     *
     * @param options {Object} See create().
     * @return {Object} io.connect() output.
     */
    reuse: function(options) {
      if (!sharedSocket) {
        this.initOptions(options);

        // Clean up shared link on disconnection.
        var actualDisconnectHandler = options.event.disconnect;
        options.event.disconnect = function() {
          sharedSocket = null;
          actualDisconnectHandler();
        };

        sharedSocket = this.create(options);
      }
      return sharedSocket;
    }
  };
})();
