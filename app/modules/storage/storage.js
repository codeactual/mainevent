/**
 * Helpers related to storage modules.
 */

'use strict';

var helpers = require(__dirname + '/../helpers.js');
var config = helpers.getConfig();

exports.load = function() {
  return helpers.requireModule('/storage/' + config.storage.module);
};
