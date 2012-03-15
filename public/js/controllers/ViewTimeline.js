'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.controllers = window.diana.controllers || {};
  var diana = window.diana;

  /**
   * Handler for /#timeline* requests.
   *
   * @param options {Object} Search/pagination options. See searchArgs below.
   */
  diana.controllers.ViewTimeline = function(options) {
    var searchArgs = {
      // Holds all pairs with keys that do not match those below, ex. parser=php.
      conditions: {},

      limit: null,
      skip: null,
      sort_attr: '_id',
      sort_dir: 'desc'
    };

    if (undefined !== options) {
      // Ex. '/#timeline/limit=10;skip=20;host=127.0.0.1'.
      var parts = options.split(';');
      _.each(parts, function(part) {
        // Ex. 'limit=10'. Push key/value pairs into searchArgs.
        var assign_part = part.split('=');
        if (2 == assign_part.length) {
          if (_.has(searchArgs, assign_part[0])) {
            searchArgs[assign_part[0]] = assign_part[1];
          } else {
            searchArgs.conditions[assign_part[0]] = assign_part[1];
          }
        }
      });
    }

    // Move searchArgs.conditions properties into searchArgs.
    _.each(searchArgs.conditions, function(value, key) {
      searchArgs[key] = value;
    });
    delete searchArgs.conditions;

    // Remove unused options.
    _.each(searchArgs, function(value, key) {
      if (null === value) {
        delete searchArgs[key];
      }
    });

    new diana.views.Timeline({searchArgs: searchArgs});
  };
})();
