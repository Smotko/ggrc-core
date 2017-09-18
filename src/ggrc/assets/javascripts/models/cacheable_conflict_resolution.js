/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

function checkValues(baseAttrs, attrs, remoteAttrs, obj) {
  var conflict = false;
  can.each(baseAttrs, function (val, key) {
    if (key === 'updated_at' || key === 'audit') {
      return;
    }

    if (key === 'custom_attribute_values') {
      conflict = conflict || checkValues(
        baseAttrs[key], attrs[key], remoteAttrs[key], obj[key]);
      return;
    }
        // The object attribute was changed on the server
    if (!can.Object.same(val, remoteAttrs[key]) &&
        // The object attribute was also changed on the client
        !can.Object.same(val, attrs[key]) &&
        // The change on the server was not the same as the change on the client
        !can.Object.same(attrs[key], remoteAttrs[key])) {
      conflict = true;
      // Restore the version that user wrote changes
      obj.attr(key, attrs[key]);
      console.warn("Conflict", key, "User wrote:", attrs[key],
        "Server has:", remoteAttrs[key], "User saw", baseAttrs[key]);
               // The attribute hasn't changed on the server
    } else if (can.Object.same(val, remoteAttrs[key]) &&
              // The attribute was changed on the client
               !can.Object.same(val, attrs[key])) {
      obj.attr(key, attrs[key])
    }
  });
  return conflict;
}

export default function resolveConflict(xhr, obj) {
  var attrs = can.extend(true, {}, obj.attr());
  var baseAttrs = can.extend(true, {}, obj._backupStore()) || {};
  return obj.refresh().then(function (obj) {
    var conflict = false;
    var remoteAttrs = can.extend(true, {}, obj.attr());
    // obj.backup();

    if (can.Object.same(remoteAttrs, attrs)) {
      // current state is same as server state -- do nothing.
      return obj;
    } else if (can.Object.same(remoteAttrs, baseAttrs)) {
      // base state matches server state -- no incorrect expectations -- save.
      return obj.attr(attrs).save();
    }
    // check what properties changed -- we can merge if the same prop wasn't changed on both
    conflict = checkValues(baseAttrs, attrs, remoteAttrs, obj);
    if (conflict) {
      $(document.body).trigger('ajax:flash', {
        warning: GGRC.Errors.messages[409]
      });
      return new $.Deferred().reject(xhr, 409, 'CONFLICT');
    }
    return obj.save();
  });
}
