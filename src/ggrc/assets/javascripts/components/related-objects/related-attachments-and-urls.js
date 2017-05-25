/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can) {
  'use strict';

  /**
   * Simple wrapper component for related attachments and urls
   */
  can.Component.extend({
    tag: 'related-attachments-and-urls',
    viewModel: {
      define: {
        noRelatedItemMessage: {
          type: String,
          value: function () {
            return '';
          }
        },
        emptyMessage: {
          type: String,
          value: function () {
            return 'None';
          }
        },
        loadingState: {},
        showEmptyMessage: {
          get: function () {
            return !this.attr('loadingState.attachmentsLoading') &&
              !this.attr('urls.length') &&
              !this.attr('attachments.length');
          }
        }
      }
    }
  });
})(window.can);
