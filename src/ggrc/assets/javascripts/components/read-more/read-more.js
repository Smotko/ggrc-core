/*!
 Copyright (C) 2016 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tpl = can.view(GGRC.mustache_path +
    '/components/read-more/read-more.mustache');
  var tag = 'read-more';
  var defaultTextLength = 200;
  var readMore = 'Read More';
  var readLess = 'Read Less';
  /**
   * Assessment specific read more view component
   */
  GGRC.Components('readMore', {
    tag: tag,
    template: tpl,
    scope: {
      maxTextLength: null,
      text: null,
      expanded: false,
      btnText: readMore,
      resultedText: null,
      overflowing: false,
      toggle: function () {
        var newValue = !this.attr('expanded');
        this.attr('expanded', newValue);
        this.attr('btnText', newValue ? readLess : readMore);
      },
      getSlicedText: function (text, limit) {
        limit -= 3;
        return text.slice(0, limit) + '...';
      },
      setValues: function (originalText) {
        var limit = this.attr('maxTextLength') || defaultTextLength;
        var resultedText =
          can.$('<span>' + originalText + '</span>').text().trim();
        var isOverflowing = resultedText.length >= limit;
        this.attr('maxTextLength', limit);
        this.attr('overflowing', isOverflowing);
        this.attr('resultedText', isOverflowing ?
          this.getSlicedText(resultedText, limit) :
          originalText);
      }
    },
    events: {
      init: function () {
        this.scope.setValues(this.scope.attr('text'));
      },
      '{scope} text': function (scope, ev, val) {
        this.scope.setValues(val);
      }
    }
  });
})(window.can, window.GGRC);
