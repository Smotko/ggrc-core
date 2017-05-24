/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC, CMS) {
  'use strict';

  var mapper = {
    createRelationship: function (source, destination) {
      return new CMS.Models.Relationship({
        context: source.context,
        source: source.stub(),
        destination: destination
      });
    },
    createObjectRelationship: function (source, destination) {
      return new CMS.Models.Relationship({
        context: source.context,
        source: source,
        destination: destination
      });
    },
    isEvidence: function (type) {
      return type === 'evidence';
    },
    mapObjects: function (source, destination, type) {
      return this.isEvidence(type) ?
        this.createObjectRelationship(source, destination) :
        this.createRelationship(source, destination);
    }
  };

  GGRC.Components('reusableObjectsList', {
    tag: 'reusable-objects-list',
    viewModel: {
      baseInstance: null,
      checkReusedStatus: false,
      evidenceList: [],
      urlList: [],
      isSaving: false,
      setHasSelected: function () {
        var hasSelected =
          this.attr('evidenceList.length') || this.attr('urlList.length');
        this.attr('hasSelected', hasSelected);
      },
      getMapObjects: function (source, list, mapperType) {
        return Array.prototype.filter
        // Get Array of unique items
          .call(list, function (item, index) {
            return index === list.indexOf(item);
          })
          // Get Array of mapped models
          .map(function (destination) {
            return mapper
              .mapObjects(source, destination, mapperType)
              .save();
          });
      },
      getReusedObjectList: function () {
        var source = this.attr('baseInstance');
        var evidences =
          this.getMapObjects(source, this.attr('evidenceList'), 'evidence');
        var urls =
          this.getMapObjects(source, this.attr('urlList'));
        return [].concat(evidences, urls);
      },
      reuseSelected: function () {
        var reusedObjectList = this.getReusedObjectList();

        this.attr('isSaving', true);
        this.attr('checkReusedStatus', false);

        can.when.apply(can, reusedObjectList)
          .done(function () {
            can.$(document.body).trigger('ajax:flash', {
              success: 'Selected evidences are reused'
            });
          })
          .fail(function () {
            can.$(document.body).trigger('ajax:flash', {
              error: 'Selected evidences were not reused'
            });
          })
          .always(this.restoreDefaults.bind(this));
      },
      restoreDefaults: function () {
        this.attr('evidenceList').replace([]);
        this.attr('urlList').replace([]);
        this.attr('isSaving', false);
        this.attr('checkReusedStatus', true);
        this.attr('baseInstance').dispatch('refreshInstance');
      }
    },
    events: {
      '{viewModel.evidenceList} length': function () {
        this.scope.setHasSelected();
      },
      '{viewModel.urlList} length': function () {
        this.scope.setHasSelected();
      }
    }
  });
})(window.can, window.GGRC, window.CMS);
