define(['views/Timeline'], function(view) {

  'use strict';

  /**
   * Handler for /#timeline* requests.
   *
   * @param options {Object} Search/pagination options. See searchArgs below.
   * @return {Object} View object.
   */
  return function(options) {
    var searchArgs = {
      // Holds all pairs with keys that do not match those below, ex. parser=php.
      conditions: {},

      limit: null,
      skip: null,
      'sort-attr': 'time',
      'sort-dir': 'desc'
    };

    if (undefined !== options) {
      // Ex. '/#timeline/limit=10;skip=20;host=127.0.0.1'.
      var parts = options.split('&');
      _.each(parts, function(part) {
        // Ex. 'limit=10'. Push key/value pairs into searchArgs.
        var assign_part = part.split('=');
        if (2 == assign_part.length) {
          var key = assign_part[0].replace(/\[\]$/, ''),
              value = assign_part[1];
          // Collect all options, ex. 'limit=10'.
          if (_.has(searchArgs, key)) {
            searchArgs[key] = value;
          // Collect all conditions, ex. 'parser='php'.
          } else {
            if (_.has(searchArgs.conditions, key)) {
              if (!_.isArray(searchArgs.conditions[key])) {
                searchArgs.conditions[key] = [searchArgs.conditions[key]];
              }
              searchArgs.conditions[key].push(value);
            } else {
              searchArgs.conditions[key] = value;
            }
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
    mainevent.features.timelineUpdate =
      'time' == searchArgs['sort-attr']
      && 'desc' == searchArgs['sort-dir']
      && 2 == _.size(searchArgs);

    return new view({searchArgs: searchArgs, el: $('#backbone-view')});
  };
});
