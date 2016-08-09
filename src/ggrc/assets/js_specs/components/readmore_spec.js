/*!
  Copyright (C) 2016 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

describe('GGRC.Component.ReadMore', function () {
  'use strict';

  var readMore = 'Read More';
  var btnNewText = 'Read Less';

  var defaultScopeState = {
    text: null,
    expanded: false,
    showButton: false,
    btnText: readMore
  };
  describe('.toggle() method', function () {
    var Component;  // the component under test
    var toggle;
    var scope;

    beforeEach(function () {
      Component = GGRC.Components.get('readMore');
      scope = new can.Map(Component.prototype.scope);
      toggle = Component.prototype.scope.toggle;
      toggle = toggle.bind(scope);
    });

    it('switch default state', function () {
      scope.attr('expanded', true);
      scope.attr('btnText', btnNewText);

      toggle();

      expect(scope.attr('expanded')).toBe(defaultScopeState.expanded);
      expect(scope.attr('btnText')).toBe(defaultScopeState.btnText);
    });
  });
});
