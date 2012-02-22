'use strict';

GLOBAL.helpers = require(__dirname + '/modules/helpers.js');
var parsers = helpers.requireModule('parsers/parsers');
var spawn = require('child_process').spawn;

var monitor_file = function(source) {
  // --bytes=0 to skip preexisting lines
  var cmd = spawn('tail', ['--bytes=0', '-F', source.file]);

  cmd.stdout.on('data', function(data) {
    parsers.parse_log(
      source,
      data.toString().replace(/\n$/, '').split("\n")
    );
  });
  console.info('tailing: %s (%s)', source.file, source.parser);
};

var config = require(__dirname + '/../config/config.js').read();
for (var s in config.sources) {
  monitor_file(config.sources[s]);
}
