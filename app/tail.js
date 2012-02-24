/**
 * `tail -F` all source paths in config/config.js.
 *
 * Example usage: supervisor app/tail.js
 */

'use strict';

GLOBAL.helpers = require(__dirname + '/modules/helpers.js');
var parsers = helpers.requireModule('parsers/parsers');
var config = helpers.getConfig(process.argv[2]);
var monitors = [];
var spawn = require('child_process').spawn;

/**
 * `tail -F` a specific path and parse/insert its updates.
 *
 * @param source {Object} See config/config.js.dist for structure.
 */
var monitorSource = function(source) {
  // --bytes=0 to skip preexisting lines
  var cmd = spawn('tail', ['--bytes=0', '-F', source.path]);
  monitors.push(cmd);

  cmd.stdout.on('data', function(data) {
    parsers.parseAndInsert(
      source,
      data.toString().replace(/\n$/, '').split("\n")
    );
  });
};

var monitorCleanup = function() {
  _.each(monitors, function(monitor) {
    monitor.kill('SIGKILL');
  });
  monitors = [];
};
process.on('exit', monitorCleanup);
process.on('uncaughtException', monitorCleanup);
a

_.each(config.sources, function(source) {
  monitorSource(source);
});
