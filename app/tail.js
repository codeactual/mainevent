'use strict';

var spawn = require('child_process').spawn;
var util = require('util');
var config = require(__dirname + '/../config/config.js').read();
var parsers = require(__dirname + '/modules/parsers/parsers.js');

var monitor_file = function(source) {
  // --bytes=0 to skip preexisting lines
  var cmd = spawn('tail', ['--bytes=0', '-F', source.file]);
  cmd.stdout.on('data', function(data) {
    parsers.parse_log(
      source,
      data.toString().replace(/\n$/, '').split("\n")
    );
  });
  console.log('tailing: ' + source.file);
};

for (var s in config.sources) {
  monitor_file(config.sources[s]);
}
