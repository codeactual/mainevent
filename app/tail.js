#!/usr/bin/env node

/**
 * `tail -F` one or more log files.
 *
 * Use config/config.js sources: app/tail.js
 * Use external config.js sources: app/tail.js path/to/config.js
 */

'use strict';

(function() {
  var program = require('commander');
  program
    .option('-c, --config <file>', '/path/to/config.js', null)
    .option('-t, --test <#>', 'Exit after # expected lines for unit tests', Number, 0)
    .parse(process.argv);

  require(__dirname + '/modules/diana.js');
  var parsers = diana.requireModule('parsers/parsers');
  var storage = diana.requireModule('storage/storage').load();
  var config = diana.getConfig(program.config);
  var monitors = {};
  var parserCache = {};
  var spawn = require('child_process').spawn;

  // To support maximum line count for --test.
  var lineCount = 0;

  /**
   * Kill all `tail` processes.
   */
  var cleanupMonitors = function() {
    if (monitors) {
      _.each(monitors, function(monitor) {
        monitor.kill('SIGKILL');
      });
      monitors = null;
    }
    if (storage) {
      storage.dbClose();
      storage = null;
    }
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

      var lines = data.toString().replace(/\n$/, '').split("\n");
      lineCount += lines.length;

      parserCache[source.parser].parseAndInsert(source, lines, function() {
        // Support maximum line count for --test.
        if (program.test > 0 && lineCount >= program.test) {
          process.exit();
        }
      }, true);
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

      if (program.test) {
        console.log('MONITOR_RESTART');
      }
    });
  };

  var createMonitors = function() {
    _.each(config.sources, function(source) {
      createMonitor(source);
    });
  };

  if (program.test) {
    process.on('message', function(message) {
      if ('START_TEST' == message) {
        createMonitors();
        process.send('MONITORS_STARTED');
      }
    });
  } else {
    createMonitors();
  }
})();
