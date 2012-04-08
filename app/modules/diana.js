/**
 * Supply common/stateless helpers and module instances.
 *
 * All entry points (ui.js, app/tail.js, test runners, etc) must require()
 * this module. Modules like parsers/parsers.js assume its presence.
 */

'use strict';

GLOBAL._ = require('underscore');
GLOBAL.util = require('util');

GLOBAL.requirejs = require('requirejs');
requirejs.config({
  baseUrl: __dirname + '/../../public/js'
});

GLOBAL.diana = {
  /**
   * Load core module.
   *
   * @param name {String} Path relative to app/modules. No trailing '.js'.
   * @return {Object}
   */
  requireModule: function(name) {
    return require(__dirname + '/' + name + '.js');
  },

  /**
   * Load job module.
   *
   * @param name {String} Path relative to app/modules. No trailing '.js'.
   * @return {Object}
   */
  requireJob: function(name) {
    name = diana.extractJobName(name);
    return require(__dirname + '/../jobs/' + name + '.js');
  },

  /**
   * Convert a job script's absolute path into its base name.
   *
   * @param name {String}
   * @return {String}
   */
  extractJobName: function(name) {
    if (name[0] == '/') {
      name = require('path').basename(name, '.js');
    }
    return name;
  },

  /**
   * Read the app configuration file.
   *
   * @return {Object}
  */
  getConfig: function(file) {
    if (file) {
      file = require('fs').realpathSync(file);
    } else {
      file = __dirname + '/../../config/app.js';
    }
    return require(file).read();
  },

  /**
   * Create a util.log() wrapper that prepends each message with a logger name.
   *
   * Usage:
   * var jobLog = diana.createUtilLogger('MyJob');
   * jobLog('Command "%s" returned with reply "%s"', cmd, reply);
   *
   * Out:
   * 6 Apr 06:15:34 - MyJob: Command "SET foo bar" returned with reply "OK"
   *
   * @param name {String}
   * @param quiet {Boolean} If true, function exits immediately.
   * - Intended to cleanly support --quiet CLI flag w/out another wrapper.
   * @return {Function} Accepts util.format() arguments.
   */
  createUtilLogger: function(name, quiet) {
    if (quiet) {
      return function() {};
    }
    return function() {
      var args = Array.prototype.slice.call(arguments);
      args = _.map(args, function(arg) {
        return _.isObject(arg) ? JSON.stringify(arg) : arg;
      });
      util.log(
        util.format('%s: ', name)
        + util.format.apply(null, args)
      );
    };
  }
};

/**
 * Derive a SHA1 hash of the given value's JSON.
 *
 * @param value {mixed}
 * @return {String}
 */
_.sha1 = function(value) {
  var crypto = require('crypto'),
      sha1 = crypto.createHash('sha1');
  sha1.update(JSON.stringify(value));
  return sha1.digest('hex');
};

requirejs('shared/Async');
requirejs('shared/Date');
requirejs('shared/Lang');
