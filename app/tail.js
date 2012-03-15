#!/usr/bin/env node

/**
 * `tail -F` all source paths in config/config.js.
 *
 * Example usage: supervisor app/tail.js
 */

'use strict';

GLOBAL.helpers = require(__dirname + '/modules/helpers.js');
var parsers = helpers.requireModule('parsers/parsers');
var storage = helpers.requireModule('storage/storage').load();
var config = helpers.getConfig(process.argv[2]);
var monitors = [];
var spawn = require('child_process').spawn;

/**
 * Kill all `tail` processes spawned below.
 */
var monitorCleanup = function() {
  _.each(monitors, function(monitor) {
    monitor.kill('SIGKILL');
  });
  storage.dbClose();
};
process.on('exit', monitorCleanup);
process.on('uncaughtException', monitorCleanup);

var parserCache = {};

/**
 * `tail -F` configured source paths and parse/insert its updates.
 */
_.each(config.sources, function(source) {
  // --bytes=0 to skip preexisting lines
  var cmd = spawn('tail', ['--bytes=0', '-F', source.path]);
  monitors.push(cmd);

  cmd.stdout.on('data', function(data) {
    if (!parserCache[source.parser]) {
      parserCache[source.parser] = parsers.createInstance(source.parser);
    }
    parserCache[source.parser].parseAndInsert(
      source,
      data.toString().replace(/\n$/, '').split("\n"),
      null,
      true
    );
  });
});
