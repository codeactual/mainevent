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
 * Combine client-side Javascript.
 */
exports.combineClientJavascript = function() {
  var baseJsDir = __dirname + '/../../public/js/';

  var fd = fs.openSync(__dirname + '/../../public/js/mvc.js', 'w');
  var backboneDirs = [
    'helpers', 'models', 'collections', 'views', 'observers', 'controllers'
  ];
  _.each(backboneDirs, function(dir) {
    _.each(fs.readdirSync(baseJsDir + dir), function(jsFile, fileNum) {
      var content = fs.readFileSync(baseJsDir + dir + '/' + jsFile, 'UTF-8');
      if (fileNum) {
        content = stripStrict(content);
      }
      fs.writeSync(fd, content, null, 'utf8');
    });
  });
  fs.closeSync(fd);

  fd = fs.openSync(__dirname + '/../../public/js/libs.js', 'w');
  var libs = [
    'jquery.js',
    'jquery-ui.js',
    'jquery-ui-timepicker-addon.js',
    'underscore.js',
    'backbone.js',
    'bootstrap-modal.js',
    'bootstrap-alert.js',
    'bootstrap-dropdown.js',
    'dust.js',
    'moment.js',
    'clientsiiide.js',
    'socket.io.js'
  ];
  _.each(libs, function(jsFile) {
    fs.writeSync(fd, fs.readFileSync(baseJsDir + 'libs/' + jsFile, 'UTF-8') + "\n", null, 'utf8');
  });
  fs.closeSync(fd);
};

/**
 * Combine Javascript shared by client and server. Load into server-side.
 */
exports.combineAndLoadSharedJavascript = function() {
  var baseJsDir = __dirname + '/../../public/js/shared/';
  var outputFile = __dirname + '/../../public/js/shared.js';

  var fd = fs.openSync(outputFile, 'w');
  _.each(fs.readdirSync(baseJsDir), function(jsFile, fileNum) {
      var content = fs.readFileSync(baseJsDir + jsFile, 'UTF-8');
      if (fileNum) {
        content = stripStrict(content);
      }
    fs.writeSync(fd, content + "\n", null, 'utf8');
  });
  fs.closeSync(fd);

  require(outputFile);
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

/**
 * Return the location of compiled templates.
 *
 * @return {String} Absolute path.
 */
exports.getTemplatesPath = function() {
  return __dirname + '/../../public/js/templates.js';
};
