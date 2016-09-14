/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tag = 'object-list';
  var tpl = can.view(GGRC.mustache_path +
    '/components/object-list/object-list.mustache');
  /**
   * Object List component
   */
  GGRC.Components('objectList', {
    tag: tag,
    template: tpl,
    scope: {
      selectedItem: null,
      items: [],
      select: function (ctx, el) {
        this.attr('selectedItem', {
          el: el,
          data: ctx.instance
        });
        this.attr('selectedItem.index', el.attr('index'));
      },
      clearSelection: function () {
        this.attr('selectedItem', {
          el: null,
          data: null
        });
        this.attr('selectedItem.index', null);
      },
      onClickHandler: function (el, ev) {
        var isInnerClick = GGRC.Utils.events.isInnerClick(el, ev.target);
        if (!isInnerClick) {
          this.clearSelection();
        }
        ev.stopPropagation();
      }
    },
    events: {
      '{window} click': function (el, ev) {
        this.scope.onClickHandler(this.element, ev);
      }
    }
  });
})(window.can, window.GGRC);
