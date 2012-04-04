#!/usr/bin/env node

/**
 * `tail` source files listed in app/config.js.
 *
 * Usage:
 * - To use config/config.js source list: app/tail.js
 * - To use external source list: app/tail.js path/to/config.js
 *
 * process.send() is occasionally used to coordinate flow with test scripts.
 */

'use strict';

(function() {
  var program = require('commander');
  program
    .option('-c, --config <file>', '/path/to/config.js', null)
    .option('-t, --test <#>', 'Exit after # expected lines for unit tests', Number, 0)
    .option('-q, --quiet', false)
    .parse(process.argv);

  require(__dirname + '/modules/diana.js');
  var spawn = require('child_process').spawn,
      config = diana.getConfig(program.config),
      parsers = diana.requireModule('parsers/parsers');

  // To support maximum line count for --test.
  var lineCount = 0;

  /**
   * Configure the monitor.
   */
  var Monitor = function(source) {
    // Log source attribute object from config/app.js 'sources' list.
    this.source = _.clone(source);

    // ChildProcess object.
    this.tail = null;
  };

  /**
   * Start a new `tail` instance and attach event handlers.
   */
  Monitor.prototype.start = function() {
    this.log('spawning tail');

    this.tail = spawn('tail', ['--bytes=0', '-F', this.source.path]);

    var monitor = this;

    this.tail.stdout.on('data', function(data) {
      var lines = data.toString().replace(/\n$/, '').split("\n");
      lineCount += lines.length;
      monitor.log('got lines', lines);

      parsers.parseAndInsert({source: monitor.source, lines: lines}, function() {
        // Support maximum line count for --test.
        if (program.test > 0 && lineCount >= program.test) {
          process.exit();
        }
      }, true);
    });

    this.tail.on('exit', function(code, signal) {
      monitor.log("tail exited with code %d, signal %s", code, signal);

      // Auto-restart.
      monitor.start();

      if (program.test) {
        process.send('MONITOR_RESTART');
      }
    });

    // Clean up all `tail` processes before tail.js exits.
    var killTail = function() {
      if (monitor.tail) {
        monitor.log('killing ...');
        monitor.tail.kill('SIGKILL');
        monitor.log('killed');
        monitor.tail = null;
      }
    };
    process.on('exit', killTail);
    process.on('uncaughtException', killTail);

    this.log('pid %d', this.tail.pid);
  };

  /**
   * Send a formatted message to stdout. Prepend the timestamp and source path.
   *
   * Accepts util.format() arguments.
   */
  Monitor.prototype.log = function() {
    if (program.quiet) {
      return;
    }
    util.log(
      util.format('%s: ', this.source.path)
      + util.format.apply(null, arguments)
    );
  };

  /**
   * Seed initial `tail` set based on config/app.js 'sources' list.
   */
  var startAllMonitors = function() {
    _.each(config.sources, function(source) {
      (new Monitor(source)).start();
    });
  };

  // Test mode -- wait until instructed by parent process.
  if (program.test) {
    process.on('message', function(message) {
      if ('START_TEST' == message) {
        startAllMonitors();
        process.send('MONITORS_STARTED');
      }
    });
  // Normal mode -- start immediately.
  } else {
    startAllMonitors();
  }
})();
