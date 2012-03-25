/**
 * Helpers related to build steps like compiling templates and combining JS.
 */

'use strict';

var dust = require('dust');
var fs = require('fs');
var path = require('path');

/**
 * Remove strict directive from a string.
 *
 * @param script {String}
 * @return {String}
 */
var stripStrict = function(str) {
  return str.replace(/^['"]use strict['"];\n/gm, '');
};

/**
 * Compile all dust.js templates into a public directory.
 */
exports.compileViews = function() {
  var fd = fs.openSync(__dirname + '/../../public/js/templates.js', 'w');

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
 * Combine CSS.
 */
exports.combineCss = function() {
  var baseCssDir = __dirname + '/../../public/css/';
  var fd = fs.openSync(baseCssDir + 'all.css', 'w');
  var cssFiles = [
    'bootstrap.css',
    'jquery-ui.css',
    'jquery-ui-timepicker-addon.css',
    'index.css'
  ];
  _.each(cssFiles, function(cssFile) {
    var content = fs.readFileSync(baseCssDir + '/' + cssFile, 'UTF-8');
    fs.writeSync(fd, content, null, 'utf8');
  });
  fs.closeSync(fd);
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
