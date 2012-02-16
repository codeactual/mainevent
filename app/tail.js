'use strict';

// TODO: normalize all parsed dates. if offset/zone not available, append system zone/offset
// TODO: make sure normal date is correctly interpreted by mongo 'new Date()'
// TODO: Log events that fall through all parsers will be saved as-is with TIME and SOURCE prepended
// TODO: genericize parsers.js test w/ data providers?

var spawn = require('child_process').spawn;
var util = require('util');
var storage = require(__dirname + '/modules/storage/mongodb.js');
var config = require(__dirname + '/../config/config.js').read();

storage.connect(config.storage);

var parsers = {};
for (var s in config.sources) {
  parsers[config.sources[s].parser] = require(__dirname + '/modules/parsers/' + config.sources[s].parser);
}

var send_log = function(source, msg) {
  msg = msg.toString();
  var lines = msg.replace(/\n$/, '').split("\n");
  for (var l in lines) {
    storage.insert_log(source, parsers[source.parser].parse(lines[l]));
  }
}

var monitor_file = function(source) {
  // --bytes=0 to skip preexisting lines
  var cmd = spawn('tail', ['--bytes=0', '-F', source.file]);
  cmd.stdout.on('data', function(data) {
    send_log(source, data);
  });
  console.log('tailing: ' + source.file);
};

for (var s in config.sources) {
  monitor_file(config.sources[s]);
}
