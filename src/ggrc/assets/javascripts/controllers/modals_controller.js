(function(can, $) {

can.Control("GGRC.Controllers.Modals", {
  BUTTON_VIEW_DONE : GGRC.mustache_path + "/modals/done_buttons.mustache"
  , BUTTON_VIEW_CLOSE : GGRC.mustache_path + "/modals/close_buttons.mustache"
//  BUTTON_VIEW_SAVE
  , BUTTON_VIEW_SAVE_CANCEL : GGRC.mustache_path + "/modals/save_cancel_buttons.mustache"
//  BUTTON_VIEW_SAVE_CANCEL_DELETE

  , defaults : {
    content_view : GGRC.mustache_path + "/help/help_modal_content.mustache"
    , header_view : GGRC.mustache_path + "/modals/modal_header.mustache"
    , button_view : null
    , model : null
    , new_object_form : false
    , find_params : {}
  }

  , init : function() {
    this.defaults.button_view = this.BUTTON_VIEW_DONE;
  }
}, {
  init : function() {
    this.options.$header = this.element.find(".modal-header");
    this.options.$content = this.element.find(".modal-body");
    this.options.$footer = this.element.find(".modal-footer");
    this.on();
    this.fetch_all();
  }

  , fetch_templates : function(dfd) {
    var that = this;
    dfd = dfd ? dfd.then(function() { return that.options; }) : $.when(this.options);
    return $.when(
      can.view(this.options.content_view, dfd)
      , can.view(this.options.header_view, dfd)
      , can.view(this.options.button_view, dfd)
    ).done(this.proxy('draw'));
  }

  , fetch_data : function(params) {
    var that = this;
    var dfd;
    if(this.options.model) {
      dfd = this.options.new_object_form
          ? new $.Deferred().resolve(new this.options.model(params || this.find_params()))
          : this.options.model.findOne(params || this.find_params());
    } else {
      dfd = new $.Deferred().resolve(params || this.find_params());
    }
    return dfd.done(function(h) {
      that.options.instance = h;
    });
  }

  , fetch_all : function() {
    return this.fetch_templates(this.fetch_data(this.find_params()));
  }

  , find_params : function() {
    return this.options.find_params;
  }

  , draw : function(content, header, footer) {
    header != null && this.options.$header.find("h2").html(header);
    content != null && this.options.$content.html(content).removeAttr("style");
    footer != null && this.options.$footer.html(footer);

    this.options.$content.find("input:first").focus();

    this.element.find('.wysihtml5').each(function() {
      $(this).cms_wysihtml5();
    });
  }
  , "input, textarea, select change" : function(el, ev) {
    this.options.instance.attr(el.attr("name"), el.val());
  }

  , "{$footer} a.btn[data-toggle='modal-submit']:not(.disabled) click" : function(el, ev) {
    var instance = this.options.instance;
    var that = this;
    if(!(instance instanceof this.options.model)) {
      instance = this.options.instance
               = new this.options.model(instance && instance.serialize ? instance.serialize() : instance);
    }
    can.each(this.options.$content.find("form").serializeArray(), function(item) {
      instance.attr(item.name, item.value);
    });

    var ajd = instance.save().done(function() {
      that.element.modal_form("hide");
    }).fail(function(xhr, status) {
      var error = xhr.getResponseHeader("X-Flash-Error")
      , tmpl = '<div class="alert alert-error"><a href="#" class="close" data-dismiss="alert">x</a><span>'
        + error
        + '</span></div>';

      that.options.$content.find(".flash").length || that.options.$content.prepend("<div class='flash'>");

      error && that.options.$content.find(".flash").append(tmpl);
    });
  }
});

})(window.can, window.can.$);