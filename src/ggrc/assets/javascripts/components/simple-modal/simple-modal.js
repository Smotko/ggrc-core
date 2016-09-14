/*!
 Copyright (C) 2016 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tpl = can.view(GGRC.mustache_path +
    '/components/simple-modal/simple-modal.mustache');
  var baseCls = 'simple-modal';

  function recalculatePosition(el) {
    var pos = el[0].getBoundingClientRect();
    var top = Math
      .floor(window.document.body.scrollHeight / 2 - pos.height / 2);
    var left = Math
      .floor(window.document.body.scrollWidth / 2 - pos.width / 2);

    return {top: top, left: left};
  }

  can.Component.extend({
    tag: 'simple-modal',
    template: tpl,
    scope: {
      extraCssCls: '@',
      instance: null,
      modalEl: null,
      state: {
        open: false
      },
      modalCls: function () {
        return this.attr('state.open') ? baseCls + '-open' : '';
      },
      modalOverlayCls: function () {
        return this.attr('state.open') ? baseCls + '__overlay-open' : '';
      },
      hide: function hide() {
        this.attr('state.open', false);
      },
      show: function () {
        this.attr('state.open', true);
      },
      toggle: function (isOpen) {
        this.setPosition(isOpen);
      },
      setPosition: function (isOpen) {
        var modal = this.attr('modalEl');
        if (isOpen && modal) {
          modal.offset(recalculatePosition(modal));
        }
      }
    },
    events: {
      inserted: function (el) {
        var modal = el.find('.' + baseCls);
        modal.appendTo('body');
        this.scope.attr('modalEl', modal);
        el.find('.' + baseCls + '__overlay').appendTo('body');
      },
      '{scope.state} open': function (scope, ev, val) {
        this.scope.toggle(val);
      },
      '{window} resize': function () {
        var isOpen = this.scope.attr('state.open');
        this.scope.setPosition(isOpen);
      }
    }
  });
})(window.can, window.GGRC);
