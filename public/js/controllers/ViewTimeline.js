'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.controllers = window.diana.controllers || {};
  var diana = window.diana;

  /**
   * Handler for /#timeline* requests.
   *
   * @param options {Object} Search/pagination options. See searchArgs below.
   * @return {Object} View object.
   */
  diana.controllers.ViewTimeline = function(options) {
    var searchArgs = {
      // Holds all pairs with keys that do not match those below, ex. parser=php.
      conditions: {},

      limit: null,
      skip: null,
      'sort-attr': '_id',
      'sort-dir': 'desc'
    };

    if (undefined !== options) {
      // Ex. '/#timeline/limit=10;skip=20;host=127.0.0.1'.
      var parts = options.split('&');
      _.each(parts, function(part) {
        // Ex. 'limit=10'. Push key/value pairs into searchArgs.
        var assign_part = part.split('=');
        if (2 == assign_part.length) {
          // Collect all options, ex. 'limit=10'.
          if (_.has(searchArgs, assign_part[0])) {
            searchArgs[assign_part[0]] = assign_part[1];
          // Collect all conditions, ex. 'parser='php'.
          } else {
            searchArgs.conditions[assign_part[0]] = assign_part[1];
          }
        }
      });
    }

    // Now that search options and conditions are separated, make the condition pairs
    // top-level properties of 'searchArgs'.
    _.each(searchArgs.conditions, function(value, key) {
      searchArgs[key] = value;
    });
    delete searchArgs.conditions;

    // Remove unused options, ex. 'limit' and 'skip'.
    _.each(searchArgs, function(value, key) {
      if (null === value) {
        delete searchArgs[key];
      }
    });

    // Enable compatible feature(s).
    if ('_id' == searchArgs['sort-attr'] && 'desc' == searchArgs['sort-dir']) {
      diana.features.timelineUpdate = true;
    }

    return new diana.views.Timeline({searchArgs: searchArgs, el: $('#backbone-view')});
  };
})();
