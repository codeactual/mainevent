/**
 * Helpers related to build steps like compiling templates and combining JS.
 */

'use strict';

var log = mainevent.createUtilLogger('build');

/**
 * Build public-build/ static directory.
 */
exports.staticDir = function() {
  require('child_process').spawn(__dirname + '/../../public/build.js');
}

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
  var mongodb = mainevent.requireModule('mongodb').createInstance();
  mongodb.ensureConfiguredIndexes(function(err) {
    if (err) {
      log('mongoDbIndexes() did not complete, last error: %s', err);
    }
  });
};
