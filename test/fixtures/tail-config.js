'use strict';

exports.read = function () {
  var config = diana.getConfig();
  config.sources = [{
    path: '/tmp/diana-test-tail.log',
    parser: 'json',
    tags: []
  }];
  return config;
};
