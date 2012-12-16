define([], function() {
  /**
   * @description Methods related to SocketIO.
   */
  var Module = {
    /**
     * @description Invoke this helper on the server once it's ready -- it has
     *   attached its (message) observer. The client will be notified of the server's
     *   readiness, and asked to reply about its own readiness.
     * @param {object} socket
     * @param {function} callback
     * @param {number} [DEFAULT: 500] Milliseconds between requests for client reply.
     */
    syncWithClient: function(socket, callback, timeout) {
      var clientReady = false;

      socket.on('ClientReady', function() {
        clientReady = true;
      });

      var requestClientReply = function() {
        if (clientReady) {
          return; // Break cycle.
        }

        socket.emit('ServerReady');

        // Send the event again soon.
        setTimeout(requestClientReply, timeout || 500);
      };

      // Start the poll.
      requestClientReply();
    },

    /**
     * @description Invoke this helper on the client once it's ready -- it has
     *   attached its (message) observer. The server will be notified of the client's
     *   readiness.
     * @param {object} socket
     * @param {function} callback
     */
    syncWithServer: function(socket, callback) {
      socket.on('ServerReady', _.once(function() {
        socket.emit('ClientReady');
      }));
    }
  };

  return Module;
});
