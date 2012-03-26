define([], function() {

  'use strict';

  if ('undefined' === typeof define) {
    var define = function(deps, callback) { callback(); };
  }

  var Async = function() {};

  /**
    * Iterate synchronously over a list with a async consumer, ex. insert 5
    * order-specific rows into a DB through an async driver.
    *
    * @param list {Array} Consumed values.
    * @param consumer {Function} Function executed on each element, ex. DB insert.
    * @param consumerCallback {Function} Supplied to 'consumer' in each call.
    * @param onDone {Function} Callback fired after last element is consumed.
    */
  Async.prototype.runOrdered = function(list, consumer, consumerCallback, onDone) {
    var async = this;
    // Prevent shift() from affecting source list.
    arguments[0] = _.clone(arguments[0]);

    (function(list, consumer, consumerCallback, onDone) {
      consumerCallback = consumerCallback || function() {};
      onDone = onDone || function() {};

      if (list.length) {
        // E.g. pass one element for an async DB insert.
        consumer(list.shift(), function() {
          // Run the async DB insertion callback, e.g. log the insert.
          consumerCallback.apply(this, arguments);
          async.runOrdered(list, consumer, consumerCallback, onDone);
        });
      } else {
        onDone();
      }
    }).apply(null, arguments);
  };

  return new Async();
});
