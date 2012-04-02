define([], function() {

  'use strict';

  var root = 'undefined' == typeof window ? GLOBAL : window;

  /**
   * Return the given collection with only its truthy members.
   *
   * @param collection {Array|Object}
   * @return {Array|Object}
   */
  root._.filterTruthy = function(collection) {
    return _.filter(collection, function(value) { return !!value; });
  };
});
