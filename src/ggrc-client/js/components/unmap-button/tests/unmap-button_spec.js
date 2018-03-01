/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

describe('GGRC.Components.unmapButton', function () {
  'use strict';
  let events;
  let viewModel;

  beforeAll(function () {
    let Component = GGRC.Components.get('unmapButton');
    events = Component.prototype.events;
  });

  beforeEach(function () {
    viewModel = GGRC.Components.getViewModel('unmapButton');
  });

  describe('"click" event handler', function () {
    let handler;
    beforeEach(function () {
      handler = events.click;
    });

    it('calls "unmapInstance"', function () {
      spyOn(viewModel, 'unmapInstance');

      handler.call({viewModel: viewModel});

      expect(viewModel.unmapInstance).toHaveBeenCalled();
    });

    it('does not call "unmapInstance" when "preventClick" is ON', function () {
      viewModel.attr('preventClick', true);
      spyOn(viewModel, 'unmapInstance');

      handler.call({viewModel: viewModel});

      expect(viewModel.unmapInstance).not.toHaveBeenCalled();
    });
  });

  describe('unmapInstance() method', function () {
    let refreshDfd;
    beforeEach(function () {
      refreshDfd = can.Deferred();
      spyOn(viewModel, 'getMapping').and.returnValue(refreshDfd);
    });

    it('sets "isUnmapping" flag to true', function () {
      viewModel.attr('isUnmapping', false);

      viewModel.unmapInstance();

      expect(viewModel.attr('isUnmapping')).toBe(true);
    });

    describe('sets "isUnmapping" flag to false', function () {
      beforeEach(function () {
        viewModel.attr('isUnmapping', true);
      });

      it('when refresh() was failed', function () {
        refreshDfd.reject();

        viewModel.unmapInstance();

        expect(viewModel.attr('isUnmapping')).toBe(false);
      });

      it('after destroy() success', function () {
        refreshDfd.resolve({
          destroy: jasmine.createSpy()
            .and.returnValue(can.Deferred().resolve()),
        });

        viewModel.unmapInstance();

        expect(viewModel.attr('isUnmapping')).toBe(false);
      });

      it('when destroy() was failed', function () {
        refreshDfd.resolve({
          destroy: jasmine.createSpy()
            .and.returnValue(can.Deferred().reject()),
        });

        viewModel.unmapInstance();

        expect(viewModel.attr('isUnmapping')).toBe(false);
      });
    });
  });
});
