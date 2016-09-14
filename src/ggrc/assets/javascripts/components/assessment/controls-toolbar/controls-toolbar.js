/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';
  var tpl = can.view(GGRC.mustache_path +
    '/components/assessment/controls-toolbar/controls-toolbar.mustache');

  can.Component.extend({
    tag: 'assessment-controls-toolbar',
    template: tpl,
    scope: {
      instance: null,
      modal: {
        open: false
      },
      showRelatedResponses: function (ctx, ev, el) {
        this.attr('modal.open', true);
      }
    }
  });
})(window.can, window.GGRC, window.CMS);
