/**
 * `tail -F` all source files in config/config.js.
 *
 * Example usage: supervisor app/tail.js
 */

'use strict';

GLOBAL.helpers = require(__dirname + '/modules/helpers.js');
var parsers = helpers.requireModule('parsers/parsers');
var spawn = require('child_process').spawn;

/**
 * `tail -F` a specific file and parse/insert its updates.
 *
 * @param source {Object} See config/config.js.dist for structure.
 */
var monitorFile = function(source) {
  // --bytes=0 to skip preexisting lines
  var cmd = spawn('tail', ['--bytes=0', '-F', source.file]);

  cmd.stdout.on('data', function(data) {
    parsers.parseAndInsert(
      source,
      data.toString().replace(/\n$/, '').split("\n")
    );
  });
};

for (var s in helpers.getConfig().sources) {
  monitorFile(config.sources[s]);
}
