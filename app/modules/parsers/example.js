/**
 * Template for new parser classes.
 */

'use strict';

exports.createInstance = function() {
  return new ExampleParser();
};

var ExampleParser = function() {
  Parser.call(this, 'example');
};

mainevent.shared.Lang.inheritPrototype(ExampleParser, Parser);

/**
 * REQUIRED: Convert a log line string into an object of parsed key/value pairs
 *
 * @param log {String} Ex. web access log line.
 * @return {Object} Parsed keys/values.
 */
ExampleParser.prototype.parse = function(log) {
  /**
   * Helpers available in app/modules/parsers.js:
   *
   * - namedCapture() - creates named match() results
   * - candidateCapture() - wraps multiple namedCapture() attempts
   *
   */
  return parsed;
};

/**
 * OPTIONAL: Augment the context object sent to the preview template.
 *
 * - Used to assist either getPreview() or template-based preview building.
 *
 * @param log {Object} Parsed key/value pairs from the database.
 * @return {Object} Augmented input.
 */
ExampleParser.prototype.addPreviewContext = function(log) {
  /**
   * Ex. add extra properties derived from the core set, or remove any that
   * should not be accessible in the template.
   */
  return log;
};

/**
 * OPTIONAL: Build a log preview string.
 *
 * - Alternative to using a preview template.
 *
 * @param log {Object} Parsed key/value pairs from the database.
 * @return {String} Exact 'preview' attribute addPreviewContext() adds to each log object.
 */
ExampleParser.prototype.getPreview = function(parsed) {
  /**
   * Ex. return just a single pair's value that sufficiently previews the log event.
   */
  return preview;
};

/**
 * OPTIONAL: Augment the context object sent to the single-event template.
 *
 * @param log {Object} Parsed key/value pairs from the database.
 * @return {Object} Augmented input.
 */
ExampleParser.prototype.decorateFullContext = function(log) {
  /**
   * Ex. add extra properties derived from the core set, or remove any that
   * should not be accessible in the template.
   */
  return decorated;
};

/**
 * OPTIONAL: Convert a date/time string into a millisecond-based timestamp.
 *
 * @param date {String} Ex. '12/Mar/2012:09:03:31 +0000'
 * @return {Number} Milliseconds since UNIX epoch.
 */
ExampleParser.prototype.extractTime = function(date) {
  /**
   * Ex. reformat the input into a Date.parse()-able format.
   */
  return Date.parse(parsable);
};
