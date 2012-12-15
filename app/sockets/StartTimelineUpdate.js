/**
 * Serve automatic timeline updates.
 */
define([], function() {

  'use strict';

  var config = mainevent.getConfig();

  // Use the 'quiet' argument to effectively log only in verbose-mode.
  var log = mainevent.createUtilLogger('socket:StartTimelineUpdate', !config.log.verbose);

  return function(socket) {

    var redis = null;

    log('listening');

    /**
     * Client seeds the update stream with the last-seen ID/time.
     *
     * @param options {Object} Last-seen attributes.
     * - newestEventId {String}
     * - newestEventTime {Number}
     */
    socket.on('StartTimelineUpdate', function (options) {
      if (redis) {
        log('reusing redis client');
      } else {
        log('creating redis client');
        redis = mainevent.requireModule('redis').createInstance();

        redis.connect();
        redis.client.on('ready', function() {
          log('redis client is ready');
          redis.client.subscribe('InsertLog');
          redis.client.on('message', function(channel, message) {
            log('redis message', channel, message);
            if ('InsertLog' === channel) {
              var docs = JSON.parse(message),
              parsers = mainevent.requireModule('parsers');
              log('building preview', channel, message);
              parsers.buildPreviewTemplateContext(docs, function(docs) {
                log('sending message', channel, message);
                socket.emit('TimelineUpdate', docs);
              });
            }
          });
        });
      }
    });

    socket.on('disconnect', function () {
      log('disconnecting');
      if (!redis) {
        log('no redis client to clean up');
        return;
      }
      log('cleaning up redis client');
      redis.client.unsubscribe();
      redis.end();
      redis = null;
    });
  };
});
