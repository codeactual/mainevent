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

var express = require('express');
var app = express.createServer();
require(__dirname + '/modules/diana.js');
var config = diana.getConfig();
var storage = diana.requireModule('storage/mongodb');
var parsers = diana.requireModule('parsers/parsers');
var io = require('socket.io').listen(app);

// Merge/compile/combine HTML and JS assets.
var build = diana.requireModule('build');
build.compileViews();
build.combineCss();
build.combineClientJavascript();

// Required for using *.html with res.render().
app.register('.html', {
  compile: function(str, options) {
    return function() {
      return _.template(str)(options);
    };
  }
});

// Make assets accessible to clients.
app.use(express.static(__dirname + '/../public'));

// Prepended to relative paths given to res.render().
app.set('views', __dirname + '/views');
app.set('view options', {layout: false});

// Serve the backbone.js MVC app.
app.get('/', function(req, res) {
  res.render('index.html', {
    // Injected into global client-side 'diana' object.
    parsers: JSON.stringify(parsers.getConfiguredParsers()),
    maxResultSize: config.storage.maxResultSize
  });
});

app.get('/timeline', function(req, res) {
  if ('_id' == req.query['sort-attr'] && 'desc' == req.query['sort-dir']) {
    res.setHeader('Cache-Control: no-store, no-cache, must-revalidate');
  }

  storage.getTimeline(req.query, function(err, docs, info) {
    if (err) {
      res.send({__error: err}, 500);
    } else if (docs.length) {
      // Augment each document object with preview text for the view table.
      diana.requireModule('parsers/parsers').addPreviewContext(docs, function(updated) {
        res.send({nextPage: info.nextPage, results: updated});
      });
    } else {
      res.send([]);
    }
  });
});

app.get('/event/:id', function(req, res) {
  if (req.params.id.match(/^[a-z0-9]{24}$/)) {
    storage.getLog(req.params.id, function(err, doc) {
      if (err) {
        res.send({__error: err}, 500);
      } else {
        if (doc) {
          if ('json' == doc.parser) {
            var list = [];
            _.each(doc, function(value, key) {
              list.push({key: key, value: value});
            });
            res.send({__list: list, parser: doc.parser});
          } else {
            doc = diana.requireModule('parsers/parsers')
              .createInstance(doc.parser)
              .decorateFullContext(doc);
            res.send(doc);
          }
        } else {
          res.send({__error: 'Event not found.'}, 404);
        }
      }
    });
  } else {
    res.send({__error: 'Event not found.'}, 404);
  }
});

// Serve automatic timeline updates.
io.sockets.on('connection', function (socket) {

  // Client seeds the update stream with the last-seen ID.
  socket.on('startTimelineUpdate', function (options) {
    var timelineUpdate = setInterval(function () {
      if (!options.newestEventId) {
        // Client never sent the ID for some reason -- don't stop the updates.
        return;
      }
      storage.getTimelineUpdates(options.newestEventId, options.searchArgs, function(err, docs) {
        if (err) {
          docs = {__socket_error: err};
          socket.emit('timelineUpdate', docs);
        } else {
          if (docs.length) {
            options.newestEventId = docs[0]._id.toString();
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
    if ("undefined" != typeof timelineUpdate) {
      clearInterval(timelineUpdate);
    }
  });
});

app.error(function(err, req, res, next) {
  res.send({__error: err.message}, 500);
});

app.listen(8080, '127.0.0.1');
