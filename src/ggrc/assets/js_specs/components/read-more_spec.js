/*!
  Copyright (C) 2016 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

describe('GGRC.Component.ReadMore', function () {
  'use strict';
  var testingText = 'Lorem ipsum ' +
    'dolor sit amet, consectetur adipiscing elit.' +
    ' Mauris accumsan porta nisl ut lobortis.' +
    ' Proin sollicitudin enim ante,' +
    ' sit amet elementum ipsum fringilla sed';
  var readMore = 'Read More';
  var btnNewText = 'Read Less';

  var defaultScopeState = {
    text: testingText,
    expanded: false,
    showButton: false,
    overflowing: false,
    btnText: readMore,
    maxTextLength: 10
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
  describe('.setValues() method', function () {
    var Component;  // the component under test
    var setValues;
    var scope;

    beforeEach(function () {
      Component = GGRC.Components.get('readMore');
      scope = new can.Map(Component.prototype.scope);
      setValues = Component.prototype.scope.setValues;
      setValues = setValues.bind(scope);
    });

    it('switch update resultedText, overflowing', function () {
      scope.attr('maxTextLength', defaultScopeState.maxTextLength);
      scope.attr('text', testingText);

      setValues(testingText);

      expect(scope.attr('text')).toBe(testingText);
      expect(scope.attr('overflowing')).toBe(true);
      expect(scope.attr('resultedText')).toBe(testingText.slice(0, 7) + '...');
    });
  });
});
