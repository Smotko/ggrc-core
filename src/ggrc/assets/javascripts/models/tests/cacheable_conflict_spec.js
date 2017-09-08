/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

describe('CacheableConflict spec', function () {
  'use strict';

  var TestModel;

  beforeAll(function () {
    TestModel = can.Model.Cacheable('TestModel', {}, {});
  });

  describe('Test cacheable changes', function () {
    it('Updates _changes dict on attr changes', function () {
      var testModel = new TestModel({
        myAttr: 'old-value'
      });
      testModel.attr('myAttr', 'new-value');
      expect(testModel._changes).toEqual({
        myAttr: {
          is: 'new-value',
          was: 'old-value'
        }
      });
      // Make sure we don't override `was` property by additional changes
      testModel.attr('myAttr', 'newest-value');
      expect(testModel._changes).toEqual({
        myAttr: {
          is: 'newest-value',
          was: 'old-value'
        }
      });
    });
    it('Clears out _changes dict when object is created', function () {
      var testModel = new TestModel({
        myAttr: 'old-value'
      });
      testModel.attr('myAttr', 'new-value');
      testModel.created();
      expect(testModel._changes).toEqual({});
    });
    it('Clears out _changes dict when object is updated', function () {
      var testModel = new TestModel({
        myAttr: 'old-value'
      });
      testModel.attr('myAttr', 'new-value');
      testModel.updated();
      expect(testModel._changes).toEqual({});
    });
    it('Resets _changes when value changes back to the old one', function () {
      var testModel = new TestModel({
        myAttr: 'old-value'
      });
      testModel.attr('myAttr', 'new-value');
      testModel.attr('myAttr', 'old-value');
      expect(testModel._changes).toEqual({});
    });
  });
});
