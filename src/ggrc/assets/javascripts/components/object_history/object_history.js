/*!
  Copyright (C) 2016 Google Inc., authors, and contributors <see AUTHORS file>
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
  Created By: peter@reciprocitylabs.com
  Maintained By: peter@reciprocitylabs.com
*/

(function (GGRC, can) {
  'use strict';

  /**
   * A component that calculates and renders the given Model object's revision
   * history.
   */
  GGRC.Components('objectHistory', {
    tag: 'revision-log',

    template: can.view(
      GGRC.mustache_path +
      '/components/object_history/object_history.mustache'
    ),

    scope: {
      instance: null,
      changeHistory: new can.List(),
      isLoading: true
    },

    // the type of the object the component is operating on
    _INSTANCE_TYPE: null,

    /**
     * The component's entry point. Invoked when a new component instance has
     * been created.
     *
     * @param {Object} element - the (unwrapped) DOM element that triggered
     *   creating the component instance
     * @param {Object} options - the component instantiation options
     */
    init: function (element, options) {
      if (this.scope.instance === null) {
        throw new Error('Instance not passed through the HTML element.');
      }

      this._INSTANCE_TYPE = this.scope.instance.type;

      this._fetchRevisionsData(
        this.scope.instance
      ).then(
        function success(revisions) {
          var changeHistory;
          var mappingsChanges = this._computeMappingChanges(revisions.mappings);
          var objChanges = this._computeObjectChanges(revisions.object);

          // combine all the changes and sort them by date descending
          changeHistory = objChanges.concat(mappingsChanges);
          changeHistory.sort(function byDateDescending(x, y) {
            var d1 = x.updatedAt;
            var d2 = y.updatedAt;
            if (d1.getTime() === d2.getTime()) {
              return 0;
            }
            return (d1 < d2) ? 1 : -1;
          });

          this.scope.attr('changeHistory', changeHistory);
        }.bind(this),

        function error() {
          $(element).trigger(
            'ajax:flash',
            {error: 'Failed to fetch revision history data.'});
        }
      ).always(function () {
        this.scope.attr('isLoading', false);
      }.bind(this));
    },

    /**
     * Fetch the instance's Revisions data from the server, including the
     * Revisions of the instance's mappings.
     *
     * The `instance` here refers to the instance of an object currently being
     * handled by the component.
     *
     * @return {can.Deferred} - an object representing the async operation of
     *   fetching the data from the server. On success it is resolved with an
     *   object containing the following Revision data, order by date from
     *   oldest to newest:
     *   - {can.List} object - the list of Revisions of the instance itself,
     *   - {can.List} mappings - the list of Revisions of all the instance's
     *      mappings
     */
    _fetchRevisionsData: function () {
      var Revision = CMS.Models.Revision;

      var instance = this.scope.instance;

      var dfd = Revision.findAll({
        resource_type: this._INSTANCE_TYPE,
        resource_id: instance.id,
        __sort: 'updated_at'
      });

      var dfd2 = Revision.findAll({
        source_type: this._INSTANCE_TYPE,
        source_id: instance.id,
        __sort: 'updated_at'
      });

      var dfd3 = Revision.findAll({
        destination_type: this._INSTANCE_TYPE,
        destination_id: instance.id,
        __sort: 'updated_at'
      });

      var dfdResults = can.when(
        dfd, dfd2, dfd3
      ).then(function (objRevisions, mappingsSrc, mappingsDest) {
        var revisions = {
          object: objRevisions,
          mappings: mappingsSrc.concat(mappingsDest)
        };
        return revisions;
      });

      return dfdResults;
    },

    /**
     * Compute the the history of object changes from a list of Revisions.
     *
     * The computed list of changes is sorted from oldest to newest (the method
     * assumes that the `revisions` list is also sorted chronologically with
     * the oldest Revision placed first).
     *
     *
     * @param {can.List} revisions - the list of revisions of the instance
     *   being handled by the component, sorted from oldest to newest.
     *
     * @return {can.List} - the history of changes to the instance. Each
     *   element follows the format returned by the `_objectChangeDiff` method.
     */
    _computeObjectChanges: function (revisions) {
      var diff;
      var diffList = [];
      var i;

      for (i = 1; i < revisions.length; i++) {
        diff = this._objectChangeDiff(revisions[i - 1], revisions[i]);
        // It can happen that there were no changes to the publicly visible
        // object fields, and the resulting diff object's change list is thus
        // empty - we don't include those in the result.
        if (diff.changes.length > 0) {
          diffList.push(diff);
        }
      }

      return new can.List(diffList);
    },

    /**
     * A helper function for computing the difference between the two Revisions
     * of an object.
     *
     * The function assumes that the given revisions are two distinct Revisions
     * of the same object (application entity).
     *
     * NOTE: The object fields that do not have a user-friendly alias defined are
     * considered "internal", and are thus not included in the resulting diff
     * objects, because they are not meant to be shown to the end user.
     *
     * @param {CMS.Models.Revision} rev1 - the older of the two revisions
     * @param {CMS.Models.Revision} rev2 - the newer of the two revisions
     *
     * @return {can.List} - A "diff" object describing the changes between the
     *   revisions. The object has the following attributes:
     *   - madeBy: the user who made the changes
     *   - updatedAt: the time when the changes have been made
     *   - changes:
     *       A list of objects describing the modified attributes of the
     *       instance`, with each object having the following attributes:
     *         - fieldName: the name of the changed`instance` attribute
     *         - origVal: the attribute's original value
     *         - newVal: the attribute's new (modified) value
     */
    _objectChangeDiff: function (rev1, rev2) {
      var diff = {
        madeBy: null,
        updatedAt: null,
        changes: new can.List()
      };
      var attrDefs = GGRC.model_attr_defs[rev2.resource_type];

      diff.madeBy = 'User ' + rev2.modified_by.id;
      diff.updatedAt = rev2.updated_at;

      can.each(rev2.content, function (value, fieldName) {
        var origVal = rev1.content[fieldName];
        var displayName;
        if (attrDefs) {
          displayName = (_.find(attrDefs, function (attr) {
            return attr.attr_name === fieldName;
          }) || {}).display_name;
        } else {
          displayName = fieldName;
        }

        if (displayName && value !== origVal) {
          diff.changes.push({
            fieldName: displayName,
            origVal: origVal,
            newVal: value
          });
        }
      });

      return new can.Map(diff);
    },

    /**
     * Compute the instance's object mapping-related changes from the list of
     * mapping revisions.
     *
     * @param {can.List} revisions - the list of instance mappings' revision
     *   history, sorted from oldest to newest.
     *
     * @return {can.List} - the history of instance mappings' changes. Each
     *   element follows the format returned by the `_mappingChange` helper
     *   method.
     */
    _computeMappingChanges: function (revisions) {
      // can.List.map() is not available in CanJS 2.0, thus using _.map()
      var result = _.map(revisions, this._mappingChange.bind(this));
      return new can.List(result);
    },

    /**
     * A helper function for extracting the mapping change information from a
     * Revision object.
     *
     * @param {CMS.Models.Revision} revision - a Revision object describing a
     *   mapping between the object instance the component is handling, and an
     *   external object
     *
     * @return {can.Map} - A "change" object describing a single modification
     *   of a mapping. The object has the following attributes:
     *   - madeBy: the user who made the changes
     *   - updatedAt: the time when the changes have been made
     *   - mapping:
     *       Information about the changed mapping containing the following:
     *         - action: the mapping action that was performed by a user,
     *             can be either "Create" or "Delete"
     *         - relatedObjId: the ID of the object at the other end of the
     *             mapping (*)
     *         - relatedObjType: the type of the object at the other end of the
     *             mapping (*)
     *
     *         (*) The object on "this" side of the mapping is of course the
     *             instance the component is handling.
     */
    _mappingChange: function (revision) {
      var change = {
        madeBy: null,
        updatedAt: null,
        mapping: {}
      };

      change.madeBy = 'User ' + revision.modified_by.id;
      change.updatedAt = revision.updated_at;

      change.mapping.action = _.capitalize(revision.action);

      // The instance the component is handling can be on either side of the
      // mapping, i.e. source or destination, but we are interested in the
      // object on the "other" end of the mapping.
      if (revision.destination_type === this._INSTANCE_TYPE) {
        change.mapping.relatedObjId = revision.source_id;
        change.mapping.relatedObjType = revision.source_type;
      } else {
        change.mapping.relatedObjId = revision.destination_id;
        change.mapping.relatedObjType = revision.destination_type;
      }

      return new can.Map(change);
    }
  });
})(window.GGRC, window.can);
