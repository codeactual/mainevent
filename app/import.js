#!/usr/bin/env node

/**
 * Parse and insert all log lines in a path.
 */

'use strict';

var program = require('commander');

// Support all attributes normally defined by config.js.
program
  .option('-p, --parser <name>', 'Ex. nginx_access')
  .option('-P, --path <file>', 'Ex. /var/log/nginx/access.log')
  .option('-t, --tags [list]', 'Ex. tag1,tag2', function(list) { return list.split(','); })
  .option('-T, --timeAttr [name]', 'Ex. logtime')
  .parse(process.argv);

var source = {
  parser: program.parser,
  path: program.path,
  tags: program.tags,
  timeAttr: program.timeAttr
};

if (!source.parser || !source.path) {
  console.error('--parser and --path are required');
  process.exit(1);
}

GLOBAL.helpers = require(__dirname + '/modules/helpers.js');
var parsers = helpers.requireModule('parsers/parsers');

var lazy = require('lazy');
new lazy(require("fs").createReadStream(source.path))
  .lines
  .map(String)
  .join(function (lines) {
    parsers.parseAndInsert(source, lines);
  });
