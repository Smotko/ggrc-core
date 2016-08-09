/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tpl = can.view(GGRC.mustache_path +
    '/components/assessment/mapped-objects/mapped-objects-list.mustache');
  var tag = 'assessment-mapped-objects-list';
  var baseCls = '.assessment-mapped-objects';
  var popoverCls = baseCls + '__popover';
  /**
   * Assessment specific mapped objects view component
   */
  GGRC.Components('assessmentMappedObjectsList', {
    tag: tag,
    template: tpl,
    scope: {
      content: '<content></content>',
      selectedItem: null,
      selectedEl: null,
      itemTpl: null,
      items: [],
      addSelection: function (ctx, el) {
        this.removeSelection();
        this.attr('selectedEl', el);
        this.attr('selectedItem', ctx.instance);
        ctx.instance.attr('isSelected', true);
      },
      removeSelection: function () {
        this.attr('selectedItem', null);
        this.attr('selectedEl', null);
        this.items.forEach(function (obj) {
          obj.instance.attr('isSelected', false);
        });
      }
    },
    init: function () {
      this.scope.attr('isOneItemTpl', this.scope.attr('itemTpl') === 'one');
    },
    events: {
      '{window} click': function (el, ev) {
        var popover = this.element.find(popoverCls);

        var isClickInsidePopover = popover.has(ev.target).length ||
          popover.is(ev.target);

        var isClickedInsideContent = this.element.has(ev.target).length ||
          this.element.is(ev.target);

        if (!isClickedInsideContent && !isClickInsidePopover) {
          this.scope.removeSelection();
        }
      }
    }
  });
})(window.can, window.GGRC);
