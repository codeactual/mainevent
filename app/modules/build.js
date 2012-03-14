/**
 * Helpers related to build steps like compiling templates and combining JS.
 */

'use strict';

var dust = require('dust');
var fs = require('fs');
var path = require('path');

/**
 * Compile all dust.js templates into a public directory.
 */
exports.compileViews = function() {
  var fd = fs.openSync(__dirname + '/../../public/templates/compiled.js', 'w');

  _.each(fs.readdirSync(__dirname + '/../views'), function(template) {
    // Ex. 'index'
    var baseName = path.basename(template, '.html');
    // Append the compiled template.
    fs.writeSync(
      fd,
      dust.compile(
        fs.readFileSync(exports.getPath(baseName), 'UTF-8'),
        baseName
      ),
      null,
      'utf8'
    );
  });

  fs.closeSync(fd);
};

/**
 * Minify and combine Javascript.
 */
exports.combineJavascript = function() {
  var fd = fs.openSync(__dirname + '/../../public/js/mvc.js', 'w');

  var backboneDirs = ['helpers', 'models', 'collections', 'views'];
  var baseJsDir = __dirname + '/../../public/js/';
  var first = true;

  _.each(backboneDirs, function(dir) {
    _.each(fs.readdirSync(baseJsDir + dir), function(jsFile) {
      var content = fs.readFileSync(baseJsDir + dir + '/' + jsFile, 'UTF-8');
      if (!first) {
        content = content.replace(/^['"]use strict['"];\n/gm, '');
      }
      fs.writeSync(
        fd,
        content,
        null,
        'utf8'
      );
      first = false;
    });
  });

  fs.closeSync(fd);
};

/**
 * Return the location of a named view.
 *
 * @param name {String} View name.
 * @return {String} Absolute path.
 */
exports.getPath = function(name) {
  return __dirname + '/../views/' + name + '.html';
};