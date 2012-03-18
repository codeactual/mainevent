#!/usr/bin/env node

/**
 * `tail -F` all source paths in config/config.js.
 *
 * Example usage: supervisor app/tail.js
 */

'use strict';

(function() {
  require(__dirname + '/modules/diana.js');
  var parsers = diana.requireModule('parsers/parsers');
  var storage = diana.requireModule('storage/storage').load();
  var config = diana.getConfig(process.argv[2]);
  var monitors = {};
  var parserCache = {};
  var spawn = require('child_process').spawn;

  /**
   * Kill all `tail` processes.
   */
  var cleanupMonitors = function() {
    _.each(monitors, function(monitor) {
      monitor.kill('SIGKILL');
    });
    storage.dbClose();
  };
  process.on('exit', cleanupMonitors);
  process.on('uncaughtException', cleanupMonitors);

  /**
   * Start a new `tail` instance and attach event handlers.
   *
   * @param source {Object} Source properties from config.js.
   */
  var createMonitor = function(source) {
    // --bytes=0 to skip preexisting lines
    monitors[source.path] = spawn('tail', ['--bytes=0', '-F', source.path]);

    /**
     * Parse and insert each output line.
     *
     * @param data {Object} Buffer instance.
     */
    monitors[source.path].stdout.on('data', function(data) {
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

    /**
     * Restart any `tail` that closes prematurely.
     *
     * - It's not clear why this happens (sometimes immediately on launch,
     *   other times much later).
     *
     * @param code {Number} Status code.
     */
    monitors[source.path].on('exit', function(code) {
      // Make sure any lingering structures/events are cleaned up.
      monitors[source.path].kill();
      monitors[source.path] = null;

      createMonitor(source);
    });
  };

  _.each(config.sources, function(source) {
    createMonitor(source);
  });
})();
