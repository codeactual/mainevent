define(['views/KeyboardShortcuts'], function(KeyboardShortcuts) {

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
   * - Called by index.js router when a new 'main' view is about to load.
   *
   * @author Derick Bailey http://goo.gl/JD3DQ
   */
  Backbone.View.prototype.close = function() {
    this.remove();
    this.unbind();
    if (this.onKeyEvent) {
      this.disableKeyEvents();
      this.disableKeyboardShortcuts();
      this.disableModalEvents();
    }
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
   * 'keypress' handler customized by each view's keyEventConfig map.
   */
  Backbone.View.prototype.onKeyEvent = null;

  /**
   * Click handler for 'Keyboard shortcuts available' link, customized by each
   * view's keyEventConfig map.
   */
  Backbone.View.prototype.onKeyboardShortcutsClick = null;

  /**
   * Optionally call from initialize() to configure and start key event handling.
   *
   * @param config {Object} View's new keyEventConfig value.
   * Example:
   * {
   *   'Search Messages': {
   *     keyChar: 's',
   *     callback: searchMessages
   *   },
   *   'Open Message': {
   *     keyChar: 'o',
   *     shiftKey: true,
   *     callback: openMessage
   *   },
   *   ...
   * }
   * - Other accepted handler properties:
   *   keyCode {Number}
   *   ctrlKey {Boolean}
   */
  Backbone.View.prototype.initKeyEvents = function(config) {
    var view = this;
    this.keyEventConfig = {};

    // Suspend key event handling when sub-view modals are open.
    this.enableModalEvents();

    // Display keyboard shortcuts modal with help content based on keyEventConfig.
    this.onKeyboardShortcutsClick = function() {
      new KeyboardShortcuts({keyEventConfig: view.keyEventConfig});
    };
    this.enableKeyboardShortcuts();

    // Override '?'
    config['Display this menu'] = {
      keyCode: 63,
      shiftKey: true,
      callback: this.onKeyboardShortcutsClick
    };

    // Group handlers by key code.
    _.each(config, function(handler, description) {
      var keyCode = handler.keyCode;

      if (!keyCode) {
        if (handler.shiftKey && handler.keyChar.match(/[a-z]/)) {
          keyCode = handler.keyChar.toUpperCase().charCodeAt(0);
        } else {
          keyCode = handler.keyChar.charCodeAt(0);
        }
      }

      // Initialize group.
      if (!_.has(view.keyEventConfig, keyCode)) {
        view.keyEventConfig[keyCode] = [];
      }

      delete handler.keyCode;
      handler.keyChar = handler.keyChar || String.fromCharCode(keyCode);
      handler.description = description;
      handler.shiftKey = _.isUndefined(handler.shiftKey) ? false : handler.shiftKey;
      handler.ctrlKey = _.isUndefined(handler.ctrlKey) ? false : handler.ctrlKey;

      view.keyEventConfig[keyCode].push(handler);
    });

    // Trigger all handlers in the matching key code group.
    this.onKeyEvent = function(event) {
      if (!view.keyEventConfig[event.which]) {
        return;
      }
      _.each(view.keyEventConfig[event.which], function(handler) {
        if (handler.shiftKey != event.shiftKey) { return; }
        if (handler.ctrlKey != event.ctrlKey) { return; }
        handler.callback.call(view, event);
      });
    };

    this.enableKeyEvents();
  };

  Backbone.View.prototype.enableModalEvents = function() {
    diana.helpers.Event.on('ModalOpen', this.onModalOpen, this);
    diana.helpers.Event.on('ModalClose', this.onModalClose, this);
  };

  Backbone.View.prototype.disableModalEvents = function() {
    diana.helpers.Event.off('ModalOpen', this.onModalOpen);
    diana.helpers.Event.off('ModalClose', this.onModalClose);
  };

  Backbone.View.prototype.enableKeyboardShortcuts = function() {
    if (this.onKeyboardShortcutsClick) {
      diana.helpers.Event.on('KeyboardShortcutsHelp', this.onKeyboardShortcutsClick);
    }
  };

  Backbone.View.prototype.disableKeyboardShortcuts = function() {
    if (this.onKeyboardShortcutsClick) {
      diana.helpers.Event.off('KeyboardShortcutsHelp', this.onKeyboardShortcutsClick);
    }
  };

  Backbone.View.prototype.onModalOpen = function() {
    this.disableKeyEvents();
    this.disableKeyboardShortcuts();
  };

  Backbone.View.prototype.onModalClose = function() {
    this.enableKeyEvents();
    this.enableKeyboardShortcuts();
  };

  Backbone.View.prototype.enableKeyEvents = function() {
    if (this.onKeyEvent) {
      $(document).on('keypress', this.onKeyEvent);
    }
  };

  Backbone.View.prototype.disableKeyEvents = function() {
    if (this.onKeyEvent) {
      $(document).off('keypress', this.onKeyEvent);
    }
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
      if (!key.toString().length || !value.toString().length || _.isNaN(value)) {
        return;
      }
      pairs.push(key + '=' + encodeURIComponent(value));
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
});
