'use strict';

exports.read = function () {
  GLOBAL.helpers = require(__dirname + '/../../app/modules/helpers.js');
  var config = helpers.getConfig();
  config.sources = [{
    path: '/tmp/diana-test-tail.log',
    parser: 'json',
    tags: []
  }];
  return config;
};
