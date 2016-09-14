/*!
 Copyright (C) 2016 Google Inc.
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
      return new CMS.Models.ObjectDocument({
        context: source.context,
        documentable: source,
        document: destination
      });
    },
    // TODO: need to add a more reliable check
    isObjectDocument: function (object) {
      return object.object_documents && object.object_documents.length;
    },
    map: function (source, destination) {
      return this.isObjectDocument(destination) ?
        this.createObjectRelationship(source, destination) :
        this.createRelationship(source, destination);
    }
  };

  can.Component.extend({
    tag: 'reusable-objects-list',
    scope: {
      parentInstance: null,
      selectedList: new can.List(),
      isLoading: false,
      reuseSelected: function () {
        var reusedList = this.attr('selectedList');
        var source = this.attr('parentInstance');
        var models = can.map(reusedList, function (destination) {
          var relationship = mapper.map(source, destination);
          return relationship.save();
        });
        this.attr('isLoading', true);
        can.when.apply(can, models).then(function () {
          can.$(document.body).trigger('ajax:flash', {
            success: 'Selected evidences are reused'
          });
          reusedList.replace([]);
          this.attr('isLoading', false);
        }.bind(this));
      }
    },
    events: {
      '{scope.selectedList} length': function (arr, ev, length) {
        this.scope.attr('hasSelected', length > 0);
      }
    }
  });
})(window.can, window.GGRC, window.CMS);
