#!/usr/bin/env node

/**
 * Front-end for client-side tests.
 */

'use strict';

require(__dirname + '/../app/modules/mainevent.js');

var _ = require('underscore'),
    fs = require('fs'),
    express = require('express'),
    app = express.createServer(),
    config = mainevent.getConfig();

app.register('.html', {
  compile: function(str, options) {
    return function() {
      return _.template(str)(options);
    };
  }
});

app.use(express.static(__dirname + '/../public'));
app.use(express.static(__dirname + '/../test/browser'));

app.set('views', __dirname + '/../app/views');
app.set('view options', {layout: false});

app.get('/', function(req, res) {
  // test.html will load all files under test/browser/.
  var suites = [];
  _.each(fs.readdirSync(__dirname + '/../test/browser'), function(suite) {
    suites.push(suite);
  });
  res.render('test.html', {testScripts: JSON.stringify(suites)});
});

app.listen(config.express.test_server.port, config.express.test_server.ip);

