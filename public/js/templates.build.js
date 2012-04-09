/**
 * Compile all dust.js templates.
*/

'use strict';

var dust = require('dust'),
    fs = require('fs'),
    fd = fs.openSync(__dirname + '/templates.js', 'w'),
    path = require('path'),
    _ = require('underscore');

// For server-side loading w/out RequireJS.
fs.writeSync(fd, "if ('undefined' === typeof define) { var define = function(deps, callback) { callback(dust); }; }");

// Load 'dust' here so we only need to load templates.js w/ RequireJS.
fs.writeSync(fd, "define(['dust'], function(dust) {");

_.each(fs.readdirSync(__dirname + '/../../app/views'), function(template) {
  // Ex. 'index'
  var baseName = path.basename(template, '.html');
  // Append the compiled template.
  fs.writeSync(
    fd,
    dust.compile(
      fs.readFileSync(
        __dirname + '/../../app/views/' + baseName + '.html',
        'UTF-8'
      ),
      baseName
    ),
    null,
    'utf8'
  );
});
fs.writeSync(fd, "return dust; });");

fs.closeSync(fd);
