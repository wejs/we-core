/**
 * We.js client side lib
 */

(function () {

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

    if (window.WE_BOOTSTRAP_CONFIG) {
      this.config = window.WE_BOOTSTRAP_CONFIG;
    }

    this.element = $('body');

    var regions = document.querySelectorAll('div[data-we-region]');

    for (var i = 0; i < regions.length; i++) {
      we.structure.regions[regions[i].id] = window.$(regions[i]);
    }

    this.setElementEvents();
    //this.handlerErrorMessage();

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
        we.events.emit('model-update', 'widget', r.widget);
      });
    });

    we.events.on('model-update', self.model.liveUpdate);
    we.events.on('model-delete', self.model.liveDelete);
  },
  handleWeElementEvent: function (e) {
    e.preventDefault();

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
  utils: {
    /**
     * Sanitize user input htmls, use before add any user text content
     *
     * @param  {String} str
     * @return {String}     Safe text to add in html
     */
    sanitize: function sanitize(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  }
};

we.router = {
  currentRoute: null,
  firstRoute: true,
  bindPartialRoute: function (ctx) {
    var url;
    // set skipHTML query param
    if (ctx.path.indexOf('?') > -1) {
      url = ctx.path + '&skipHTML=true';
    } else {
      url = ctx.path + '?skipHTML=true';
    }

    $('#we-layout').load(url, function(){
      $('html, body').animate({ scrollTop: 0 }, 0);
    });
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
      return {
        'data': $(e).attr('we-model-attr'),
        'type': $(e).attr('data-type')
      };
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
            if (data) {
              if (colName.type == 'date') {
                data = window.moment(data).format('L hh:mm');
              }

              return data;
            }
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
  tableDrag: function tableDrag(selector, options) {
    if (!options) options =  {
      weight: {fieldClass: 'row-weight', hidden: true },
      parent: {
        fieldClass: 'row-parent',
        sourceFieldClass: 'id',
        hidden: true
      },
      group: {
        fieldClass: 'row-depth',
        depthLimit: 1
      }
    };
    $(selector).tableDrag(options);
  },
  metisMenu: function metisMenu(selector, options) {
    if (!options)
      options = {};

    $(selector).metisMenu(options);
  },
  // select with query.where params
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
            where[searchField] = params.term;

            var query = {
              limit: limit,
              responseType: 'json'
            };

            $.extend(query, where);

            return query;
          },
          processResults: processResults
        };
      }
      element.select2(configs);
    }
  },
  // select with query params
  selectQuery: {
    init: function(selector, opts) {
      if (!opts) opts = {};
      var element = $(selector);
      var url = (opts.url || element.attr('we-select-url'));
      var model = element.attr('we-select-model');
      var searchField = (opts.searchField || 'text');
      var limit = (opts.limit || 25);

      if (!opts) opts = {};

      var configs = {
        formatResult: function formatResult(item) {
          return item.text;
        },
        minimumInputLength: (opts.minimumInputLength || 3)
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
            var query = {
              limit: limit,
              responseType: 'json'
            };

            query[searchField] = params.term;
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

})();