'use strict';

var redis = mainevent.requireModule('redis').createInstance();
redis.connect();

exports.on = function(logs) {
  redis.client.publish('InsertLog', JSON.stringify(logs));
};
