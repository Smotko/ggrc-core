/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tag = 'collapsible-panel';
  var tpl = can.view(GGRC.mustache_path +
    '/components/collapsible-panel/collapsible-panel.mustache');
  /**
   * Collapsible Panel component to add collapsing behavior
   */
  GGRC.Components('collapsiblePanel', {
    tag: tag,
    template: tpl,
    scope: {
      titleText: '@',
      titleIcon: '@',
      expanded: true,
      collapsed: '@'
    },
    init: function () {
      this.scope.attr('expanded', !(this.scope.attr('collapsed')));
    }
  });
})(window.can, window.GGRC);
