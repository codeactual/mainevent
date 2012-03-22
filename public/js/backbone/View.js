Backbone.View.prototype.prefs = {};
Backbone.View.prototype.prefsNs = '';

/**
 * Seed a view's preference map.
 *
 * - Pulls saved preferences from localStorage to override defaults.
 *
 * @param ns {String} Namespace, ex. view name.
 * @param defaults {Object} Default map.
 */
Backbone.View.prototype.initPrefs = function(ns, defaults) {
  var saved = diana.helpers.Prefs.get(ns + 'View');
  this.prefs = _.extend(defaults, saved);
  this.prefsNs = ns;
};

/**
 * Read a preference key.
 *
 * @param key {String}
 * @return {mixed} Preference value; null if key unknown.
 * @throws Error On missing namespace (to avoid cross-view conflicts.)
 */
Backbone.View.prototype.getPref = function(key) {
  if (!this.prefsNs) { throw new Error('Preferences namespace missing.'); }
  return _.has(this.prefs, key) ? this.prefs[key] : null;
};

/**
 * Write a preference key.
 *
 * - Save preferences to localStorage.
 *
 * @param key {String}
 * @param value {mixed}
 * @return {mixed} Saved value.
 * @throws Error On missing namespace (to avoid cross-view conflicts.)
 */
Backbone.View.prototype.setPref = function(key, value) {
  if (!this.prefsNs) { throw new Error('Preferences namespace missing.'); }
  this.prefs[key] = value;
  diana.helpers.Prefs.set(this.prefsNs + 'View', this.prefs);
  return value;
};

/**
 * Add default shutdown/GC to all views.
 *
 * @author Derick Bailey http://goo.gl/JD3DQ
 */
Backbone.View.prototype.close = function() {
  this.remove();
  this.unbind();
  if (this.onClose){
    this.onClose();
  }
};

/**
 * Key codes mapped to event handler.
 *
 * Example:
 * {
 *   16: function(event) { ... },
 *   83: function(event) { ... },
 *   ...
 * }
 */
Backbone.View.prototype.keyEventConfig = {};

/**
 * 'keyup' handler customized by each view's keyEventConfig map.
 */
Backbone.View.prototype.onKeyEvent = function() {};

/**
 * Optionally call from initialize() to configure and start key event handling.
 *
 * @param config {Object} View's new keyEventConfig value.
 */
Backbone.View.prototype.initKeyEvents = function(config) {
  var view = this;
  this.keyEventConfig = _.clone(config);
  this.onKeyEvent = function(event) {
    if (_.has(view.keyEventConfig, event.which)) {
      view.keyEventConfig[event.which].call(view, event);
    }
  };
  this.enableKeyEvents();
};

Backbone.View.prototype.enableKeyEvents = function() {
  $(document).on('keyup', this.onKeyEvent);
};

Backbone.View.prototype.disableKeyEvents = function() {
  $(document).off('keyup', this.onKeyEvent);
};

/**
 * Build a fragment URL.
 *
 * @param fragment {String} Ex. 'timeline', w/out trailing slash.
 * @param args {Object}
 * @return {String}
 */
Backbone.View.prototype.buildUrl = function (fragment, args) {
  var pairs = [];
  _.each(args, function(value, key) {
    pairs.push(key + '=' + value);
  });
  pairs = pairs.join('&');
  return '#' + fragment + (pairs ? '/' + pairs : '');
};

/**
 * Build and navigate to a fragment URL.
 *
 * @param fragment {String} Ex. 'timeline', w/out trailing slash.
 * @param args {Object}
 * @param options {Object} Backbone.History.navigate() options.
 */
Backbone.View.prototype.navigate = function (fragment, args, options) {
  options = options || {};
  options.trigger = _.has(options, 'trigger') ? options.trigger : true;
  Backbone.history.navigate(this.buildUrl(fragment, args), options);
};
