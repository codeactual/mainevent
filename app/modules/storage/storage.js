/**
 * Helpers related to storage modules.
 */

'use strict';

require(__dirname + '/prototype.js');

var config = diana.getConfig();

/**
 * Return a new instance of the configured storage driver.
 *
 * @return {Object} Ex. MongoDbStorage which inherits from Storage in prototype.js.
 */
exports.createInstance = function() {
  // Ex. storage/mongodb
  return diana.requireModule('storage/' + config.storage.module).createInstance();
};
