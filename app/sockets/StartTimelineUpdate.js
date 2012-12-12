/**
 * Serve automatic timeline updates.
 */
define([], function() {

  'use strict';

  return function(socket) {

    var redis = null;

    /**
     * Client seeds the update stream with the last-seen ID/time.
     *
     * @param options {Object} Last-seen attributes.
     * - newestEventId {String}
     * - newestEventTime {Number}
     */
    socket.on('StartTimelineUpdate', function (options) {
      if (!redis) {
        redis = mainevent.requireModule('redis').createInstance();

        redis.connect();
        redis.client.on('ready', function() {
          redis.client.subscribe('InsertLog');
          redis.client.on('message', function(channel, message) {
            if ('InsertLog' === channel) {
              var docs = JSON.parse(message),
              parsers = mainevent.requireModule('parsers');

              parsers.buildPreviewTemplateContext(docs, function(docs) {
                socket.emit('TimelineUpdate', docs);
              });
            }
          });
        });
      }
    });

    socket.on('disconnect', function () {
      if (!redis) {
        return;
      }
      redis.client.unsubscribe();
      redis.end();
      redis = null;
    });
  };
});
