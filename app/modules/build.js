/**
 * Helpers related to build steps like compiling templates and combining JS.
 */

'use strict';

var log = diana.createUtilLogger('build');

/**
 * Compile all dust.js templates into a public directory.
 */
exports.compileViews = function() {
  var dust = require('dust'),
      fs = require('fs'),
      fd = fs.openSync(__dirname + '/../../public/js/templates.js', 'w'),
      path = require('path');

  // For server-side loading w/out RequireJS.
  fs.writeSync(fd, "if ('undefined' === typeof define) { var define = function(deps, callback) { callback(dust); }; }");

  // Load 'dust' here so we only need to load templates.js w/ RequireJS.
  fs.writeSync(fd, "define(['dust'], function(dust) {");
  _.each(fs.readdirSync(__dirname + '/../views'), function(template) {
    // Ex. 'index'
    var baseName = path.basename(template, '.html');
    // Append the compiled template.
    fs.writeSync(
      fd,
      dust.compile(fs.readFileSync(exports.getPath(baseName), 'UTF-8'), baseName),
      null,
      'utf8'
    );
  });
  fs.writeSync(fd, "return dust; });");

  fs.closeSync(fd);
};

/**
 * Build public-build/ static directory.
 */
exports.staticDir = function() {
  require('child_process').spawn(__dirname + '/../../public/build');
}

/**
 * Return the location of a named view.
 *
 * @param name {String} View name.
 * @return {String} Absolute path.
 */
exports.getPath = function(name) {
  return __dirname + '/../views/' + name + '.html';
};

/**
 * Return the location of compiled templates.
 *
 * @return {String} Absolute path.
 */
exports.getTemplatesPath = function() {
  return __dirname + '/../../public/js/templates.js';
};

/**
 * Ensure MongoDB indexes exist.
 */
exports.mongoDbIndexes = function() {
  var mongodb = diana.requireModule('mongodb').createInstance();
  mongodb.ensureConfiguredIndexes(function(err) {
    if (err) {
      log('mongoDbIndexes() did not complete, last error: %s', err);
    }
  });
};
