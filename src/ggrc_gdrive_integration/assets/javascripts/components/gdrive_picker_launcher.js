/*
 * Copyright (C) 2016 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, $) {
  'use strict';

  GGRC.Components('gDrivePickerLauncher', {
    tag: 'ggrc-gdrive-picker-launcher',
    template: can.view(GGRC.mustache_path + '/gdrive/gdrive_file.mustache'),
    scope: {
      instance: null,
      folder_instance: null,
      deferred: '@',
      icon: '@',
      link_text: '@',
      link_class: '@',
      click_event: '@',
      verify_event: '@',
      modal_description: '@',
      modal_title: '@',
      modal_button: '@',
      trigger_upload: function (scope, el, ev) {
        // upload files without a parent folder (risk assesment)
        var that = this;
        var dfd;
        var folderId = el.data('folder-id');

        // the result of the confirmation modal (if shown to the user)
        var dfdModalConfirm = $.Deferred();

        scope.attr('pickerActive', true);

        // Create and render a Picker object for searching images.
        function createPicker() {
          window.oauth_dfd.done(function (token, oauthUser) {
            var dialog;
            var view;
            var docsView;
            var docsUploadView;
            var picker = new google.picker.PickerBuilder()
                    .setOAuthToken(gapi.auth.getToken().access_token)
                    .setDeveloperKey(GGRC.config.GAPI_KEY)
                    .setCallback(pickerCallback);

            if (el.data('type') === 'folders') {
              view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
                  .setIncludeFolders(true)
                  .setSelectFolderEnabled(true);
              picker.addView(view);
            } else {
              docsUploadView = new google.picker.DocsUploadView()
                .setParent(folderId);
              docsView = new google.picker.DocsView()
                .setParent(folderId);

              picker.addView(docsUploadView)
                .addView(docsView)
                .enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
            }
            picker = picker.build();
            picker.setVisible(true);

            dialog = GGRC.Utils.getPickerElement(picker);
            if (dialog) {
              dialog.style.zIndex = 4001; // our modals start with 2050
            }
          })
          .fail(function () {
            scope.attr('pickerActive', false);
          });
        }

        function pickerCallback(data) {
          var files;
          var PICKED = google.picker.Action.PICKED;
          var ACTION = google.picker.Response.ACTION;
          var DOCUMENTS = google.picker.Response.DOCUMENTS;
          var CANCEL = google.picker.Action.CANCEL;

          if (data[ACTION] === PICKED) {
            files = CMS.Models.GDriveFile.models(data[DOCUMENTS]);
            that.attr('pending', true);
            scope.attr('pickerActive', false);

            return new RefreshQueue().enqueue(files).trigger()
              .then(function (files) {
                var docDfds = that.handle_file_upload(files);
                $.when.apply($, docDfds).then(function () {
                  // Trigger modal:success event on scope
                  can.trigger(
                    that, 'modal:success', {arr: can.makeArray(arguments)});
                  el.trigger('modal:success', {arr: can.makeArray(arguments)});
                  that.attr('pending', false);
                });
              });
          } else if (data[ACTION] === CANCEL) {
            el.trigger('rejected');
            scope.attr('pickerActive', false);
          }
        }

        if (scope.attr('verify_event')) {
          GGRC.Controllers.Modals.confirm({
            modal_description: scope.attr('modal_description'),
            modal_confirm: scope.attr('modal_button'),
            modal_title: scope.attr('modal_title'),
            button_view: GGRC.mustache_path +
              '/gdrive/confirm_buttons.mustache'
          }, dfdModalConfirm.resolve, dfdModalConfirm.reject);
        } else {
          dfdModalConfirm.resolve();
        }

        dfdModalConfirm.done(function () {
          dfd = GGRC.Controllers.GAPI.authorize(
            ['https://www.googleapis.com/auth/drive']
          );
          dfd.done(function () {
            gapi.load('picker', {callback: createPicker});
          }).fail(function () {
            scope.attr('pickerActive', false);
          });
        })
        .fail(function () {
          scope.attr('pickerActive', false);
        });
      },

      trigger_upload_parent: function (scope, el, ev) {
        // upload files with a parent folder (audits and workflows)
        var that = this;
        var verifyDfd = $.Deferred();
        var parentFolderDfd;
        var folderInstance = this.folder_instance || this.instance;

        function isOwnFolder(mapping, instance) {
          if (mapping.binding.instance !== instance) {
            return false;
          }
          if (!mapping.mappings ||
              mapping.mappings.length < 1 ||
              mapping.instance === true) {
            return true;
          }
          return can.reduce(mapping.mappings, function (current, mp) {
            return current || isOwnFolder(mp, instance);
          }, false);
        }

        if (scope.attr('verify_event')) {
          GGRC.Controllers.Modals.confirm({
            modal_description: scope.attr('modal_description'),
            modal_confirm: scope.attr('modal_button'),
            modal_title: scope.attr('modal_title'),
            button_view: GGRC.mustache_path +
              '/gdrive/confirm_buttons.mustache'
          }, verifyDfd.resolve);
        } else {
          verifyDfd.resolve();
        }

        verifyDfd.done(function () {
          if (that.instance.attr('_transient.folder')) {
            parentFolderDfd = $.when(
              [{instance: folderInstance.attr('_transient.folder')}]
            );
          } else {
            parentFolderDfd = folderInstance
              .get_binding('extended_folders')
              .refresh_instances();
          }
          can.Control.prototype.bindXHRToButton(parentFolderDfd, el);

          parentFolderDfd.done(function (bindings) {
            var parentFolder;
            if (bindings.length < 1 || !bindings[0].instance.selfLink) {
              // no ObjectFolder or cannot access folder from GAPI
              el.trigger('ajax:flash', {
                warning: 'Can\'t upload: No GDrive folder found'
              });
              return;
            }

            parentFolder = can.map(bindings, function (binding) {
              return can.reduce(binding.mappings, function (current, mp) {
                return current || isOwnFolder(mp, that.instance);
              }, false) ? binding.instance : undefined;
            });
            parentFolder = parentFolder[0] || bindings[0].instance;

            // NB: resources returned from uploadFiles() do not match the
            // properties expected from getting files from GAPI --
            // "name" <=> "title", "url" <=> "alternateLink". Of greater
            // annoyance is the "url" field from the picker differs from the
            // "alternateLink" field value from GAPI: the URL has a query
            // parameter difference, "usp=drive_web" vs "usp=drivesdk". For
            // consistency, when getting file references back from Picker,
            // always put them in a RefreshQueue before using their properties.
            // --BM 11/19/2013
            parentFolder.uploadFiles().then(function (files) {
              that.attr('pending', true);
              return new RefreshQueue().enqueue(files).trigger()
                .then(function (fs) {
                  var mapped = can.map(fs, function (file) {
                    if (
                      !_.includes(_.map(file.parents, 'id'), parentFolder.id)
                    ) {
                      return file.copyToParent(parentFolder);
                    }
                    return file;
                  });
                  return $.when.apply($, mapped);
                });
            }).done(function () {
              var files = can.map(can.makeArray(arguments), function (file) {
                return CMS.Models.GDriveFile.model(file);
              });
              var dfdsDoc = that.handle_file_upload(files);

              $.when.apply($, dfdsDoc).then(function () {
                can.trigger(
                  that, 'modal:success', {arr: can.makeArray(arguments)});
                el.trigger('modal:success', {arr: can.makeArray(arguments)});
                that.attr('pending', false);
              });
            });
          });
        });
      },

      handle_file_upload: function (files) {
        var that = this;
        var dfdsDoc = [];
        var dfd;

        can.each(files, function (file) {
          // Since we can re-use existing file references from the picker,
          // check for that case.
          dfd = CMS.Models.Document.findAll({
            link: file.alternateLink})
          .then(function (docs) {
            var dfdDoc;
            var objectDoc;

            if (docs.length < 1) {
              docs.push(new CMS.Models.Document({
                context: that.instance.context || {id: null},
                title: file.title,
                link: file.alternateLink
              }));
            }
            if (that.deferred || !docs[0].isNew()) {
              dfdDoc = $.when(docs[0]);
            } else {
              dfdDoc = docs[0].save();
            }

            dfdDoc = dfdDoc.then(function (doc) {
              if (that.deferred) {
                that.instance.mark_for_addition('documents', doc, {
                  context: that.instance.context || {id: null}
                });
              } else {
                objectDoc = new CMS.Models.ObjectDocument({
                  context: that.instance.context || {id: null},
                  documentable: that.instance,
                  document: doc
                }).save();
              }

              return objectDoc;
            });
            return dfdDoc;
          });
          dfdsDoc.push(dfd);
        });
        return dfdsDoc;
      }
    },
    events: {
      init: function () {
        if (!this.scope.link_class) {
          this.scope.attr('link_class', 'btn');
        }
        this.scope.attr('pickerActive', false);
      },
      '{scope} modal:success': function (_scope, _event) {
        var instance = this.scope.instance.reify();
        instance.refresh();
      }
    }
  });
})(this.can, this.can.$);
