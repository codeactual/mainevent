/**
 * Serve automatic timeline updates.
 */
define([], function() {

  'use strict';

  return function(socket) {

    var redis = null;
    var log = mainevent.createUtilLogger('StartTimelineUpdate');

    /**
     * Client seeds the update stream with the last-seen ID/time.
     *
     * @param options {Object} Last-seen attributes.
     * - newestEventId {String}
     * - newestEventTime {Number}
     */
    socket.on('StartTimelineUpdate', function (options) {
      if (redis) {
        log('REDIS CLIENT: reusing');
      } else {
        log('REDIS CLIENT: creating');

        redis = mainevent.requireModule('redis').createInstance();

        redis.connect();
        redis.client.on('ready', function() {
          log('REDIS CLIENT: ready');
          redis.client.subscribe('InsertLog');
          redis.client.on('message', function(channel, message) {
            log('REDIS CLIENT message', channel, message);
            if ('InsertLog' == channel) {
              var docs = JSON.parse(message),
              parsers = mainevent.requireModule('parsers');

              log('buildPreviewTemplateContext');
              parsers.buildPreviewTemplateContext(docs, function(docs) {
                log('EMIT TimelineUpdate');
                socket.emit('TimelineUpdate', docs);
              });
            }
          });
        });
      }
    });

    socket.on('disconnect', function () {
      log('SOCKET disconnect');
      if (!redis) {
        log('NO REDIS CLIENT at disconnection');
        return;
      }
      log('REDIS CLIENT: cleaning up');
      redis.client.unsubscribe();
      redis.end();
      redis = null;
    });
  };
});
