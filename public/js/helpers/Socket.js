'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  var connection = null;

  diana.helpers.Socket = {
    createConnection: function() {
      return io.connect(location.protocol + location.host, {
        'reconnect': true,
        'reconnection delay': 500,
        'max reconnection attempts': 10
      });
    },
    reuseConnection: function() {
      if (!connection) {
        connection = this.createConnection();
      }
      return connection;
    }
  };
})();
