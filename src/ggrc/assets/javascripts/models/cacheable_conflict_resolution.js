/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

export default function resolveConflict(xhr, obj) {
  var attrs = obj.attr();
  var baseAttrs = obj._backupStore() || {};
  return obj.refresh().then(function (obj) {
    var conflict = false;
    var remoteAttrs = obj.attr();

    if (can.Object.same(remoteAttrs, attrs)) {
      // current state is same as server state -- do nothing.
      return obj;
    } else if (can.Object.same(remoteAttrs, baseAttrs)) {
      // base state matches server state -- no incorrect expectations -- save.
      return obj.attr(attrs).save();
    }
    // check what properties changed -- we can merge if the same prop wasn't changed on both
    can.each(baseAttrs, function (val, key) {
      if (!can.Object.same(attrs[key], remoteAttrs[key])) {
        if (can.Object.same(val, remoteAttrs[key])) {
          obj.attr(key, attrs[key]);
        } else if (!can.Object.same(val, attrs[key])) {
          conflict = true;
        }
      }
    });
    if (conflict) {
      $(document.body).trigger('ajax:flash', {
        warning: 'There was a conflict while saving. ' +
          'Your changes have not yet been saved. ' +
          'please check any fields you were editing ' +
          'and try saving again'
      });
      return new $.Deferred().reject(xhr, 409, 'CONFLICT');
    }
    return obj.save();
  });
}
