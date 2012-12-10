'use strict';

var extend = require(__dirname + '/../../prototype.js').extend;

exports.SyslogParser = extend({name: 'Syslog', humanName: 'Syslog'}, {

  parse: function(log) {
    return this.namedCapture(
      log,
      // From fluentd-0.10.9/lib/fluent/parser.rb:
      '^(?<time>[^ ]+\\s+[^ ]+ [^ ]+) (?<host>[^ ]*) (?<ident>[^:\\]]+)(\\[(?<pid>[0-9]+)\\])?: (?<message>.*)$'
    );
  },

  buildTemplateContext: function(template, log) {
    if ('full' == template) {
      return log;
    }

    delete log.pid;
    return log;
  },

  /**
   * Warning: Assumes system timezone is UTC.
   *
   * @param now {Object} (Parser-specific, Test-only) Date instance.
   */
  extractTime: function(log, now) {
    // For unit testing.
    if (undefined === now) {
      now = new Date();
    }

    var matches = log.time.match(/^([A-Za-z]+)\s+(\d+) (\d{2}:\d{2}:\d{2})/);
    if (!matches) {
      return NaN;
    }

    var template = '%d/%d/%d %s UTC';

    var parsable = util.format(
      template,
      mainevent.shared.Date.monthNameToNum(matches[1]),
      matches[2],
      now.getFullYear(), // syslog dates do not include years
      matches[3]
    );
    var parsed = Date.parse(parsable);

    // Support logs from the prior year, e.g. importing Dec 31 lines on Jan 1.
    // Assumes current host and source host are time synchronized and log times
    // will always be in the past.
    if (parsed > now.getTime()) {
      parsable = util.format(
        template,
        mainevent.shared.Date.monthNameToNum(matches[1]),
        matches[2],
        now.getFullYear() - 1,  // Current year is in the future, try last year.
        matches[3]
      );
      parsed = Date.parse(parsable);
    }
    return parsed;
  }
});
