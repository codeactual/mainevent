define([], function() {

  'use strict';

  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  // localStorage cache for items like /event/:id responses.
  diana.helpers.cache = new clientsiiide('Diana');
});
