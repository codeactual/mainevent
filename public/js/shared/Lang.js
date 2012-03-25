'use strict';

define([], function() {

  var Lang = function() {};

  /**
   * Prototypal inheritance by Douglas Crockford.
   *
   * @param o {Object}
   */
  Lang.prototype.object = function(o) {
    function F() {};
    F.prototype = o;
    return new F();
  };

  /**
   * Parasitic combination inheritance by Nicholas Zakas.
   *
   * @param subType {Object}
   * @param superType {Object}
   */
  Lang.prototype.inheritPrototype = function(subType, superType) {
    var prototype = this.object(superType.prototype);
    prototype.constructor = subType;
    subType.prototype = prototype;
  };

  return new Lang();
});
