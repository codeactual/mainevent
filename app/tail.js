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
    .option('-q, --quiet')
    .option('-v, --verbose')
    .parse(process.argv);

  require(__dirname + '/modules/diana.js');
  var spawn = require('child_process').spawn,
      config = diana.getConfig(program.config),
      parsers = diana.requireModule('parsers/parsers'),
      procLog = diana.createUtilLogger('tail.js');

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

    this.log = diana.createUtilLogger(this.source.path, program.quiet);
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

      if (program.verbose) {
        monitor.log('data=[%s] length={%d]', data.toString(), lines.length);
      }

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

    // Kill `tail` before parent process exits.
    var killTail = function() {
      process.removeListener('END_MONITOR', killTail);
      if (monitor.tail) {
        monitor.log('killing ...');
        monitor.tail.kill('SIGKILL');
        monitor.log('killed');
        monitor.tail = null;
      }

      if (program.test) {
        if (!process.listeners('END_MONITOR').length) {
          process.send('MONITORS_ENDED');
        }
      }
    };
    process.on('END_MONITOR', killTail);

    this.log('pid %d', this.tail.pid);
  };

  /**
   * Seed initial `tail` set based on config/app.js 'sources' list.
   */
  var startAllMonitors = function() {
    _.each(config.sources, function(source) {
      (new Monitor(source)).start();
    });
  };

  /**
   * Trigger monitors to clean up their `tail` instances.
   */
  var endAllMonitors = function() {
    process.emit('END_MONITOR');
  };
  process.on('exit', endAllMonitors);
  process.on('SIGINT', function() {
    procLog('SIGINT received');
    process.exit();
  });
  process.on('SIGTERM', function() {
    procLog('SIGTERM received');
    process.exit();
  });
  process.on('uncaughtException', function(err) {
    procLog('uncaught exception: %s', err.stack ? err.stack : '');
    process.exit();
  });

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
