'use strict';

exports.read = function () {
  var config = mainevent.getConfig();
  config.sources = [{
    path: '/tmp/mainevent-test-tail.log',
    parser: 'json',
    tags: ['test1', 'test2'],
    timeAttr: 't',
    previewAttr: ['subject']
  }];
  return config;
};
