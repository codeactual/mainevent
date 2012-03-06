/**
 * Supply common/stateless helpers and module instances.
 *
 * All entry points (ui.js, app/tail.js, test runners, etc) must define
 * require() this module into GLOBAL.helpers. Modules like parsers/parsers.js
 * expect its presence.
 */

'use strict';

GLOBAL._ = require('underscore');
GLOBAL.util = require('util');
GLOBAL.months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
  * Iterate synchronously over a list with a async consumer, ex. insert 5 rows
  * into a DB through an async driver.
  *
  * @param list {Array} Iteration elements.
  * @param consumer {Function} Function executed on each element, ex. DB insert.
  * @param consumerCallback {Function} Supplied to 'consumer' in each call.
  * @param onDone {Function} Callback fired after last element is consumed.
  */
exports.walkAsync = function(list, consumer, consumerCallback, onDone) {
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
        exports.walkAsync(list, consumer, consumerCallback, onDone);
      } else {
        onDone();
      }
    });
  }).apply(null, arguments);
};

/**
 * Load module based on file layout convention.
 *
 * @param name {String} Path relative to app/modules. No trailing '.js'.
 * @return {Object}
 */
exports.requireModule = function(name) {
  return require(__dirname + '/' + name + '.js');
};

/**
 * Read the app configuration file.
 *
 * @return {Object}
 */
exports.getConfig = function(file) {
  if (file) {
    file = require('fs').realpathSync(file);
  } else {
    file = __dirname + '/../../config/config.js';
  }
  return require(file).read();
}
