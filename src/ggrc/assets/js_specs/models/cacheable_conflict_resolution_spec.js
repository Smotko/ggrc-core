/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/


describe('can.Model.Cacheable conflict resolution', function () {
  var _obj;
  var id = 0;

  beforeAll(function () {
    can.Model.Cacheable.extend('CMS.Models.DummyModel', {
      update: 'PUT /api/dummy_models/{id}'
    }, {});
  });

  afterAll(function () {
    delete CMS.Models.DummyModel;
  });

  beforeEach(function (done) {
    _obj = new CMS.Models.DummyModel({id: ++id});
    done();
  });

  function _resovleDfd(obj, reject) {
    return new $.Deferred(function (dfd) {
      setTimeout(function () {
        if (!reject) {
          dfd.resolve(obj);
        } else {
          dfd.reject(obj, 409, 'CONFLICT');
        }
      }, 10);
    });
  }

  it('triggers error flash when one property has an update conflict',
    function (done) {
      var obj = _obj;
      obj.attr('foo', 'bar');
      obj.backup();

      expect(obj._backupStore()).toEqual(
        jasmine.objectContaining({id: obj.id, foo: 'bar'}));
      obj.attr('foo', 'plonk');
      spyOn($.fn, 'trigger').and.callThrough();
      spyOn(obj, 'save').and.callFake(function () {
        return _resovleDfd(obj);
      });
      spyOn(obj, 'refresh').and.callFake(function () {
        obj.attr('foo', 'thud'); // uh-oh!  The same attr has been changed locally and remotely!
        return _resovleDfd(obj);
      });
      spyOn(can, 'ajax')// .and.returnValue(new $.Deferred().reject({status: 409}, 409, "CONFLICT"));
      .and.callFake(function () {
        return _resovleDfd({status: 409}, true);
      });
      CMS.Models.DummyModel.update(obj.id.toString(), obj.serialize()).then(
        function () {
          fail("The update handler isn't supposed to resolve here.");
          done();
        }, function () {
        expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash', {
          warning: [jasmine.any(String)]
        });
        done();
      });
    });

  it('does not refresh model', function (done) {
    var obj = _obj;
    spyOn(obj, 'refresh').and.returnValue($.when(obj));
    spyOn(can, 'ajax').and.returnValue(
      new $.Deferred().reject({status: 409}, 409, 'CONFLICT'));
    CMS.Models.DummyModel.update(obj.id, obj.serialize()).then(function () {
      done();
    }, function () {
      expect(obj.refresh).not.toHaveBeenCalled();
      done();
    });
  });

  it('sets timeout id to XHR-response', function (done) {
    var obj = _obj;
    spyOn(obj, 'refresh').and.returnValue($.when(obj));
    spyOn(window, 'setTimeout').and.returnValue(999);
    spyOn(can, 'ajax').and.returnValue(
      new $.Deferred().reject({status: 409}, 409, 'CONFLICT'));
    CMS.Models.DummyModel.update(obj.id, obj.serialize()).then(function () {
      done();
    }, function (xhr) {
      expect(xhr.warningId).toEqual(999);
      done();
    });
  });


  it('merges changed properties and saves', function (done) {
    var obj = _obj;
    obj.attr('foo', 'bar');
    obj.backup();
    expect(obj._backupStore()).toEqual(
      jasmine.objectContaining({id: obj.id, foo: 'bar'}));
    obj.attr('foo', 'plonk');
    spyOn(obj, 'save').and.returnValue($.when(obj));
    spyOn(obj, 'refresh').and.callFake(function () {
      obj.attr('baz', 'quux');
      return $.when(obj);
    });
    spyOn(can, 'ajax').and.returnValue(new $.Deferred().reject(
      {status: 409}, 409, 'CONFLICT'));
    CMS.Models.DummyModel.update(obj.id, obj.serialize()).then(function () {
      expect(obj).toEqual(jasmine.objectContaining(
        {id: obj.id, foo: 'plonk', baz: 'quux'}));
      expect(obj.save).toHaveBeenCalled();
      setTimeout(function () {
        done();
      }, 10);
    }, failAll(done));
  });


  it('lets other error statuses pass through', function (done) {
    var obj = new CMS.Models.DummyModel({id: 1});
    var xhr = {status: 400};
    spyOn(obj, 'refresh').and.returnValue($.when(obj.serialize()));
    spyOn(can, 'ajax').and.returnValue(
      new $.Deferred().reject(xhr, 400, 'BAD REQUEST'));
    CMS.Models.DummyModel.update(1, obj.serialize()).then(
      failAll(done),
      function (_xhr) {
        expect(_xhr).toBe(xhr);
        done();
      }
    );
  });
});
