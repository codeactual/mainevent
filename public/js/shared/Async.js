define([], function() {

  'use strict';

  var root = 'undefined' == typeof window ? GLOBAL : window;
  root.mainevent = root.mainevent || {};
  root.mainevent.shared = root.mainevent.shared || {};
  var mainevent = root.mainevent;

  mainevent.shared.Async = {
    /**
      * Iterate synchronously over a list with a async consumer, ex. insert 5
      * order-specific rows into a DB through an async driver.
      *
      * @param list {Array} Consumed values.
      * @param consumer {Function} Function executed on each element, ex. DB insert.
      * @param onDone {Function} Callback fired after last element is consumed.
      */
    runOrdered: function(list, consumer, onDone) {
      // Prevent shift() from affecting source list.
      arguments[0] = _.clone(arguments[0]);

      (function(list, consumer, onDone) {
        onDone = onDone || function() {};

        if (list.length) {
          // E.g. pass one element for an async DB insert.
          consumer(list.shift(), function() {
            mainevent.shared.Async.runOrdered(list, consumer, onDone);
          });
        } else {
          onDone();
        }
      }).apply(null, arguments);
    }
  };
});
