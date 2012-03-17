/**
 * Helpers related to storage modules.
 */

'use strict';

var config = diana.getConfig();

exports.load = function() {
  return diana.requireModule('storage/' + config.storage.module);
};
