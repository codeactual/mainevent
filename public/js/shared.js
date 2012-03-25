'use strict';

if ('undefined' != typeof require) {
  var moment = require('moment');
}

if ('undefined' === typeof define) {
  var define = function(deps, callback) { callback(moment); };
}

define(['moment'], function(moment) {

  return{
    /**
     * Convert a UNIX timestamp in seconds to string format.
     *
     * @param time {Number}
     * @return {String}
     */
    formatTime: function(time) {
      return moment(new Date(time * 1000)).format('ddd, MMM D YYYY, HH:mm:ss');
    },

    /**
     * Convert a month name, abbreviated or full, to its number.
     *
     * @param name {String}
     * @return {Number} Starting at 1.
     */
    monthNameToNum: function(name) {
      return moment(name + ' 1 2012').month() + 1;
    },

    /**
     * Convert a string date/time to UNIX timestamp in seconds.
     *
     * @param str {String}
     * @return {Number}
     */
     strtotime: function(str) {
       return (new Date(str)).getTime() / 1000;
     }
  };
});


if ('undefined' === typeof define) {
  var define = function(deps, callback) { callback(); };
}

define([], function() {

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


define(['moment'], function(moment) {

  var Lang = function() {};

  /**
   * Prototypal inheritance by Douglas Crockford.
   *
   * @param o {Object}
   */
  Lang.prototype.object = function(o) {
    function F() {};
    F.prototype = o;
    return new F();
  };

  /**
   * Parasitic combination inheritance by Nicholas Zakas.
   *
   * @param subType {Object}
   * @param superType {Object}
   */
  Lang.prototype.inheritPrototype = function(subType, superType) {
    var prototype = this.object(superType.prototype);
    prototype.constructor = subType;
    subType.prototype = prototype;
  };

  return new Lang();
});

