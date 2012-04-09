#!/usr/bin/env node

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

// Express/Backbone views.
var baseDir = __dirname + '/../../app/views';

_.each(fs.readdirSync(baseDir), function(template) {
  // Ex. 'index'
  var templateName = path.basename(template, '.html');
  // Append the compiled template.
  fs.writeSync(
    fd,
    dust.compile(
      fs.readFileSync(
        baseDir + '/' + templateName + '.html',
        'UTF-8'
      ),
      templateName
    ),
    null,
    'utf8'
  );
});

// Parser templates.
baseDir = __dirname + '/../../app/parsers';

_.each(fs.readdirSync(baseDir), function(parser) {
  if (!fs.statSync(baseDir + '/' + parser).isDirectory()) {
    return;
  }

  // Ex. 'app/parsers/Json/templates'.
  var parserDir = baseDir + '/' + parser + '/templates';

  _.each(fs.readdirSync(parserDir), function(template) {
    // Ex. 'JsonPreview'.
    var templateName = path.basename(parser + template, '.html');

    // Append the compiled template.
    fs.writeSync(
      fd,
      dust.compile(
        fs.readFileSync(
          parserDir + '/' + template,
          'UTF-8'
        ),
        templateName
      ),
      null,
      'utf8'
    );
  });
});

fs.writeSync(fd, "return dust; });");
fs.closeSync(fd);
