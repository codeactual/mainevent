/**
 * TODO: import.js hangs on /tmp/php.log -- need way to mass-insert async
 * TODO: which table columns are always shown (how to render various event types)
 * TODO: Add file logging for 404/500 (http://expressjs.com/guide.html#error-handling)
 * TODO: Add 'err' handling to mongodb.js
 */

var _ = require('underscore');
var express = require('express');
var app = express.createServer();
var storage = require(__dirname + '/modules/storage/mongodb.js');
var config = require(__dirname + '/../config/config.js').read();

// http://stackoverflow.com/questions/6825325/example-of-node-js-express-registering-underscore-js-as-view-engine
app.register('.html', {
  compile: function (str, options) {
    var template = _.template(str);
    return function (locals) {
      return template(locals);
    };
  }
});

// http://japhr.blogspot.com/2011/10/underscorejs-templates-in-backbonejs.html
_.templateSettings = {
  evaluate : /\{\[([\s\S]+?)\]\}/g,
  interpolate : /\{\{([\s\S]+?)\}\}/g
};

// NODE_ENV=development node app/ui.js
app.configure('development', function() {
  console.log('environment: dev');
  var path = require('path');
  var dust = require('dust');
  var fs = require('fs');
  var templates = fs.readdirSync(__dirname + '/views');
  var fd = fs.openSync(__dirname + '/../public/templates/compiled.js', 'a');
  _.each(templates, function(template) {
    console.log('template: ' + template);
    var templateName = path.basename(template, '.html');
    var compiled = dust.compile(fs.readFileSync(__dirname + '/views/' + template, 'UTF-8'), templateName);
    dust.loadSource(compiled);
    fs.writeSync(fd, compiled, null, 'utf8');
    //fs.writeFileSync(path.join(__dirname + '/../public/templates', templateName + '.js'), compiled);
    //fs.writeFileSync(path.join(__dirname + '/../public/templates/compiled.js'), compiled);
  });
});

app.use(express.static(__dirname + '/../public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.set('view options', { layout: false });

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/timeline', function(req, res) {
  storage.get_timeline(req.query, function(err, documents) {
    res.send(documents);
  });
});

app.get('/event/:id', function(req, res) {
  if (!req.params.id.match(/^[a-z0-9]{24}$/)) {
    res.send(null);
  }
  storage.get_log(req.params.id, function(err, document) {
    res.send(document);
  });
});

app.listen(8080, '127.0.0.1');
