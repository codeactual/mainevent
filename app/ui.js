/**
 * Serve HTTP requests for the backbone.js powered frontend, assets, and log JSON.
 *
 * Example usage: supervisor --extensions 'js|html' app/ui.js
 *
 * Example flow:
 *   browser - GET /#event/4f44bc7ea679dd8866000002
 *   backbone.js - GET /event/4f44bc7ea679dd8866000002
 *   backbone.js - Update view based on returned JSON.
 */

'use strict';

require(__dirname + '/modules/diana.js');

var express = require('express'),
    app = express.createServer(),
    storage = diana.requireModule('storage/storage').createInstance(),
    parsers = diana.requireModule('parsers/parsers'),
    parserNames = parsers.getConfiguredParsers(),
    io = require('socket.io').listen(app),
    build = diana.requireModule('build');

build.compileViews();
build.staticDir();

// Required for using *.html with res.render().
app.register('.html', {
  compile: function(str, options) {
    return function() {
      return _.template(str)(options);
    };
  }
});

// Make assets accessible to clients.
app.use(express.static(__dirname + '/../public-build'));

// Prepended to relative paths given to res.render().
app.set('views', __dirname + '/views');
app.set('view options', {layout: false});

var routes = {
  '/': 'index',
  '/event/:id': 'event',
  '/job/:name': 'job',
  '/timeline': 'timeline'
};

_.each(routes, function(controller, route) {
  app.get(route, function(req, res) {
    requirejs([__dirname + '/controllers/' + controller + '.js'], function(controller) {
      controller(req, res);
    });
  });
});

// Serve automatic timeline updates.
io.sockets.on('connection', function (socket) {
  var timelineUpdate = null;

  // Client seeds the update stream with the last-seen ID.
  socket.on('startTimelineUpdate', function (options) {
    timelineUpdate = setInterval(function () {
      if (!options.newestEventId || !options.newestEventTime) {
        // Client never sent the ID for some reason -- don't stop the updates.
        return;
      }
      storage.getTimelineUpdates(options.newestEventId, options.newestEventTime, options.searchArgs, function(err, docs) {
        if (err) {
          docs = {__socket_error: err};
          socket.emit('timelineUpdate', docs);
        } else {
          if (docs.length) {
            options.newestEventId = docs[0]._id.toString();
            options.newestEventTime = docs[0].time;
            parsers.addPreviewContext(docs, function(docs) {
              socket.emit('timelineUpdate', docs);
            });
          } else {
            socket.emit('timelineUpdate', docs);
          }
        }
      });
    }, diana.getConfig().timelineUpdateDelay);
  });

  socket.on('disconnect', function () {
    if (timelineUpdate) {
      clearInterval(timelineUpdate);
    }
  });
});

app.error(function(err, req, res, next) {
  res.send({__error: err.message}, 500);
});

app.listen(8080, '127.0.0.1');
