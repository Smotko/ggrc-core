/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */
(function (can, GGRC) {
  'use strict';

  var ALL_SAVED_TEXT = 'All changes saved';
  var UNSAVED_TEXT = 'Unsaved changes';
  var IS_SAVING_TEXT = 'Saving...';
  var ERROR = 'Changes NOT saved';

  GGRC.Components('localCustomAttributesStatus', {
    tag: 'custom-attributes-status',
    template: '<content></content>',
    viewModel: {
      define: {
        isDirty: {
          type: 'boolean',
          value: false
        },
        formSaving: {
          type: 'boolean',
          value: false
        },
        error: {
          type: 'boolean',
          value: false
        },
        formStatusText: {
          type: 'string',
          get: function () {
            if (this.attr('formSaving')) {
              return IS_SAVING_TEXT;
            }
            if (this.attr('error')) {
              return ERROR;
            }
            return !this.attr('isDirty') ? ALL_SAVED_TEXT : UNSAVED_TEXT;
          }
        }
      }
    }
  });
})(window.can, window.GGRC);
