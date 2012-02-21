/**
 * TODO: use different label style for each HTTP error code
 * TODO: camelcase/underscore inconsistency
 * TODO: Add file logging for 404/500 (http://expressjs.com/guide.html#error-handling)
 * TODO: Add 'err' handling to mongodb.js
 */

var _ = require('underscore');
var express = require('express');
var app = express.createServer();
var storage = require(__dirname + '/modules/storage/mongodb.js');
var config = require(__dirname + '/../config/config.js').read();

require(__dirname + '/modules/views.js').compile();

app.register('.html', {
  compile: function(str, options) {
    return function() { return str; };
  }
});

app.use(express.static(__dirname + '/../public'));
app.set('views', __dirname + '/views');
app.set('view options', { layout: false });

app.get('/', function(req, res) {
  res.render('index.html');
});

app.get('/timeline', function(req, res) {
  storage.get_timeline(req.query, function(err, documents) {
    if (err) {
      res.send({error: err});
    } else if (documents.length) {
      var parsers = require(__dirname + '/modules/parsers/parsers.js');
      parsers.addPreview(documents, function(updated) {
        res.send(updated);
      });
    } else {
      res.send([]);
    }
  });
});

app.get('/event/:id', function(req, res) {
  if (!req.params.id.match(/^[a-z0-9]{24}$/)) {
    res.send(null);
  }
  storage.get_log(req.params.id, function(err, document) {
    if (err) {
      res.send({error: err});
    } else {
      res.send(document);
    }
  });
});

app.listen(8080, '127.0.0.1');
