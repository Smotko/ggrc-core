/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tpl = can.view(GGRC.mustache_path +
    '/components/object-popover/object-popover.mustache');
  var tag = 'object-popover';
  /**
   * Assessment specific mapped objects popover view component
   */
  GGRC.Components('objectPopover', {
    tag: tag,
    template: tpl,
    scope: {
      openStyle: '',
      item: null,
      itemData: null,
      setPopoverStyle: function (el) {
        var pos = el[0].getBoundingClientRect();
        var top = Math.floor(el.position().top);
        var left = Math.floor(pos.width / 2);
        var width = Math
          .floor(window.innerWidth - (pos.right - pos.width / 2));
        var topStyle = 'top: ' + top + 'px;';
        var leftStyle = 'left: ' + left + 'px;';
        var widthStyle = 'width: ' + width + 'px;';
        var opacityStyle = 'opacity: 1;';
        return topStyle + leftStyle + ' max-height: 450px;' +
          widthStyle + opacityStyle +
          'transition: opacity 0.2s ease,' +
          ' width 0.4s ease, max-height 0.3s ease;';
      },
      setStyle: function (el) {
        var style = el ? this.setPopoverStyle(el) : '';
        this.attr('openStyle', style);
      }
    },
    events: {
      '{scope.item} change': function (item) {
        this.scope.setStyle(item.el);
        this.scope.attr('itemData', item.data);
      },
      '.object-popover-body click': function (el, event) {
        event.stopPropagation();
      }
    }
  });
})(window.can, window.GGRC);
