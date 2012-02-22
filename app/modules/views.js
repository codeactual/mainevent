/**
 * Helpers related to views and templates.
 */

'use strict';

var dust = require('dust');
var fs = require('fs');
var path = require('path');

/**
 * Compile all dust.js templates into a public directory.
 */
exports.compile = function() {
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
