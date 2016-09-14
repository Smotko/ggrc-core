/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tag = 'object-list-item';
  var tpl = can.view(GGRC.mustache_path +
    '/components/object-list/object-list-item.mustache');

  /**
   * Object List Item component
   */
  GGRC.Components('objectsListItem', {
    tag: tag,
    template: tpl,
    scope: {
      index: '@',
      itemData: null,
      selectedItem: null,
      isSelected: function () {
        return this.attr('selectedItem.index') === this.attr('index');
      }
    }
  });
})(window.can, window.GGRC);
