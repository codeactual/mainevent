'use strict';

exports.read = function () {
  var config = mainevent.getConfig();
  config.sources = [{
    path: '/tmp/mainevent-test-tail.log',
    parser: 'Json',
    tags: ['test1', 'test2'],
    timeAttr: 't',
    previewAttr: ['subject']/*
    sshKey: '/path/to/key',
    sshPort: 22,
    sshUser: '',
    sshHost: '127.0.0.1'*/
  }];
  return config;
};
