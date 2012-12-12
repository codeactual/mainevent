define(['xregexp'], function(XRegExp) {

  'use strict';

  var root = 'undefined' === typeof window ? GLOBAL : window;
  root.mainevent = root.mainevent || {};
  root.mainevent.shared = root.mainevent.shared || {};
  var mainevent = root.mainevent;

  XRegExp = XRegExp.XRegExp;

  mainevent.shared.XRegExp = {

    /**
     * Perform XRegExp.exec() and filter out all keys except those captured.
     *
     * @param subject {String}
     * @param pattern {String}
     * @return {Object}
     */
    namedCaptureMatch: function(subject, pattern) {
      var match = XRegExp.exec(subject, XRegExp(pattern));

      if (!match) {
        return match;
      }

      var filtered = {};
      _.each(Object.keys(match), function(key) {
        if (key.match(/^[0-9]+$/) || 'input' === key || 'index' === key) {
          return;
        }
        filtered[key] = match[key];
      });

      return filtered;
    }
  };
});
