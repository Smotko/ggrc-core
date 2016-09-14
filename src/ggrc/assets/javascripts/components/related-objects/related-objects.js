/*!
 Copyright (C) 2016 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC, CMS) {
  'use strict';

  can.Component.extend({
    tag: 'related-objects',
    scope: {
      parentInstance: null,
      baseInstance: null,
      relatedItemsType: 'Assessment',
      relatedObjects: new can.List(),
      paging: {
        current: 1,
        pageSize: 5,
        pageSizeSelect: [5, 10, 15]
      },
      isLoading: false,
      getParams: function () {
        var id = this.attr('baseInstance.id');
        var relatedType = this.attr('relatedItemsType');
        var page = this.attr('paging');
        var params = {};
        var first;
        var last;

        if (page.current && page.pageSize) {
          first = (page.current - 1) * page.pageSize;
          last = page.current * page.pageSize;
        }
        params.data = [{
          limit: [first, last],
          object_name: relatedType,
          order_by: [{name: '__similarity__', desc: true}],
          filters: {
            expression: {
              object_name: relatedType,
              op: {name: 'similar'},
              ids: [id]
            }
          }
        }];
        return params;
      },
      loadRelatedItems: function () {
        var dfd = new can.Deferred();
        var params = this.getParams();
        this.attr('isLoading', true);
        GGRC.Utils.QueryAPI
          .makeRequest(params)
          .done(function (responseArr) {
            var relatedType = this.attr('relatedItemsType');
            var data = responseArr[0];
            var total = data[relatedType].total;
            var count = Math.floor(total / this.attr('paging.pageSize')) + 1;
            var values = data[relatedType].values;
            var result = values.map(function (item) {
              return {instance: new CMS.Models[relatedType](item)};
            });
            // Update paging object
            this.attr('paging.total', total);
            this.attr('paging.count', count);
            dfd.resolve(result);
            this.attr('isLoading', false);
          }.bind(this));
        return dfd;
      },
      setRelatedItems: function () {
        this.attr('relatedObjects').replace(this.loadRelatedItems());
      }
    },
    init: function () {
      this.scope.setRelatedItems();
    },
    events: {
      '{scope.paging} current': function () {
        this.scope.setRelatedItems();
      },
      '{scope.paging} pageSize': function () {
        this.scope.setRelatedItems();
      }
    }
  });
})(window.can, window.GGRC, window.CMS);
