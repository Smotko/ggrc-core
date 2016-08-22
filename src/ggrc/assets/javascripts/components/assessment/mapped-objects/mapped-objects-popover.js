/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tpl = can.view(GGRC.mustache_path +
    '/components/assessment/mapped-objects/mapped-objects-popover.mustache');
  var tag = 'assessment-mapped-objects-popover';
  /**
   * Assessment specific mapped objects popover view component
   */
  GGRC.Components('assessmentMappedObjectsPopover', {
    tag: tag,
    template: tpl,
    scope: {
      openStyle: '',
      selectedEl: null,
      setPopoverStyle: function (el) {
        var pos = el[0].getBoundingClientRect();
        var top = Math.floor(el.position().top);
        var left = Math.floor(pos.width / 2);
        var width = Math
          .floor(window.innerWidth - (pos.right - pos.width / 2) - 54);
        var topStyle = 'top: ' + top + 'px;';
        var leftStyle = 'left: ' + left + 'px;';
        var widthStyle = 'width: ' + width + 'px;';
        var opacityStyle = 'opacity: 1;';
        return topStyle + leftStyle + ' max-height: 450px;' +
          widthStyle + opacityStyle +
          'transition: opacity 0.2s ease,' +
          ' width 0.4s ease, max-height 0.3s ease;';
      }
    },
    events: {
      '{scope} selectedEl': function (scope, ev, val) {
        var style = val ? scope.setPopoverStyle(val) : '';
        scope.attr('openStyle', style);
      }
    }
  });
})(window.can, window.GGRC);
