#!/usr/bin/env node

/**
 * Parse and insert all log lines in a path.
 */

'use strict';

(function() {
  var program = require('commander');

  var splitCsv = function(list) {
    return list.split(',');
  }

  // Support all attributes normally defined by config.js.
  program
    .option('-p, --parser <name>', 'Ex. nginx_access')
    .option('-P, --path <file>', 'Ex. /var/log/nginx/access.log')
    .option('-t, --tags [list]', 'Ex. tag1,tag2', splitCsv)
    .option('-T, --timeAttr [name]', 'Ex. logtime')
    .option('-r, --previewAttr [name]', 'Ex. message', splitCsv)
    .parse(process.argv);

  var source = {
    parser: program.parser,
    path: program.path,
    tags: program.tags,
    timeAttr: program.timeAttr,
    previewAttr: program.previewAttr
  };

  if (!source.parser || !source.path) {
    console.error('--parser and --path are required');
    process.exit(1);
  }

  require(__dirname + '/modules/mainevent.js');

  var lazy = require('lazy');
  new lazy(require("fs").createReadStream(source.path))
    .lines
    .map(String)
    .filter(function(line) {
      // lazy will convert a blank line to "undefined"
      return line !== 'undefined';
    })
    .join(function (lines) {
      if (lines.length) {
        var mongodb = mainevent.requireModule('mongodb').createInstance(),
            parsers = mainevent.requireModule('parsers/parsers');
        parsers.parseAndInsert(mongodb, {source: source, lines: lines});
      }
    });
})();
