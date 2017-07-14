/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

describe('GGRC.VM.ObjectOperationsBaseVM', function () {
  'use strict';

  var baseVM;

  beforeEach(function () {
    baseVM = GGRC.VM.ObjectOperationsBaseVM();
  });

  describe('availableTypes() method', function () {
    var originalInScopeModels;
    beforeAll(function () {
      originalInScopeModels = GGRC.Utils.Snapshots.inScopeModels;
      GGRC.Utils.Snapshots.inScopeModels = ['test1', 'test2'];
    });
    afterAll(function () {
      GGRC.Utils.Snapshots.inScopeModels = originalInScopeModels;
    });

    it('correctly calls getMappingTypes', function () {
      var result;
      spyOn(GGRC.Mappings, 'getMappingTypes').and.returnValue('types');
      baseVM.attr('object', 'testObject');

      result = baseVM.availableTypes();
      expect(GGRC.Mappings.getMappingTypes).toHaveBeenCalledWith('testObject',
        [], ['test1', 'test2']);
      expect(result).toEqual('types');
    });
  });

  describe('get() for baseVM.parentInstance', function () {
    beforeEach(function () {
      spyOn(CMS.Models, 'get_instance')
        .and.returnValue('parentInstance');
    });

    it('returns parentInstance', function () {
      var result = baseVM.attr('parentInstance');
      expect(result).toEqual('parentInstance');
    });
  });

  describe('allowedToCreate() method', function () {
    it('returns true if it is not an in-scope model',
      function () {
        var result;
        spyOn(GGRC.Utils.Snapshots, 'isInScopeModel')
          .and.returnValue(false);
        result = baseVM.allowedToCreate();
        expect(result).toEqual(true);
      });

    it('returns false if it is an in-scope model',
      function () {
        var result;
        spyOn(GGRC.Utils.Snapshots, 'isInScopeModel')
          .and.returnValue(true);
        result = baseVM.allowedToCreate();
        expect(result).toEqual(false);
      });
  });

  describe('showWarning() method', function () {
    it('returns false if is an in-scope model', function () {
      var result;
      spyOn(GGRC.Utils.Snapshots, 'isInScopeModel')
        .and.returnValue(true);
      result = baseVM.showWarning();
      expect(result).toEqual(false);
    });

    it('returns true if source object is a Snapshot parent', function () {
      var result;
      spyOn(GGRC.Utils.Snapshots, 'isInScopeModel')
        .and.returnValue(false);
      spyOn(GGRC.Utils.Snapshots, 'isSnapshotParent')
        .and.callFake(function (v) {
          return v === 'o';
        });
      baseVM.attr('object', 'o');
      baseVM.attr('type', 't');
      result = baseVM.showWarning();
      expect(result).toEqual(true);
    });

    it('returns true if is mapped object is a ' +
      'Snapshot parent', function () {
      var result;
      spyOn(GGRC.Utils.Snapshots, 'isInScopeModel')
        .and.returnValue(false);
      spyOn(GGRC.Utils.Snapshots, 'isSnapshotParent')
        .and.callFake(function (v) {
          return v === 't';
        });
      baseVM.attr('object', 'o');
      baseVM.attr('type', 't');
      result = baseVM.showWarning();
      expect(result).toEqual(true);
    });
  });

  describe('modelFromType() method', function () {
    it('returns undefined if no models', function () {
      var result = baseVM.modelFromType('program');
      expect(result).toEqual(undefined);
    });

    it('returns model config by model value', function () {
      var result;
      var types = {
        governance: {
          items: [{
            value: 'v1'
          }, {
            value: 'v2'
          }, {
            value: 'v3'
          }]
        }
      };

      spyOn(GGRC.Mappings, 'getMappingTypes')
        .and.returnValue(types);

      result = baseVM.modelFromType('v2');
      expect(result).toEqual(types.governance.items[1]);
    });
  });

  describe('onSubmit() method', function () {
    it('sets true to baseVM.afterSearch', function () {
      baseVM.attr('afterSearch', false);
      baseVM.onSubmit();
      expect(baseVM.attr('afterSearch')).toEqual(true);
    });
  });
});
