'use strict';

exports.on = function(logs) {
  var redis = mainevent.requireModule('redis').createInstance();
  redis.connect();
  redis.client.publish('InsertLog', JSON.stringify(logs), function() {
    redis.client.end();
  });
};
