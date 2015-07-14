/**
 * We.js client side lib
 */

(function (window, page) {

if ($.timepicker) {
  $.datepicker.setDefaults($.timepicker.regional[window.WE_BOOTSTRAP_CONFIG.locale]);
  $.timepicker.setDefaults($.timepicker.regional[window.WE_BOOTSTRAP_CONFIG.locale]);
}

var we = {
  autoInitialize: true,
  config: {},
  element: null,
  isAdmin: false,
  initialize: function initialize(cb) {
    if (!cb) cb = function(){};
    var self =  this;

    if (window.WE_BOOTSTRAP_CONFIG) {
      this.config = window.WE_BOOTSTRAP_CONFIG;
    }

    this.element = $('body');

    var regions = document.querySelectorAll('we-region');

    for (var i = 0; i < regions.length; i++) {
      we.structure.regions[regions[i].id] = window.$(regions[i]);
    }

    this.setElementEvents();
    //this.handlerErrorMessage();

    if (we.config.client.publicVars.dynamicLayout) {
      // partial page loader
      this.router.loadRoutes().then(function (r){
        if (self.isAdmin) {
          self.router.bindPartialAdminRoutes(r);
        } else {
          self.router.bindPartialRoutes(r);
        }

        setTimeout(function(){ page({ hashbang: false }); }, 200);
      });
    }

    if (location.pathname.substring(0, 6) === '/admin') this.isAdmin = true;

    cb();
  },
  setElementEvents: function setElementEvents() {
    var self = this;
    // we.js button event
    $('body').on('click', 'button[we-action=event]', we.handleWeElementEvent);
    $('body').on('click', 'a[we-action=event]', we.handleWeElementEvent);

    // - form submit feature
    $('body').on('submit', 'form[we-submit=ajax]', function (event) {
      event.preventDefault();

      var form = $(this);
      var formData = {};
      form.serializeArray().forEach(function (d) {
        formData[d.name] = d.value;
      });

      var url = form.attr('action');

      $.ajax({
        url: url + '?responseType=json',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(formData)
      }).then(function (r) {
        // TODO change "widget" model name to current form model name
        we.events.emit('model-update', 'widget', r.widget);
      });
    });

    // - update widget form
    we.events.on('update-widget-modal', function (event, element) {
      var modalForm = $('#updateWidgetFormModal');
      var id = element.attr('model-id');

      if (!id) return console.warn('data-id attribute is required for data-we-action');

      modalForm.modal('show');

      var url = '/api/v1/widget/'+id+'/form';
      $.get(url).then(function (f) {
        modalForm.find('.modal-body').html(f);

        modalForm.find('form').submit(function( event ) {
          event.preventDefault();
          var formData = {};

          modalForm.find('form').serializeArray().forEach(function (d) {
            formData[d.name] = d.value;
          });

          $.ajax({
            url: '/api/v1/widget/'+id+'?responseType=json',
            method: 'PUT',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(formData)
          }).then(function (r) {
            we.events.emit('model-update', 'widget', r.widget);
            modalForm.modal('hide');
          });
        });
      });
    });

    // -delete widgets
    we.events.on('model-delete-widget', function(event, element){
      var id = element.attr('model-id');

      if (confirm('Are you sure you want to delete this content?')) {
        if(!id) return;

        $.ajax({
          url: '/api/v1/widget/'+id+'?responseType=json',
          method: 'delete',
          contentType: 'application/json; charset=utf-8'
        }).then(function (r) {
          we.events.emit('model-update-after', 'widget', r);
          $('[model-widget='+id+']').remove();
        });
      }

    });

    we.events.on('model-update', self.model.liveUpdate);
    we.events.on('model-delete', self.model.liveDelete);

  },
  handleWeElementEvent: function (e) {
    event.preventDefault();

    var element = $(e.target);
    var weEvent = element.attr('event');

    if (!weEvent)
      return console.warn('data-event attribute is required for data-event handler', e);
    we.events.emit(weEvent, element, e);
  },

  get: function(obj, path, def) {
    /**
     * Retrieve nested item from object/array
     * @param {Object|Array} obj
     * @param {String} path dot separated
     * @param {*} def default value ( if result undefined )
     * @returns {*}
     */
    var i, len;
    for(i = 0,path = path.split('.'), len = path.length; i < len; i++){
      if(!obj || typeof obj !== 'object') return def;
      obj = obj[path[i]];
    }
    if(obj === undefined) return def;
    return obj;
  },
  utils: {}
};

we.structure = {
  regions: {},
  openWidgetForm: function openWidgetForm(event) {
    event.preventDefault();

    var form = $(event.target);

    var modalForm = $('#AddWidgetFormModal');
    if (!modalForm) return;

    var url = '/api/v1/widget-form/' + form.find('input[name=theme]').val();
    url += '/' + form.find('input[name=layout]').val();
    url += '/' + form.find('input[name=type]').val();
    url += '?regionName=' + form.find('select').val();

    var wc = form.find('input[name=context]').val();
    if (wc) url += '&context=' + wc;

    $.get(url).then(function (f) {
      modalForm.find('.modal-body').html(f);
      modalForm.modal('show');

      modalForm.find('form').submit(function( event ) {
        event.preventDefault();
        var formData = {};

        modalForm.find('form').serializeArray().forEach(function (d) {
          formData[d.name] = d.value;
        });

        var url = form.attr('we-form-widget-url');
        if (!url) url = '/api/v1/widget';

        $.post(url+'?responseType=json', formData).then(function () {
          modalForm.modal('hide');
          // reload widgets page TODO change to insert new item un widget table
          location.reload();
        });
      });
    });
  },
  emptyWidgets: function emptyWidgets() {
    for (var i = 0; i < we.structure.regions.length; i++) {
      // empty all regions
      we.structure.regions[i].html('');
    }
  },
  reloadWidgets: function reloadWidgets(ctx) {
    var region;
    we.structure.emptyWidgets();

    if (ctx.data && ctx.data.meta && ctx.data.meta.layout && ctx.data.meta.layout.regions) {
      for (var regionName in ctx.data.meta.layout.regions) {
        if (!we.structure.regions[regionName]) continue;

        var regionElement = we.structure.regions[regionName];

        region = ctx.data.meta.layout.regions[regionName];
        for (var i = 0; i < region.widgets.length; i++) {
          regionElement.append( we.structure.buildWidget(region.widgets[i]) );
        }
      }
    }
  },
  buildWidget: function buildWidget(widget) {
    var html = '<' +widget.component;
    if (widget.attributes) {
      html += we.structure.buildWidgetAttributes(widget.attributes)
    }
    html += '>';
    if (widget.content) {
      html += widget.content;
    }
    html += '</' +widget.component+ '>';
    return html;
  },
  buildWidgetAttributes: function buildWidgetAttributes(attrs) {
    var text = '';
    for(var attr in attrs) {
      text += ' ' + attr + '="' +attrs[attr]+ '" ';
    }
    return text;
  }
};

we.router = {
  currentRoute: null,
  firstRoute: true,
  loadRoutes: function() {
    return $.get('/api/v1/routes');
  },
  bindPartialRoutes: function(routes) {
    for (var url in routes) {
      if (url.substring(0, 6) !== '/admin') {
        routes[url].url = url;
        page(url, we.router.bindPartialRoute.bind(routes[url]));
      }
    }
  },
  bindPartialRoute: function (ctx) {
    if (we.router.firstRoute) {
      we.router.firstRoute = false; return;
    }
    $('layout').load(ctx.path + '?skipHTML=true', function(){
      $('html, body').animate({ scrollTop: 0 }, 0);
    });
  },
  bindPartialAdminRoutes: function(routes) {
    for(var url in routes) {
      if (url.substring(0, 6) === '/admin') {
        routes[url].url = url;
        page(url, we.router.bindPartialRoute.bind(routes[url]));
      }
    }
  }
};

we.model = {
  liveUpdate: function liveUpdate(event, modelName, data) {
    if (!modelName || !data) return console.warn('model-update event called without modelName or data');
    if ($.isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        we.model.updateATTR(modelName, data[i]);
      }
    } else if (typeof data === 'object') {
      we.model.updateATTR(modelName, data);
    }
  },
  updateATTR: function updateATTR(modelName, data) {
    var attrS = 'model-'+modelName+'-'+ data.id;
    $('bind['+attrS+']').each(function (i, e) {
      $(e).text(we.get(data, $(e).attr(attrS)));
    });
    $('bind-html['+attrS+']').each(function (i, e) {
      $(e).html(we.get(data, $(e).attr(attrS)));
    });
  },

  liveDelete: function liveDelete(event, element) {
    console.warn('TODO delete model with id: ', element.attr('model-id'));
  }
};
// - We.js object event class
we.Event = function WeEvent(){ this._listeners = {}; };
we.Event.prototype = {
  constructor: we.Event,
  on: function on(type, listener) {
    if (typeof this._listeners[type] == 'undefined') this._listeners[type] = [];
    this._listeners[type].push(listener);
  },
  emit: function emit(event) {
    if (typeof event == 'string') event = { type: event };
    if (!event.target) event.target = this;
    if (!event.type)  throw new Error('Event object missing "type" property.');

    if (this._listeners[event.type] instanceof Array) {
      var listeners = this._listeners[event.type];
      for (var i=0, len=listeners.length; i < len; i++){
        listeners[i].apply(this, arguments);
      }
    }
  },
  off: function off(type, listener) {
    if (this._listeners[type] instanceof Array){
      var listeners = this._listeners[type];
      for (var i=0, len=listeners.length; i < len; i++){
        if (listeners[i] === listener){
          listeners.splice(i, 1);
          break;
        }
      }
    }
  }
};
// -- we.js events
we.events = new we.Event();

we.admin = {};
we.admin.layouts = {
  widgetTableSorter: function widgetTableSorter (selector) {
    if (!selector) selector = '.sorted_table > tbody';

    var sortableList = $(selector);
    // Sortable rows
    sortableList.sortable({
      update: function( event, ui ) {
        saveOrder(this)
      }
    });
    function saveOrder(tbody) {
      var widgets = [];
      var list = $(tbody).children('tr');

      for (var i = 0; i < list.length; i++) {
        widgets.push({
          id: $(list[i]).attr('model-id'), weight: i
        });

        $(list[i]).attr('data-weight', i);
      }

      $.ajax({
        url: '/api/v1/widget-sort?responseType=json',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ widgets: widgets })
      }).done(function(r) {
        console.log('Done sort widgets', r);
      });
    }
  }
}
we.admin.permission = {
  liveUpdate: function(selector) {
    $(selector).on('change', 'input[type="checkbox"]', function() {
      var checked = this.checked;
      var element = this;

      var input = $(this);

      var roleName = input.attr('role-name');
      var permissionName = input.attr('permission-name');

      if (checked) {
        we.admin.permission.addPermission(roleName, permissionName)
        .fail(function () {
          element.checked = !checked;
        });
      } else {
        we.admin.permission.removePermission(roleName, permissionName)
        .fail(function () {
          element.checked = !checked;
        });
      }
    });
  },
  addPermission: function(roleName, permissionName) {
    return $.ajax({
      url: '/admin/role/'+roleName+'/permissions/' + permissionName+ '?responseType=json',
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json; charset=utf-8'
    });
  },
  removePermission: function(roleName, permissionName) {
    return $.ajax({
      url: '/admin/role/'+roleName+'/permissions/' + permissionName+ '?responseType=json',
      method: 'delete',
      dataType: 'json',
      contentType: 'application/json; charset=utf-8'
    });
  }
}

we.components = {
  dataTable: function dataTable(selector, opts) {
    var table = $(selector);
    if (!opts) opts = {};
    var where = ( opts.where || {} );

    var url = table.attr('we-dataTable-url');
    var isAjax = Boolean(url);

    var colNames = table.find('thead th').map(function (i, e) {
      return { 'data': $(e).attr('we-model-attr') };
    });

    var config = {
      'processing': isAjax,
      'serverSide': isAjax,
      'columns': colNames,
      // fix datable null errors
      'aoColumns': colNames.map(function(i, colName){
        return { 'mData': colName.data, mRender: function (data, d,record) {
          if (colName.data == 'weModelActions') {
            if (opts.actionRender) {
              return opts.actionRender(table, data, d,record);
            } else {
              return '';
            }
          } else {
            if (data) return data;
            return '';
          }
        }};
      })
    };

    if (Boolean(url)) {
      config.ajax = {
        url: url,
        data: function (d) {
          // change order to be like we.js query api order
          if (d.order) {
            d.order = colNames[d.order[0].column].data + ' ' + d.order[0].dir;
          }
          // set where search param
          if (d.search) {
            d.where = {};
            // set search field
            if (d.search.value) {
              d.where[table.attr('we-search-field')] = {
                like: '%' + d.search.value + '%'
              };
            }
            // use current instance where
            $.extend(d.where, where);
            // we.js where requires stringifyed where
            d.where = JSON.stringify(d.where);
            // remove default  search param
            delete d.search;
          }
          // limit
          d.limit = d.length;
          delete d.length;
          // offset
          d.offset  = d.start;
          delete d.start;
          // we.js data table response type
          d.responseType = 'datatable';
        }
      };
    }

    table.dataTable(config);
  },
  tableDrag: function tableDrag(selector){
    $(selector).tableDrag();
  },
  editor: {
    styles: {
      small: [
        ['font', ['bold', 'italic', 'underline', 'clear']]
      ],
      medium: [
        ['font', ['bold', 'italic', 'underline', 'clear']],
        ['para', [ 'ul','ol', 'paragraph' ]], ['style', ['style']],
        ['insert', ['link', 'picture', 'video']],
        ['misc', ['fullscreen', 'help']]
      ]
    },
    init: function(selector, style) {
      var element = $(selector);
      var cfg = {
        lang: we.config.locale,
        height: element.attr('we-editor-height'),
        minHeight: element.attr('we-editor-minheight'),
        maxHeight: element.attr('we-editor-maxheight'),
        focus: element.attr('we-editor-focus')
      };
      // - set we-editor flag to use in form submit
      element.attr('we-editor', 'true');

      // get style config from we-editor-style atribute
      if (!style) style = (element.attr('we-editor-style') || 'medium');
      // add editor toobar config if style not is full
      if (style !== 'full') cfg.toolbar = we.components.editor.styles[style];

      element.summernote(cfg);
    }
  },

  select: {
    init: function(selector, opts) {
      if (!opts) opts = {};
      var element = $(selector);
      var url = (opts.url || element.attr('we-select-url'));
      var model = element.attr('we-select-model');
      var where = (opts.where || {});
      var searchField = (opts.searchField || 'text');
      var limit = (opts.limit || 25);

      if (!opts) opts = {};

      var configs = {
        formatResult: function formatResult(item) {
          return item.text;
        }
      }

      var processResults = opts.processResults;
      if (!processResults) {
        processResults = function (data, params) {
          if (opts.tags) {
            if (data[model]) data[model].unshift( {
              text: params.term, id: params.term
            });
            return { results: data[model]};
          } else {
            return { results: data[model]};
          }
        }
      }

      configs.tokenSeparators = [';'];
      configs.multiple = (element.attr('multiple') || false);

      $.extend(configs, opts);
      if (url) {
        configs.ajax = {
          url: url,
          dataType: 'json',
          delay: 400,
          cache: opts.cache,
          data: function (params) {
            var qwhere = {};
            qwhere[searchField] = { like: params.term + '%' };

            $.extend(qwhere, where);

            var query = {
              where: JSON.stringify(qwhere),
              limit: limit,
              responseType: 'json'
            };
            return query;
          },
          processResults: processResults
        };
      }

      element.select2(configs);
    }
  }
};

we.message = {
  newMessage: function newMessage(status, message) {
    $('form[we-submit="ajax"] > fieldset').fadeIn('slow', function() {
      $(this).append('<div data-dismiss="alert" aria-label="Close" class="alert alert-' + status + '">'+
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>'+
        message + '</div>'
      );
    });
  },

  closeMessage: function closeMessage(obj) {
    setTimeout(function() {
       $('message').fadeOut('slow', function() {
        $(this).remove();
       });
    }, 3000);
  }
};

/**
 * Intercept all requests error and display the messages attr
 */
//$(window.document).ajaxComplete(function(e, xhr, settings)
$(window.document).ajaxError(function(e, xhr) {
  if (xhr.responseJSON && xhr.responseJSON.messages) {
    for(var i = 0; i < xhr.responseJSON.messages.length; i++) {
      var msg = xhr.responseJSON.messages[i];
      we.message.closeMessage(we.message.newMessage(msg.status, msg.message))
    }
  }
});

window.we = we;

// auto initialize
$(function(){
  if(we.autoInitialize) we.initialize();
});

})(window, window.page);