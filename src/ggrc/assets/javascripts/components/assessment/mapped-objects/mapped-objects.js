/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tpl = can.view(GGRC.mustache_path +
    '/components/assessment/mapped-objects/mapped-objects.mustache');
  var tag = 'assessment-mapped-objects';
  var itemTplsBasePath = GGRC.mustache_path +
    '/components/assessment/mapped-objects/item-templates/';
  /**
   * Assessment specific mapped objects view component
   */
  GGRC.Components('assessmentMappedObjects', {
    tag: tag,
    template: tpl,
    scope: {
      titleText: '@',
      filter: '@',
      mapping: '@',
      mappingType: '@',
      expanded: true,
      selectedItem: null,
      parentInstance: null,
      mappedItems: [],
      itemsTpl: '@',
      getComputedItemsTpl: function (tpl) {
        return itemTplsBasePath + tpl + '.mustache';
      },
      filterFn: function (item) {
        var isControlOnly = this.filter === 'control';
        var isControlType = item.instance.type === 'Control';
        if (isControlOnly) {
          return isControlType;
        }
        return !isControlType;
      },
      filterItems: function (objects) {
        objects = objects.serialize();
        return objects
          .map(function (obj) {
            if (this.filterFn(obj)) {
              return obj;
            }
          }.bind(this))
          .filter(function (item) {
            return Boolean(item);
          });
      },
      setMappedObjects: function (items) {
        items = this.filterItems(items);
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
    },
    helpers: {
      renderItemsTpl: function (options) {
        var tpl = this.attr('itemsTpl');
        tpl = this.getComputedItemsTpl(tpl);
        return can.view.render(tpl, options.scope);
      }
    }
  });
})(window.can, window.GGRC);
