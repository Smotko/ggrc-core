/*!
 Copyright (C) 2016 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tpl = can.view(GGRC.mustache_path +
      '/components/reusable-objects/reusable-objects-item.mustache');

  can.Component.extend({
    tag: 'reusable-objects-item',
    template: tpl,
    scope: {
      selectedList: new can.List(),
      disabled: false,
      isDisabled: function () {
        return this.attr('disabled');
      },
      setDisabled: function () {
        this.attr('disabled', GGRC.Utils.is_mapped(
          this.attr('baseInstance'),
          this.attr('instance'),
          this.attr('mapping')));
      },
      toggleSelection: function (val) {
        var list = this.attr('selectedList');
        var index;
        if (val) {
          list.push(this.attr('instance'));
        } else {
          index = list.indexOf(this.attr('instance'));
          list.splice(index, 1);
        }
      }
    },
    init: function () {
      this.scope.setDisabled();
    },
    events: {
      'input[type="checkbox"] change': function (el) {
        this.scope.toggleSelection(el.is(':checked'));
      },
      '{scope.baseInstance.object_documents} length': function () {
        this.scope.setDisabled();
      },
      '{scope.baseInstance.related_destinations} length': function () {
        this.scope.setDisabled();
      }
    }
  });
})(window.can, window.GGRC);
