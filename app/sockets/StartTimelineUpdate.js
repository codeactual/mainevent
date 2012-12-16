/**
 * Serve automatic timeline updates.
 */
define(['shared/socket'], function(socketHelper) {

  'use strict';

  var config = mainevent.getConfig();

  // Use the 'quiet' argument to effectively log only in verbose-mode.
  var log = mainevent.createUtilLogger('socket:StartTimelineUpdate', !config.log.verbose);

  // PubSub state.
  var subscribed = false;

  return function(res) {
    log('listening');

    if (subscribed) {
      log('already subscribed');
    } else {
      log('subscribing');
      res.redis.client.subscribe('InsertLog');
      subscribed = true;
    }

    var onRedisMessage = function(channel, message) {
      log('redis message', channel, message);
      if ('InsertLog' === channel) {
        var docs = JSON.parse(message),
        parsers = mainevent.requireModule('parsers');
        log('building preview', channel, message);
        parsers.buildPreviewTemplateContext(docs, function(docs) {
          log('sending message', channel, message);
          res.socket.emit('TimelineUpdate', docs);
        });
      }
    };

    /**
     * Client seeds the update stream with the last-seen ID/time.
     *
     * @param options {Object} Last-seen attributes.
     * - newestEventId {String}
     * - newestEventTime {Number}
     */
    res.socket.on('StartTimelineUpdate', _.once(function (options) {
      log('received StartTimelineUpdate');
      res.redis.client.on('message', onRedisMessage);
    }));
    res.socket.on('disconnect', function () {
      log('disconnecting');
      res.redis.client.removeListener('message', onRedisMessage);
    });

    socketHelper.syncWithClient(res.socket, function() {
      log('client is ready');
    });
  };
});
