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
  var saved = diana.helpers.Prefs.get(ns);
  this.prefs = _.extend(defaults, saved);
  this.prefsNs = ns;
  console.log('initPrefs', ns, this.prefs);
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
  console.log('getPref', key, this.prefs[key]);
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
  diana.helpers.Prefs.set(this.prefsNs, this.prefs);
  console.log('setPref', key, value);
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
