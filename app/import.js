/**
 * Parse and insert all log lines in a path.
 *
 * Example usage: node app/import.js nginx_access /var/log/ngninx/access.log
 */

'use strict';

if (!process.argv[2] || !process.argv[3]) {
  console.error('usage: node import.js <parser> <path>');
  process.exit(1);
}

GLOBAL.helpers = require(__dirname + '/modules/helpers.js');
var parsers = helpers.requireModule('parsers/parsers');

// Should mirror the source structure in config.js.
var source = {
  parser: process.argv[2],
  path: process.argv[3],
  tags: process.argv[4] ? process.argv[4].split(',') : []
};

var lazy = require('lazy');
new lazy(require("fs").createReadStream(source.path))
  .lines
  .map(String)
  .join(function (lines) {
    parsers.parseAndInsert(source, lines);
  });
