# [mainevent](http://codeactual.github.com/mainevent)

mainevent provides a suite of tools to gain insight into log files.

* Collect, parse and store updates from local and SSH-accessible log files.
* Easily write new parser modules for any file format.
* Searchable timeline with optional real-time updates.
* Dashboard analytics generated by [MongoDB MapReduce](http://www.mongodb.org/display/DOCS/MapReduce), [Redis](http://redis.io/) and [jqPlot](http://www.jqplot.com/).
* Write custom [Pub/Sub](http://redis.io/topics/pubsub) listeners to real-time updates.
* [more ...](http://codeactual.github.com/mainevent)

<a href="http://codeactual.github.com/mainevent"><img alt="3-screenshot set" src="http://codeactual.github.com/mainevent/img/screenshot-set.png" /></a>

## Use Cases

* Search development/production environment logs which span a variety of formats.
* Produce dashboard data and graphs specific to your insight needs.
* Filter and replicate real-time updates into additional systems for specialized processing or alerting.

## How To

### Create a new parser for an unsupported log format

Each parser lives in a separate directory under <code>[app/parsers/](https://github.com/codeactual/mainevent/tree/master/app/parsers/)</code> which holds its JS, CSS, templates and tests.

All parser classes extend a [base](https://github.com/codeactual/mainevent/blob/master/app/parsers/prototype.js) and only need to implement a small number of interfaces.

* **Required**
  * `parse(log)`: Accepts a log line string, returns an object of parsed fields.
* Optional
  * `buildTemplateContext(template, log)`: Modify the context object sent to dust.js based on the type of template. Currently there are two types: `preview` and `event`. See the [extension example](http://codeactual.github.com/mainevent/#extension-example) to see them in action.
  * `buildPreviewText(log)`: Build the preview string manually (rather than using on a preview template).
  * `extractTime(log)`: The default implementation will detect millisecond/second timestamps and `Date.parse()`-able strings in `log.time` values. For incompatible formats, define this function to extract the millisecond timestamp manually.
* Utilities
  * `namedCapture(subject, regex)`: Wrapper around [XRegExp](https://github.com/slevithan/XRegExp) named capture expression handling.
  * `candidateCapture(subject, candidates)`: Wrapper around `namedCapture` that lets you define multiple potential patterns and the first match wins.

See <code>[app/parsers/prototype.js](https://github.com/codeactual/mainevent/blob/master/app/parsers/prototype.js)</code> for more interface details.

Extending the base class is a simple one-call process via a [backbone.js](http://documentcloud.github.com/backbone/)-like `extend()` function. See the [extension example](http://codeactual.github.com/mainevent/#extension-example) for a working implementation and screenshots of the output content. Or browse any of the modules under <code>[app/parsers/](https://github.com/codeactual/mainevent/tree/master/app/parsers/)</code>.

### Create a [Pub/Sub](http://redis.io/topics/pubsub) listener for log updates

1. Create a module that exports an `on(logs)` function that receives an array of one or more log objects.

2. Perform any non-native tasks you need.

3. Find this <code>[config/app.js](https://github.com/codeactual/mainevent/blob/master/config/app.js.dist)</code> section and add the location of your listener module to the `subscribers` list:

```javascript
{
  // ...
  mongodb: {
    // ...
    listeners: [
      {
        // Customize this event but do not remove.
        event: 'InsertLog',
        enabled: true,
        subscribers: [
          'app/modules/redis/InsertLogPubSub.js'
        ],
      }
    ],
    // ...
  },
  // ...
}
```


See <code>[app/modules/redis/InsertLogPubSub.js](https://github.com/codeactual/mainevent/blob/master/app/modules/redis/InsertLogPubSub.js)</code> for a working example.

## Configuration

`$ cp config/app.js.dist config/app.js`

Notes about the main properties:

* `sources`
  * `path`: Absolute path to the log file.
  * `parser`: Parser class/class-file name, e.g. `Json` or `NginxAccess`.
  * `tags`: (Optional) One or more tags to automatically attach to every event.
  * `timeAttr`: (Optional) By default, mainevent expects parsers to return a `time` property to represent the event's timestamp. Select a different property name here.
  * `previewAttr`: (Optional) Allows parsers like `Json`, which do not have preview templates, to know which properties should be included in preview text.
* `mongodb`
  * Customize the collection name in `collections.event`.
  * Select a different pagination maximum in `maxResultSize` if needed.
  * Add additional indexes if needed. Future versions may automate that process based on metrics.
* `redis`
  * `host`/`port`/`options`: Passed to `createClient()` in [node_redis](https://github.com/mranney/node_redis).

## Main Components

### Frontend

#### [mainevent_server.js](https://github.com/codeactual/mainevent/blob/master/bin/mainevent_server.js)

`$ bin/mainevent_server.js`

Has three responsibilities:

1. `/` serves the [backbone.js](http://documentcloud.github.com/backbone/) MVC app via [express.js](http://expressjs.com/).
1. `/api` serves JSON data including graph points, event objects and timeline pages via [express.js](http://expressjs.com/).
1. `/socket.io` serves real-time timelime updates.

Triggers <code>[public/build.js](https://github.com/codeactual/mainevent/blob/master/public/build.js)</code> on startup to build the `static/` directory.

#### [public/build.js](https://github.com/codeactual/mainevent/blob/master/public/build.js)

`$ public/build.js [--prod]`

* Combines and compresses (`--prod`) JS/CSS files located in <code>[public/](https://github.com/codeactual/mainevent/blob/master/public/)</code>.
* Relies on <code>[public/js/app.build.js](https://github.com/codeactual/mainevent/blob/master/public/js/app.build.js)</code> for [RequireJS](http://requirejs.org/) configuration.
* Triggers <code>[public/js/templates.build.js](https://github.com/codeactual/mainevent/blob/master/public/js/templates.build.js)</code> to compile [dust.js](http://akdubya.github.com/dustjs/) templates.

Outputs all files into `static/`.

#### [public/js/templates.build.js](https://github.com/codeactual/mainevent/blob/master/public/js/templates.build.js)

Compiles [dust.js](http://akdubya.github.com/dustjs/) templates in <code>[app/views/](https://github.com/codeactual/mainevent/blob/master/app/views/)</code> and <code>[app/parsers/*/templates/](https://github.com/codeactual/mainevent/blob/master/app/parsers/)</code>.

#### [public/js/app.build.js](https://github.com/codeactual/mainevent/blob/master/public/js/app.build.js)

[RequireJS](http://requirejs.org/) configuration for client-side dependencies.

### Background

#### [bin/tail.js](https://github.com/codeactual/mainevent/blob/master/bin/tail.js)

`$ bin/tail.js`
`$ bin/tail.js --help`

Spawns `tail` instances for each source described in <code>[config/app.js](https://github.com/codeactual/mainevent/blob/master/config/app.js.dist)</code>.

#### [bin/import.js](https://github.com/codeactual/mainevent/blob/master/bin/import.js)

`$ bin/import.js --parser json --path /var/log/myApp/prod.json --tags myApp,import`
`$ bin/import.js --help`

Like <code>[tail.js](https://github.com/codeactual/mainevent/blob/master/bin/tail.js)</code> except it processes the entire file. (The file does not need to be described in <code>[config/app.js](https://github.com/codeactual/mainevent/blob/master/config/app.js.dist)</code>.)

#### [app/graphs/CountAllPartitioned.js](https://github.com/codeactual/mainevent/blob/master/app/graphs/CountAllPartitioned.js)

**Required by the dashboard.**

`$ app/graphs/CountAllPartitioned.js --verbose --jobWait 2 --chunkWait 2 --limit 1000`
`$ app/graphs/CountAllPartitioned.js --help`

Generates the cached data used by the graph on `/dashboard` visualizing total events. Runs continually and sleeps for 1 minute if no new events are read.

### Testing

#### [bin/test_server.js](https://github.com/codeactual/mainevent/blob/master/bin/test_server.js)

`$ bin/test_server.js`

Serves the [YUI Test](http://yuilibrary.com/yui/docs/test/) runner page, <code>[app/views/test.html](https://github.com/codeactual/mainevent/blob/master/app/views/test.html)</code> and [test/browser/*.js](https://github.com/codeactual/mainevent/blob/master/test/browser/)</code> test cases.

## File Layout Notes

* <code>[app/](https://github.com/codeactual/mainevent/blob/master/app/)</code> : Holds most server-side modules and classes.
  * <code>[controllers/](https://github.com/codeactual/mainevent/blob/master/app/controllers/)</code>: Handlers for [express.js](http://expressjs.com/) routes defined in <code>[bin/mainevent_server.js](https://github.com/codeactual/mainevent/blob/master/bin/mainevent_server.js)</code>.
  * <code>[graphs/](https://github.com/codeactual/mainevent/blob/master/app/graphs/)</code>: Background scripts which run at intervals to cache point data in Redis.
  * <code>[jobs/](https://github.com/codeactual/mainevent/blob/master/app/jobs/)</code>: Classes used by `graphs` scripts which define the [MapReduce](http://www.mongodb.org/display/DOCS/MapReduce) logic.
  * <code>[modules/](https://github.com/codeactual/mainevent/blob/master/app/modules/)</code>: Covers [MongoDB](http://www.mongodb.org/), [Redis](http://redis.io/), static builds and global objects like `mainevent`.
  * <code>[parsers/](https://github.com/codeactual/mainevent/blob/master/app/parsers/)</code>: Self-contained parser modules, their prototype, and a test utility module.
  * <code>[sockets/](https://github.com/codeactual/mainevent/blob/master/app/sockets/)</code>: Like `controllers` except for socket messages rather than routes.
  * <code>[views/](https://github.com/codeactual/mainevent/blob/master/app/views/)</code>: All non-parser [dust.js](http://akdubya.github.com/dustjs/) templates.
* <code>[bin/](https://github.com/codeactual/mainevent/blob/master/bin/)</code>: All HTTP servers and background processes like <code>[tail.js](https://github.com/codeactual/mainevent/blob/master/bin/tail.js)</code>.
* <code>[public/](https://github.com/codeactual/mainevent/blob/master/public/)</code>
  * <code>[js/](https://github.com/codeactual/mainevent/blob/master/public/js/)</code>
    * <code>[backbone/](https://github.com/codeactual/mainevent/blob/master/public/js/backbone/)</code>: Additions to [backbone.js](http://documentcloud.github.com/backbone/) prototypes like `Backbone.View.prototype`.
    * <code>[collections/](https://github.com/codeactual/mainevent/blob/master/public/js/collections/)</code>: [backbone.js](http://documentcloud.github.com/backbone/#Collection) collections.
    * <code>[controllers/](https://github.com/codeactual/mainevent/blob/master/public/js/controllers/)</code>: Handlers for [backbone.js](http://documentcloud.github.com/backbone/) routes.
    * <code>[helpers/](https://github.com/codeactual/mainevent/blob/master/public/js/helpers/)</code>: Ex. `mainevent.helpers.Socket` for creating new [socket.io](http://socket.io/) connections.
    * <code>[models/](https://github.com/codeactual/mainevent/blob/master/public/js/models/)</code>: [backbone.js](http://documentcloud.github.com/backbone/#Model) models.
    * <code>[observers/](https://github.com/codeactual/mainevent/blob/master/public/js/observers/)</code>: Global listeners of custom events like `ContentPreRender`.
    * <code>[shared/](https://github.com/codeactual/mainevent/blob/master/public/js/shared/)</code>: Modules/classes available server-side and client-side, ex. `mainevent.shared.Date`.
    * <code>[views/](https://github.com/codeactual/mainevent/blob/master/public/js/views/)</code>: [backbone.js](http://documentcloud.github.com/backbone/#View) views.
* <code>static/</code>: JS/CSS/images from <code>[public/](https://github.com/codeactual/mainevent/blob/master/public/)</code> processed by <code>[public/build.js](https://github.com/codeactual/mainevent/blob/master/public/build.js)</code>.
* <code>[test/]((https://github.com/codeactual/mainevent/blob/master/test/)</code>
  * <code>[browser/]((https://github.com/codeactual/mainevent/blob/master/test/browsers/)</code>: Client-side tests processed by <code>[app/views/test.html](https://github.com/codeactual/mainevent/blob/master/app/views/test.html)</code>.
  * <code>[modules/]((https://github.com/codeactual/mainevent/blob/master/test/modules/)</code>: Test helpers.

## Testing

Server-side tests rely on [nodeunit](https://github.com/caolan/nodeunit). Example:

`$ nodeunit test/redis.js`

Run all tests found under <code>[app/parsers/](https://github.com/codeactual/mainevent/blob/master/app/parsers/)</code> and <code>[test/](https://github.com/codeactual/mainevent/blob/master/test/)</code>.

`$ test/all.js`

Client-side tests under <code>[test/browser/](https://github.com/codeactual/mainevent/blob/master/test/browser/)</code> rely on [YUI Test](http://yuilibrary.com/yui/docs/test/). <code>[bin/test_server.js](https://github.com/codeactual/mainevent/blob/master/bin/test_server.js)</code> will serve the runner page.

### Remote Logs

`$ cp test/fixtures/tail-config.js test/fixtures/tail-config-remote.js`

Update `ssh*` configuration values in `test/fixtures/tail-config-remote.js`.

## Events

### Server-side

* `InsertLog`
  * Triggered in <code>[app/modules/mongodb.js](https://github.com/codeactual/mainevent/blob/master/app/modules/mongodb.js)</code> in `insertLog()`.
  * Callbacks receive the array of document objects.
  * [Example listener](https://github.com/codeactual/mainevent/blob/master/app/modules/redis/InsertLogPubSub.js).

### Client-side

* LinkClick
  * Triggered in <code>[public/js/helpers/Event.js](https://github.com/codeactual/mainevent/blob/master/public/js/helpers/Event.js)</code> on any link with a relative `href`.
* CritFetchError
  * Triggered when a view cannot fetch data critical to its presentation, ex. the event view cannot retrieve the object describing the event.
  * Callbacks receive the `response` object from <code>[$.ajax](http://api.jquery.com/jQuery.ajax/)</code>.
* ContentPreRender
  * Triggered in <code>[public/js/index.js](https://github.com/codeactual/mainevent/blob/master/public/js/index.js)</code> before the <code>[content.html](https://github.com/codeactual/mainevent/blob/master/app/views/content.html)</code> template is rendered.

### Bundled dependencies and their licenses

* [backbone.js](http://documentcloud.github.com/backbone/) (MIT)
* [clientsiiide](https://github.com/codeactual/clientsiiide) (MIT)
* [dust.js](http://akdubya.github.com/dustjs/) (MIT)
* [Glyphicons Free](http://glyphicons.com/) (CC BY 3.0)
* [jqPlot](http://www.jqplot.com/) (MIT/GPLv2)
* [jQuery](http://jquery.com/) (MIT/GPLv2)
* [jQuery UI](http://jqueryui.com/) (MIT/GPLv2)
* [jQuery-Timepicker-Addon](https://github.com/trentrichardson/jQuery-Timepicker-Addon) (MIT/GPLv2)
* [moment.js](http://momentjs.com/) (MIT)
* [RequireJS](http://requirejs.org/) (MIT/New BSD)
* [socket.io](http://socket.io/) (MIT)
* [Twitter Bootstrap](http://twitter.github.com/bootstrap/index.html) (Apachev2)
* [underscore.js](http://documentcloud.github.com/underscore/) (MIT)
* [XRegExp](https://github.com/slevithan/XRegExp) (MIT)
* [YUI Test](http://yuilibrary.com/yui/docs/test/) (BSD)

### Copyright and license (MIT)

Copyright (c) 2012 David Smith, codeactual@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
