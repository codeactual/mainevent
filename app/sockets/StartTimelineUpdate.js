/**
 * Serve automatic timeline updates.
 */
define([], function() {

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
    res.socket.on('StartTimelineUpdate', function (options) {
      log('received StartTimelineUpdate');
      res.redis.client.on('message', onRedisMessage);
    });
    res.socket.on('disconnect', function () {
      log('disconnecting');
      res.redis.client.removeListener('message', onRedisMessage);
    });

    // TODO place this in a helper

    var clientReady = false;

    var sendReady = function() {
      if (clientReady) {
        return; // Break cycle.
      }
      log('asking client to reply');

      // All server observers created.
      res.socket.emit('ServerReady');

      // Send the event again soon.
      setTimeout(sendReady, 500);
    };

    res.socket.on('ClientReady', function() {
      log('client is ready');
      clientReady = true;
    });

    // All server observers ready.
    sendReady();
  };
});
