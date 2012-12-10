#!/usr/bin/env node

'use strict';

require(__dirname + '/../app/modules/mainevent');

var spawn = require('child_process').spawn,
    fs = require('fs'),
    path = require('path'),
    dirs = [
      __dirname,
      __dirname + '/jobs'
    ],
    parserDir = __dirname + '/../app/parsers';

// Collect all parser-specific test dirs.
_.each(fs.readdirSync(parserDir), function(dir) {
  if (fs.statSync(parserDir + '/' + dir).isDirectory()) {
    dirs.push(__dirname + '/../app/parsers/' + dir  + '/test');
  }
});

// Collect all JS files from 'dirs'.
var files = [];
_.each(dirs, function(dir) {
  _.each(fs.readdirSync(dir), function(file) {
    if (path.extname(file) != '.js') {
      return;
    }
    files.push(dir + '/' + file);
  });
});

// Run each JS test file sequentially.
async.forEachSeries(
  files,
  function(file, onFileDone) {
    if (__filename == file) {
      onFileDone();
      return;
    }

    var cmd = __dirname + '/../node_modules/.bin/nodeunit';

    // `nodeunit` requires paths relative the CWD.
    var relPath = path.relative(process.cwd(), file),
        nodeunit = spawn(cmd, [relPath], {env: process.env});

    nodeunit.stdout.on('data', function (data) {
      process.stdout.write(data.toString());
    });
    nodeunit.stderr.on('data', function (data) {
      process.stdout.write(data.toString());
    });

    nodeunit.on('exit', function () {
      onFileDone();
    });
  }
);
