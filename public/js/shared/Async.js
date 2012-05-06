define([], function() {

  'use strict';

  var root = 'undefined' == typeof window ? GLOBAL : window;
  root.mainevent = root.mainevent || {};
  root.mainevent.shared = root.mainevent.shared || {};
  var mainevent = root.mainevent;

  var Async = mainevent.shared.Async = {

    Deferred: require('JQDeferred'),

    /**
      * Iterate synchronously over a list with a async consumer, ex. insert 5
      * order-specific rows into a DB through an async driver.
      *
      * - Returns a promise to support chains and async wrappers.
      *
      * @param list {Array} Consumed values.
      * @param consumer {Function} Function executed on each element, ex. DB insert.
      * @param onDone {Function} Callback fired after last element is consumed.
      * @param deferred {Object} Do not set. Internally used.
      * @return {Object} JQDeferred promise.
      */
    runSync: function(list, consumer, onDone, deferred) {
      // Use only one promise per list/recursion.
      deferred = deferred || Async.Deferred();

      // Prevent shift() from affecting source list.
      arguments[0] = _.clone(arguments[0]);

      (function(list, consumer, onDone) {
        onDone = onDone || function() {};

        if (list.length) {
          // E.g. pass one element for an async DB insert.
          consumer(list.shift(), function() {
            mainevent.shared.Async.runSync(list, consumer, onDone, deferred);
          });
        } else {
          deferred.resolve();
          onDone();
        }
      }).apply(null, arguments);

      return deferred.promise();
    }
  };
});
