/**
 * Supply common/stateless helpers and module instances.
 *
 * All entry points (ui.js, app/tail.js, test runners, etc) must require()
 * this module. Modules like parsers/parsers.js assume its presence.
 */

'use strict';

GLOBAL._ = require('underscore');
GLOBAL.util = require('util');

GLOBAL.diana = {
  /**
   * Load module based on file layout convention.
   *
   * @param name {String} Path relative to app/modules. No trailing '.js'.
   * @return {Object}
   */
  requireModule: function(name) {
    return require(__dirname + '/' + name + '.js');
  },

  /**
   * Read the app configuration file.
   *
   * @return {Object}
  */
  getConfig: function(file) {
    if (file) {
      file = require('fs').realpathSync(file);
    } else {
      file = __dirname + '/../../config/app.js';
    }
    return require(file).read();
  }
};

// Import diana.shared.* modules.
diana.requireModule('build').combineAndLoadSharedJavascript();
