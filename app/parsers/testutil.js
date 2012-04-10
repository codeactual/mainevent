'use strict';

var self = {},
    testutil = require(__dirname + '/../../test/modules/testutil.js'),
    parsers = exports.parsers = mainevent.requireModule('parsers');

/**
 * Verification helper for parser-specific tests.
 *
 * @param test {Object} Instance injected into the calling case function.
 * @param log {String} Log line.
 * @param parser {String} Ex. 'NginxAccess'.
 * @param expected {Object} Attributes from parse result.
 */
self.assertParseValid = function(test, log, parser, expected) {
  var actual = parsers.createInstance(parser).parse(log);
  var expectedKeys = Object.keys(expected);

  test.equal(Object.keys(actual).length, expectedKeys.length);

  expectedKeys.forEach(function(key) {
    test.equal(actual[key], expected[key]);
  });
};

// Merge the main testutil module with this extension.
_.extend(exports, self, testutil);
