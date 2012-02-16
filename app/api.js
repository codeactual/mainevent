var express = require('express');

var app = express.createServer();
app.use(express.static(__dirname + '/views'));

app.get('/', function(req, res){
  res.render('index.html', { title: 'My Site' });
});

app.listen(8080, '127.0.0.1');
