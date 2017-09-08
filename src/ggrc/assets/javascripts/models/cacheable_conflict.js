/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function () {
  can.Model.CacheableConflict = {
    initStatic: function () {
      this.bind('updated', function (ev, instance) {
        instance._changes = {};
      });
      this.bind('created', function (ev, instance) {
        instance._changes = {};
      });
    },
    initProto: function () {
      this._changes = {};
      this.bind('change', function (ev, attrName, how, newVal, oldVal) {
        if (!(attrName in this._changes)) {
          this._changes[attrName] = {
            is: newVal,
            was: oldVal
          };
          return;
        }
        if (this._changes[attrName].was === newVal) {
          // If newVal is the same as where the original var, no changes were made
          delete this._changes[attrName];
          return;
        }
        // Original value was already set, just updated the latest:
        this._changes[attrName].is = newVal;
      }.bind(this));
    },
  };
})();
