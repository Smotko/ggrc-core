/*
 * Copyright (C) 2017 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */
(function (can, $) {
  'use strict';

  function attachFiles(files, type, object) {
    return new RefreshQueue().enqueue(files).trigger().then(function (files) {
      can.each(files, function (file) {
        // Since we attach_files can re-use existing file references
        // from the picker, check for that case.
        var link = {link: file.alternateLink};
        CMS.Models.Document.findAll(link).done(function (d) {
          if (d.length) {
            new CMS.Models.Relationship({
              context: object.context || {id: null},
              source: object,
              destination: d[0]
            }).save();
          } else {
            if (type === 'folders') {
              new CMS.Models.ObjectFolder({
                folderable: object,
                folder: file,
                context: object.context || {id: null}
              }).save();
              return;
            }
            // File not found, make Document object.
            new CMS.Models.Document({
              context: object.context || {id: null},
              title: file.title,
              link: file.alternateLink
            }).save().then(function (doc) {
              return $.when([
                new CMS.Models.Relationship({
                  context: object.context || {id: null},
                  source: object,
                  destination: doc
                }).save()
              ]);
            });
          }
        });
      });
    });
  }

  GGRC.Components('gDriveFolderPicker', {
    tag: 'ggrc-gdrive-folder-picker',
    template: can.view(GGRC.mustache_path + '/gdrive/gdrive_folder.mustache'),
    scope: {
      _folder_change_pending: false,
      no_detach: '@',
      deferred: '@',
      tabindex: '@',
      placeholder: '@',
      readonly: '@',
      folder_list: [],
      instance: null,
      /**
       * Helper method for unlinking all object folders currently linked to the
       * given instance.
       *
       * @param {Object} instance - an instance of a model object (e.g Audit) for
       *   which to unlink the object folders from
       * @return {Object} - a deferred object that is resolved when the instance's
       *   object folders have been successfully unlinked from it
       */
      _unlinkObjFolders: function (instance) {
        var deleteDeferred;

        // make sure the object_folders list is up to date, and then delete all
        // existing upload folders currently mapped to the instance
        deleteDeferred = instance.refresh().then(function () {
          var deferredDeletes;
          var objFolders = instance.object_folders;

          // delete folders and collect their deferred delete objects
          deferredDeletes = $.map(objFolders, function (folder) {
            var deferredDestroy = folder
              .reify()
              .refresh()
              .then(function (folderRefreshed) {
                return folderRefreshed.destroy();
              });

            return deferredDestroy;
          });

          return $.when.apply($, deferredDeletes);
        });

        return deleteDeferred;
      },
      _updateCurrentFolder: function () {
        var item = this.instance.get_binding('folders').list[0];
        if (!item && this.instance.get_binding('extended_folders')) {
          item = this.instance.get_binding('extended_folders').list[0];
        }

        this.attr('current_folder', item ? item.instance : null);
      }
    },
    events: {
      setCurrent: function (unsetPending) {
        return function (folders) {
          var folder = folders[0] ? folders[0].instance : null;
          if (unsetPending) {
            this.scope.attr('_folder_change_pending', false);
          }
          this.scope.attr('current_folder', folder);
          this.scope.attr('folder_list').replace(folders);
        }.bind(this);
      },
      setCurrentFail: function (error) {
        this.scope.attr('_folder_change_pending', false);
        this.scope.attr('folder_error', error);
      },
      unsetCurrent: function () {
        this.scope.attr('_folder_change_pending', false);
        this.scope.attr('folder_error', null);
        this.scope.attr('current_folder', null);
      },
      setExtendedFolder: function () {
        // Try to load extended folders if main folder was not found
        if (!this.scope.instance.get_binding('extended_folders') ||
             this.scope.current_folder ||
             this.scope.folder_error) {
          return this.scope.attr('_folder_change_pending', false);
        }
        this.scope.instance.get_binding('extended_folders')
          .refresh_instances()
          .done(this.setCurrent(true))
          .fail(this.setCurrentFail.bind(this));
      },
      inserted: function () {
        var foldersBinding = this.scope.instance.get_binding('folders');

        this.element.removeAttr('tabindex');
        this.scope.attr('_folder_change_pending', true);

        foldersBinding.refresh_instances()
          .then(this.setCurrent(), this.setCurrentFail.bind(this))
          .then(this.setExtendedFolder.bind(this));
      },
      '{scope.instance} change': function (inst, ev, attr) {
        // Error recovery from previous refresh_instances error when we couldn't set up the binding.
        if (!this.scope.folder_error) {
          return;
        }
        this.scope.instance.get_binding('folders')
          .refresh_instances()
          .then(this.setCurrent(true), this.setCurrentFail.bind(this))
          .then(this.setExtendedFolder.bind(this));
      },
      '{scope.folder_list} change': function () {
        var pjlength;

        this.scope._updateCurrentFolder();
        if (this.scope.deferred && this.scope.instance._pending_joins) {
          pjlength = this.scope.instance._pending_joins.length;
          can.each(this.scope.instance._pending_joins.slice(0).reverse(), function (pj, i) {
            if (pj.through === 'folders') {
              this.scope.instance._pending_joins.splice(pjlength - i - 1, 1);
            }
          }, this);
        }
      },

      '{scope.instance} object_folders': function () {
        this.scope._updateCurrentFolder();
      },

      /**
       * Handle a click on the button for detaching an upload folder from
       * a model instance (e.g. an Audit).
       *
       * @param {Object} el - The jQuery-wrapped DOM element on which the event
       *   has been triggered.
       * @param {Object} ev - The event object.
       */
      'a[data-toggle=gdrive-remover] click': function (el, ev) {
        var scope = this.scope,
          dfd;

        if (scope.deferred) {
          if (scope.current_folder) {
            scope.instance.mark_for_deletion('folders', scope.current_folder);
          } else if (scope.folder_error && !scope.instance.object_folders) {
            // If object_folders are not defined for this instance the error
            // is from extended_folders, we just need to clear folder_error
            // in this case.
            scope.attr('folder_error', null);
          } else {
            can.each(scope.instance.object_folders.reify(), function (object_folder) {
              object_folder.refresh().then(function (of) {
                scope.instance.mark_for_deletion('object_folders', of);
              });
            });
          }
          dfd = $.when();
        } else {
          dfd = scope._unlinkObjFolders(scope.instance);
        }

        dfd.then(function () {
          if (scope.instance.get_binding('extended_folders')) {
            $.when(
              scope.instance.get_binding('folders').refresh_instances(),
              scope.instance.get_binding('extended_folders').refresh_instances()
            ).then(function (local_bindings, extended_bindings) {
              var self_folders, remote_folders;
              self_folders = can.map(local_bindings, function (folder_binding) {
                return folder_binding.instance;
              });
              remote_folders = can.map(extended_bindings, function (folder_binding) {
                return ~can.inArray(folder_binding.instance, self_folders) ? undefined : folder_binding.instance;
              });

              scope.attr('current_folder', remote_folders[0] || null);
            });
          } else {
            scope.attr('current_folder', null);
          }

          scope.attr('folder_error', null);
        });
      },

      'a[data-toggle=gdrive-picker] click': function (el, ev) {
        var dfd = GGRC.Controllers.GAPI.authorize(['https://www.googleapis.com/auth/drive']);
        var folder_id = el.data('folder-id');

        // Create and render a Picker object for searching images.
        function createPicker() {
          window.oauth_dfd.done(function (token, oauth_user) {
            var dialog;
            var view;
            var docsUploadView;
            var docsView;
            var picker = new google.picker.PickerBuilder()
                  .setOAuthToken(gapi.auth.getToken().access_token)
                  .setDeveloperKey(GGRC.config.GAPI_KEY)
                  .setCallback(pickerCallback);

            if (el.data('type') === 'folders') {
              view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
                .setMimeTypes(['application/vnd.google-apps.folder'])
                .setSelectFolderEnabled(true);
              picker.setTitle('Select folder');
              picker.addView(view);
            } else {
              docsUploadView = new google.picker.DocsUploadView()
                .setParent(folder_id);
              docsView = new google.picker.DocsView()
                .setParent(folder_id);

              picker.addView(docsUploadView)
                .addView(docsView)
                .enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
            }
            picker = picker.build();
            picker.setVisible(true);
            // use undocumented fu to make the Picker be "modal"
            // this is the "mask" displayed behind the dialog box div
            $('div.picker-dialog-bg').css('zIndex', 4000);  // there are multiple divs of that sort
            // and this is the dialog box modal div, which we must display on top of our modal, if any

            dialog = GGRC.Utils.getPickerElement(picker);
            if (dialog) {
              dialog.style.zIndex = 4001; // our modals start with 2050
            }
          });
        }

        function pickerCallback(data) {
          var files;
          var model;
          var PICKED = google.picker.Action.PICKED;
          var ACTION = google.picker.Response.ACTION;
          var DOCUMENTS = google.picker.Response.DOCUMENTS;
          var CANCEL = google.picker.Action.CANCEL;

          if (data[ACTION] === PICKED) {
            if (el.data('type') === 'folders') {
              model = CMS.Models.GDriveFolder;
            } else {
              model = CMS.Mdoels.GDriveFile;
            }
            files = model.models(data[DOCUMENTS]);
            el.trigger('picked', {
              files: files
            });
          } else if (data[ACTION] === CANCEL) {
            el.trigger('rejected');
          }
        }

        dfd.fail(this.unsetCurrent.bind(this))
          .done(function () {
            gapi.load('picker', {
              callback: createPicker
            });
          });
      },

      /*
       * Handle an event of the user picking a new GDrive upload folder.
       *
       * @param {Object} el - The jQuery-wrapped DOM element on which the event
       *   has been triggered.
       * @param {Object} ev - The event object.
       * @param {Object} data - Additional event data.
       *   @param {Array} data.files - The list of GDrive folders the user picked
       *     in the GDrive folder picker modal.
       */
      '.entry-attachment picked': function (el, ev, data) {
        var dfd;
        var files = data.files || [];
        var scope = this.scope;

        if (el.data('type') === 'folders' &&
            files.length &&
            files[0].mimeType !== 'application/vnd.google-apps.folder'
        ) {
          $(document.body).trigger('ajax:flash', {
            error: 'ERROR: Something other than a Drive folder was chosen for a folder slot.  Please choose a folder.'
          });
          return;
        }

        this.scope.attr('_folder_change_pending', true);
        if (!el.data('replace')) {
          dfd = $.when();
        } else if (scope.deferred) {
          if (scope.current_folder) {
            scope.instance.mark_for_deletion('folders', scope.current_folder);
          } else if (scope.folder_error && !scope.instance.object_folders) {
            // If object_folders are not defined for this instance the error
            // is from extended_folders, we just need to clear folder_error
            // in this case.
            scope.attr('folder_error', null);
          } else {
            can.each(scope.instance.object_folders.reify(), function (object_folder) {
              object_folder.refresh().then(function (of) {
                scope.instance.mark_for_deletion('object_folders', of);
              });
            });
          }
          dfd = $.when();
        } else {
          dfd = scope._unlinkObjFolders(scope.instance);
        }

        dfd
        .always(function () {
          this.scope.attr('_folder_change_pending', false);
        }.bind(this))
        .then(function () {
          if (scope.deferred) {
            return $.when.apply($,
              can.map(files, function (file) {
                scope.instance.mark_for_addition('folders', file);
                return file.refresh();
              })
            );
          }
          return attachFiles(files, el.data('type'), scope.instance);
        })
        .then(function () {
          scope.attr('folder_error', null);
          scope.attr('current_folder', files[0]);
          if (scope.deferred && scope.instance._transient) {
            scope.instance.attr('_transient.folder', files[0]);
          }
        })
        .fail(this.setCurrentFail.bind(this));
        return dfd;
      }
    }
  });
})(this.can, this.can.$);
