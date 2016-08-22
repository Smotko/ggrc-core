/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tag = 'collapsible-panel-header';
  var tpl = can.view(GGRC.mustache_path +
    '/components/collapsible-panel/collapsible-panel-header.mustache');
  /**
   * Collapsible Panel component to add collapsing behavior
   */
  GGRC.Components('collapsiblePanelHeader', {
    tag: tag,
    template: tpl,
    scope: {
      titleIcon: null,
      expanded: null,
    },
    events: {
      ' click': function (el, ev) {
        if ($(ev.target).data('toggle')) {
          return;
        }
        this.scope.attr('expanded', !this.scope.attr('expanded'));
      }
    }
  });
})(window.can, window.GGRC);
