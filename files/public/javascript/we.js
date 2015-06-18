/**
 * We.js client side lib
 */

(function (window, page) {
  var we = {
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

      // partial page loader
      this.router.loadRoutes().then(function (r){
        if (self.isAdmin) {
          self.router.bindPartialAdminRoutes(r);
        } else {
          self.router.bindPartialRoutes(r);
        }

        setTimeout(function(){ page({ hashbang: false }); }, 200);
      });

      if (location.pathname.substring(0, 6) === '/admin') this.isAdmin = true;

      cb();
    },
    router: {
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
      },
    },
    structure: {
      regions: {},
      emptyWidgets: function emptyWidgets() {
        for (var i = 0; i < we.structure.regions.length; i++) {
          // empty all regions
          we.structure.regions[i].html('');
        }
      },
      reloadWidgets: function reloadWidgets(ctx) {
        var region;
        console.log('ctx>', ctx);

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

      // - create widget form
      $('body').on('submit', 'form[name=layout-widget-selector]', function (event) {
        event.preventDefault();

        var form = $(this);

        var modalForm = $('#AddWidgetFormModal');
        if (!modalForm) return;
        // modalForm.modal('show');
        var url = '/api/v1/widget-form/' + form.find('input[name=theme]').val();
        url += '/' + form.find('input[name=layout]').val();
        url += '/' + form.find('input[name=type]').val();
        url += '?regionName=' + form.find('select').val();

        $.get(url).then(function (f) {
          modalForm.find('.modal-body').html(f);
          modalForm.modal('show');

          modalForm.find('form').submit(function( event ) {
            event.preventDefault();
            var formData = {};

            modalForm.find('form').serializeArray().forEach(function (d) {
              formData[d.name] = d.value;
            });

            $.post('/api/v1/widget?responseType=json', formData).then(function () {
              modalForm.modal('hide');
              // reload widgets page TODO change to insert new item un widget table
              page(location.pathname);
            });
          });
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

    model: {
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

  // window.addEventListener('WebComponentsReady', function() {
  //   var app = document.querySelector('#app');

  //   // set admin base path
  //   page.base('/admin');

  //   // We use Page.js for routing. This is a Micro
  //   // client-side router inspired by the Express router
  //   // More info: https://visionmedia.github.io/page.js/
  //   page('*', function (ctx, next) {
  //     console.log('transition start [');

  //     app.isHomePage = false;
  //     ctx.pageContent = '';

  //     next();
  //   });

  //   page('/', function (ctx, next) {
  //     app.route = 'home';
  //     ctx.pageContent = '<wejs-static-home-page></wejs-static-home-page>';
  //     ctx.fullLayout = true;

  //     var url = '/public/project/client/admin/styles/test.json';
  //     ctx.model = $.get(url).then(function (r) {
  //       ctx.data = r;
  //       next();
  //     }).fail(function(err,x ){
  //       console.error('err', x)
  //     })
  //   });

  //   page('/docs/:project', function (ctx, next) {
  //     app.route = 'wejsdocs.'+ctx.params.project;
  //     var url = '/docs/'+ ctx.params.project;

  //     ctx.model = $.get(url).then(function (r) {
  //       ctx.pageContent = r.html;
  //       next();
  //     })
  //   });

  //   page('/docs/:project/:file', function (ctx, next) {
  //     app.route = 'wejsdocs.'+ctx.params.project + '.' + ctx.params.file;

  //     var url = '/docs/'+ ctx.params.project + '/' + ctx.params.file;
  //     ctx.model = $.get(url).then(function (r) {
  //       ctx.pageContent = r.html;
  //       next();
  //     });
  //   });

  //   // page('/admin/user', function (ctx, next) {
  //   //   app.route = 'users';
  //   //   next();
  //   // });

  //   // page('/admin/user/:id', function (ctx, next) {
  //   //   app.route = 'user-info';
  //   //   app.params = ctx.params;

  //   //   next();
  //   // });

  //   page('*', function (ctx) {

  //     // if (!document.querySelector('#content')) return console.log('] transition done');
  //     // if (ctx.fullLayout) {
  //     //   document.querySelector('#content').innerHTML = ctx.pageContent;
  //     // } else {
  //     //   document.querySelector('#content').innerHTML =
  //     //     '<section><paper-material elevation="0">' +
  //     //       ctx.pageContent +
  //     //     '</paper-material></section>';
  //     // }

  //     we.structure.reloadWidgets(ctx);

  //     console.log('] transition done');
  //   });

  //   page({
  //     hashbang: false
  //   });
  // });

  // // See https://github.com/Polymer/polymer/issues/1381
  // window.addEventListener('WebComponentsReady', function() {
  //   document.querySelector('body').removeAttribute('unresolved');
  //   // Grab a reference to our auto-binding template
  //   // and give it some initial binding values
  //   // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  //   var app = document.querySelector('#app');

  //   /**
  //    * Add Accept header in all request
  //    */
  //   $.ajaxPrefilter(function( options ) {
  //     if ( !options.beforeSend) {
  //       options.beforeSend = function (xhr) {
  //         xhr.setRequestHeader('Accept', 'application/json');
  //         // set auth token
  //         if (app.auth && app.auth.token)
  //           xhr.setRequestHeader('Authorization','Bearer ' + app.auth.token);
  //       };
  //     }
  //   });

  //   // $.ajaxSetup({ data: { responseType: 'json' } });

  //   // var loadMenu = $.get('/api/v1/docs/we/menu').then(function(r) {
  //   //   app.docMenu = r.menu;
  //   //   app.docPreloadedPages = app.docMenu.links.map(function (d){
  //   //     return d.url + '?responseType=json';
  //   //   });
  //   //   app.docMenu.links.forEach(function (d) {
  //   //     app.docPreloadedPages.push(d.url);
  //   //   });
  //   //   app.docPreloadedPages.push('/');
  //   // });
  // });

  window.we = we;
})(window, window.page);