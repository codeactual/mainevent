'use strict';

// TODO: consolidate parse_log/parse_log_multi

if (!process.argv[2] || !process.argv[3]) {
  console.error('usage: node import.js <parser> <file>');
  process.exit(1);
}

var fs  = require("fs");
var lazy = require('lazy');
var parsers = require(__dirname + '/modules/parsers/parsers.js');

var source = {
  parser: process.argv[2],
  file: process.argv[3],
  tags: process.argv[4] ? process.argv[4].split(',') : []
};

new lazy(fs.createReadStream(source.file))
  .lines
  .map(String)
  .join(function (lines) {
    parsers.parse_log_multi(source, lines);
  });
