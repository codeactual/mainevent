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
    file = __dirname + '/../../config/app.js';
  }
  return require(file).read();
}

exports.requireModule('build').combineAndLoadSharedJavascript();
