/*!
    Copyright (C) 2016 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can, $, Clipboard) {
  'use strict';

  can.Component.extend({
    tag: 'clipboard-link',
    scope: {
      text: '@',
      title: '@',
      notify: '@',
      isActive: false,
      timeout: '@',
      notifyText: 'Link has been copied to your clipboard.'
    },
    template: ['<a data-clipboard-text="{{text}}" {{#isActive}}class="active"{{/isActive}} href="#">',
               '<i class="fa fa-link"></i> {{title}}',
               '</a>'].join(''),
    events: {
      'a click': function (el, evnt) {
        evnt.preventDefault();
      },
      'inserted': function (el, evnt) {
        var timeout = this.scope.attr('timeout') || 10000;
        this._clip = new Clipboard(el.find('a')[0]);

        this._clip.on('success', function () {
          if (this.scope.attr('notify')) {
            $('body').trigger('ajax:flash', {'success': this.scope.attr('notifyText')});
          }
          this.scope.attr('isActive', true);
          setTimeout(function () {
            this.scope.attr('isActive', false);
          }.bind(this), timeout);
        }.bind(this));
      }
    }
  });

})(window.can, window.can.$, window.Clipboard);
