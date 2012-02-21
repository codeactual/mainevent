'use strict';

var _ = require('underscore');
var dust = require('dust');
var fs = require('fs');
var path = require('path');

exports.compile = function() {
  var fd = fs.openSync(__dirname + '/../../public/templates/compiled.js', 'a');
  var templates = fs.readdirSync(__dirname + '/../views');

  _.each(templates, function(template) {
    var templateName = path.basename(template, '.html');
    var compiled = dust.compile(fs.readFileSync(exports.getPath(templateName), 'UTF-8'), templateName);
    dust.loadSource(compiled);
    fs.writeSync(fd, compiled, null, 'utf8');
  });
};

exports.getPath = function(name) {
  return __dirname + '/../views/' + name + '.html';
};
