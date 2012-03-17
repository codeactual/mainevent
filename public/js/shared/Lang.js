'use strict';

(function() {
  var root = "undefined" == typeof window ? GLOBAL : window;
  root.diana = root.diana || {};
  root.diana.shared = root.diana.shared || {};

  var diana = root.diana;

  diana.shared.Lang = {
    /**
     * Prototypal inheritance by Douglas Crockford.
     *
     * @param o {Object}
     */
    object: function(o) {
      function F() {};
      F.prototype = o;
      return new F();
    },

    /**
     * Parasitic combination inheritance by Nicholas Zakas.
     *
     * @param subType {Object}
     * @param superType {Object}
     */
    inheritPrototype: function(subType, superType) {
      var prototype = diana.shared.Lang.object(superType.prototype);
      prototype.constructor = subType;
      subType.prototype = prototype;
    }
  };
})();
