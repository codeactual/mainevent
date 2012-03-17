'use strict';

(function() {
  var root = "undefined" == typeof window ? GLOBAL : window;
  root.diana = root.diana || {};
  root.diana.shared = root.diana.shared || {};

  var diana = root.diana;

  diana.shared.Async = {
    /**
      * Iterate synchronously over a list with a async consumer, ex. insert 5
      * order-specific rows into a DB through an async driver.
      *
      * @param list {Array} Consumed values.
      * @param consumer {Function} Function executed on each element, ex. DB insert.
      * @param consumerCallback {Function} Supplied to 'consumer' in each call.
      * @param onDone {Function} Callback fired after last element is consumed.
      */
    runOrdered: function(list, consumer, consumerCallback, onDone) {
      // Prevent shift() from affecting source list.
      arguments[0] = _.clone(arguments[0]);

      (function(list, consumer, consumerCallback, onDone) {
        consumerCallback = consumerCallback || function() {};
        onDone = onDone || function() {};

        // E.g. pass one element for an async DB insert.
        consumer(list.shift(), function() {
          // Run the async DB insertion callback, e.g. log the insert.
          consumerCallback.apply(this, arguments);
          if (list.length) {
            diana.shared.Async.runOrdered(list, consumer, consumerCallback, onDone);
          } else {
            onDone();
          }
        });
      }).apply(null, arguments);
    }
  };
})();

