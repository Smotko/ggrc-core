/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {DESTINATION_UNMAPPED} from '../../events/eventTypes';

(function (can, GGRC, CMS) {
  'use strict';

  let defaultType = 'Relationship';

  GGRC.Components('unmapButton', {
    tag: 'unmap-button',
    viewModel: {
      mappingType: '@',
      objectProp: '@',
      destination: {},
      source: {},
      isUnmapping: false,
      preventClick: false,
      unmapInstance: function () {
        this.attr('isUnmapping', true);
        this.dispatch({type: 'beforeUnmap', item: this.attr('source')});
        this.getMapping()
          .done((item) => {
            item.destroy()
              .then(() => {
                this.dispatch('unmapped');
                this.attr('destination').dispatch('refreshInstance');
                this.attr('destination').dispatch(DESTINATION_UNMAPPED);
                this.dispatch('afterUnmap');
              })
              .always(() => {
                this.attr('isUnmapping', false);
              });
          })
          .fail(() => {
            this.attr('isUnmapping', false);
          });
      },
      _findRelationship: function (source, destination) {
        return CMS.Models.Relationship.findAll({
          source_id: source.attr('id'),
          source_type: source.attr('type'),
          destination_id: destination.attr('id'),
          destination_type: destination.attr('type')});
      },
      getMapping: function () {
        let type = this.attr('mappingType') || defaultType;
        let destinations;
        let sources;
        let mapping;
        if (type === defaultType) {
          // defaultType is a Relationship mapping and since we no longer have
          // related_source/related_destinations on the FE we need to make
          // 2 or 3 requests to find the correct relationship object to delete.
          // 1. Try fetching a relationship where this.source is the source
          //    and this.destination is the destination.
          // 2. If 1. did not give a result, we try the opposite, where
          //    this.source is the destination and this.destination is
          //    the source.
          // 3. We then have to do a refresh to get the ETAG before we can do
          //    the DELETE.
          // This code can be simplified once we add a /relationships/unmap API
          return this._findRelationship(this.source, this.destination)
            .then((res) => {
              if (!res.length) {
                return this._findRelationship(this.destination, this.source);
              }
              return res;
            }).then((res) => {
              if (!res.length) {
                console.error('Could not find the corresponding relationship');
              }
              return res[0].refresh();
            });
        } else {
          destinations = this.attr('destination')
            .attr(this.attr('objectProp')) || [];
          sources = this.attr('source')
            .attr(this.attr('objectProp')) || [];
        }
        sources = sources
          .map(function (item) {
            return item.id;
          });
        mapping = destinations
          .filter(function (dest) {
            return sources.indexOf(dest.id) > -1;
          })[0];
        return new CMS.Models[type](mapping || {}).refresh();
      },
    },
    events: {
      click: function () {
        if (this.viewModel.attr('preventClick')) {
          return;
        }

        this.viewModel.unmapInstance();
      },
    },
  });
})(window.can, window.GGRC, window.CMS);
