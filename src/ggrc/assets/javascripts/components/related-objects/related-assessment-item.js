/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can) {
  'use strict';

  /**
   * Simple wrapper component for assessment list item
   */
  can.Component.extend({
    tag: 'related-assessment-item',
    viewModel: {
      loadingState: {},
      subItemsLoading: function () {
        return this.attr('loadingState.auditLoading') ||
          this.attr('loadingState.attachmentsLoading') ||
          this.attr('loadingState.controlsLoading');
      }
    }
  });
})(window.can);
