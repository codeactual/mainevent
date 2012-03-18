'use strict';

exports.read = function () {
  var config = diana.getConfig();
  config.sources = [{
    path: '/tmp/diana-test-tail.log',
    parser: 'json',
    tags: ['test1', 'test2'],
    timeAttr: 't',
    previewAttr: ['subject']
  }];
  return config;
};
