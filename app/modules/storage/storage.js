/**
 * Helpers related to storage modules.
 */

'use strict';

var config = helpers.getConfig();

exports.load = function() {
  return helpers.requireModule('storage/' + config.storage.module);
};
