#!/usr/bin/env node

/**
 * Build static/.
 */

require(__dirname + '/../app/modules/mainevent');

var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    program = require('commander'),
    exec = require('child_process').exec,
    APP = __dirname + '/..',
    SOURCE = APP + '/public',
    BUILD = APP + '/static',
    BUILD_OLD = APP + '/static-old',
    BUILD_TMP = APP + '/static-tmp';

program
  .option('-p, --prod')
  .parse(process.argv);

exec('pgrep -f "node.*public/build.js" | wc -w', null, function(code, stdout) {
  if (stdout.toString().trim() != '2') {
    console.log('Another instance is already running.');
    process.exit(0);
  }

  var commands = [];
  _.each(steps, function(step) {
    commands = commands.concat(step());
  });

  mainevent.shared.Async.runSync(
    commands,
    function(command, onCommandDone) {
      exec(command, null, function(code, stdout, stderr) {
        onCommandDone();
      });
    }
  );
});

var steps = [
  // Clean prior build.
  function() {
    return ['rm -rf ' + BUILD_TMP, 'mkdir ' + BUILD_TMP];
  },

  // Compile templates.
  function() {
    return [SOURCE + '/js/templates.build.js'];
  },

  // Compress JS.
  function() {
    var commands = ['cp -a ' + SOURCE + '/js ' + BUILD_TMP + '/js-compressed'];

    if (program.prod) {
      // Only compress internal scripts.
      commands.push('find ' + BUILD_TMP + '/js-compressed -regex ".*\\(index\\|\\(backbone\\|collections\\|controllers\\|helpers\\|models\\|observers\\|shared\\|views\\)\\/\\).*js" -exec java -jar ' + SOURCE + '/yuicompressor.jar -o {} {} \\;');
    }

    return commands;
  },

  // Combine Js
  function() {
    return [
      'r.js -o ' + BUILD_TMP + '/js-compressed/app.build.js',
      'rm -rf ' + BUILD_TMP + '/js-compressed'
    ];
  },

  // Combine and compress CSS.
  function() {
    var commands = ['mkdir ' + BUILD_TMP + '/css'];
        files = [
          SOURCE + '/css/bootstrap.css',
          SOURCE + '/css/jquery-ui.css',
          SOURCE + '/css/jquery-ui-timepicker-addon.css',
          SOURCE + '/css/jquery.jqplot.css',
          SOURCE + '/css/index.css'
        ];


    // Add files from each parser directory.
    var baseDir = __dirname + '/../app/parsers';
    _.each(fs.readdirSync(baseDir), function(parser) {
      if (!fs.statSync(baseDir + '/' + parser).isDirectory()) {
        return;
      }

      // Ex. 'app/parsers/Json/css'.
      var cssDir = baseDir + '/' + parser + '/css';
      if (path.existsSync(cssDir)) {
        _.each(fs.readdirSync(cssDir), function(template) {
          files.push(cssDir + '/' + template);
        });
      }
    });

    commands.push('cat ' + files.join(' ') + ' > ' + BUILD_TMP + '/css/all.css');

    if (program.prod) {
      commands.push('java -jar ' + SOURCE + '/yuicompressor.jar -o ' + BUILD_TMP + '/css/all.css ' + BUILD_TMP + '/css/all.css');
    }

    return commands;
  },

  // Copy images.
  function() {
    return [
      // jquery-ui-timepicker-addon images.
      'cp -a ' + SOURCE + '/css/images ' + BUILD_TMP + '/css/',
      // app/Bootstrap images.
      'cp -a ' + SOURCE + '/img ' + BUILD_TMP + '/'
    ];
  },

  // Replace old build.
  function() {
    var commands = [];

    try {
      fs.statSync(BUILD);
      commands.push('mv ' + BUILD + ' ' + BUILD_OLD);
    } catch (e) {
      if (!e.toString().match(/no such file/)) {
        // Not a first build issue.
        throw e;
      }
    }

    commands.push('mv ' + BUILD_TMP + ' ' + BUILD);

    return commands;
  },

  // Clean up.
  function() {
    return [
      'rm -f ' + BUILD + '/js/app.build.js',
      'rm -f ' + BUILD + '/js/templates.build.js',
      'rm -rf ' + BUILD_OLD
    ];
  }
];
