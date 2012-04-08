#!/usr/bin/env node

/**
 * Front-end for client-side tests.
 */

'use strict';

var _ = require('underscore');
var fs = require('fs');
var express = require('express');
var app = express.createServer();

app.register('.html', {
  compile: function(str, options) {
    return function() {
      return _.template(str)(options);
    };
  }
});

app.use(express.static(__dirname + '/../public'));
app.use(express.static(__dirname + '/../test/browser'));

app.set('views', __dirname + '/views');
app.set('view options', {layout: false});

app.get('/', function(req, res) {
  // test.html will load all files under test/browser/.
  var suites = [];
  _.each(fs.readdirSync(__dirname + '/../test/browser'), function(suite) {
    suites.push(suite);
  });
  res.render('test.html', {testScripts: JSON.stringify(suites)});
});

app.listen(8081, '127.0.0.1');
