/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tpl = can.view(GGRC.mustache_path +
    '/components/assessment/mapped-objects/mapped-objects.mustache');
  var tag = 'assessment-mapped-objects';
  /**
   * Assessment specific mapped objects view component
   */
  GGRC.Components('assessmentMappedObjects', {
    tag: tag,
    template: tpl,
    scope: {
      content: '<content></content>',
      titleText: '@',
      filter: '@',
      mapping: null,
      mappingType: '@',
      expanded: true,
      parentInstance: null,
      mappedObjects: [],
      itemTpl: '@',
      setMappedObjects: function (items) {
        this.attr('mappedObjects', items);
      },
      load: function () {
        this.parentInstance
          .get_binding(this.mapping)
          .refresh_instances()
          .then(this.setMappedObjects.bind(this));
      }
    },
    init: function (el) {
      var scope = this.scope;
      el = can.$(el);

      if (!scope.attr('mapping')) {
        scope.attr('mapping', el.attr('mapping'));
      }

      this.scope.load();
    },
    '{scope.parentInstance} change': function () {
      this.scope.load();
    }
  });
})(window.can, window.GGRC);
