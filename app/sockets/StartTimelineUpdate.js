/**
 * Serve automatic timeline updates.
 */
define([], function() {

  'use strict';

  var intervalDelay = mainevent.getConfig().timelineUpdateDelay,
      updateInterval = null;

  return function(socket) {

    /**
     * Client seeds the update stream with the last-seen ID/time.
     *
     * @param options {Object} Last-seen attributes.
     * - newestEventId {String}
     * - newestEventTime {Number}
     */
    socket.on('StartTimelineUpdate', function (options) {

      var sendUpdates = function(err, docs) {
        if (err) {
          docs = {__socket_error: err};
          socket.emit('TimelineUpdate', docs);
        } else {
          if (docs.length) {
            options.newestEventId = docs[0]._id.toString();
            options.newestEventTime = docs[0].time;

            var parsers = mainevent.requireModule('parsers/parsers');
            parsers.addPreviewContext(docs, function(docs) {
              socket.emit('TimelineUpdate', docs);
            });
          } else {
            socket.emit('TimelineUpdate', docs);
          }
        }
      };

      var checkForUpdates = function () {
        if (!options.newestEventId || !options.newestEventTime) {
          // Client never sent the ID for some reason -- don't stop the updates.
          return;
        }

        var mongodb = mainevent.requireModule('mongodb').createInstance();
        mongodb.getTimelineUpdates(
          options.newestEventId,
          options.newestEventTime,
          options.searchArgs,
          sendUpdates
        );
      };

      updateInterval = setInterval(checkForUpdates, intervalDelay);
    });

    socket.on('disconnect', function () {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    });
  };
});
