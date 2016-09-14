/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tpl = can.view(GGRC.mustache_path +
    '/components/mapped-objects/mapped-objects.mustache');
  var tag = 'mapped-objects';
  /**
   * Assessment specific mapped objects view component
   */
  GGRC.Components('mappedObjects', {
    tag: tag,
    template: tpl,
    scope: {
      mapping: '@',
      parentInstance: null,
      mappedItems: [],
      setMappedObjects: function (items) {
        this.attr('mappedItems').replace(items);
      },
      load: function () {
        this.attr('parentInstance')
          .get_binding(this.attr('mapping'))
          .refresh_instances()
          .then(this.setMappedObjects.bind(this));
      }
    },
    init: function () {
      this.scope.load();
    }
  });
})(window.can, window.GGRC);
