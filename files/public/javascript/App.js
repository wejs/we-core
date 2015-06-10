(function (window, page) {
  var App = {
    config: {},
    initialize: function initialize(cb) {
      if (!cb) cb = function(){};

      if (window.WE_BOOTSTRAP_CONFIG) {
        this.config = window.WE_BOOTSTRAP_CONFIG;
      }

      var regions = document.querySelectorAll('we-region');

      for (var i = 0; i < regions.length; i++) {
        App.structure.regions[regions[i].id] = window.$(regions[i]);
      }

      cb();
    },

    structure: {
      regions: {},

      emptyWidgets: function() {
        for (var i = 0; i < App.structure.regions.length; i++) {
          // empty all regions
          App.structure.regions[i].html('');
        }
      },
      reloadWidgets: function reloadWidgets(ctx) {
        var region;
        console.log('ctx>', ctx);

        App.structure.emptyWidgets();

        if (ctx.data && ctx.data.meta && ctx.data.meta.layout && ctx.data.meta.layout.regions) {
          for (var regionName in ctx.data.meta.layout.regions) {
            if (!App.structure.regions[regionName]) continue;

            var regionElement = App.structure.regions[regionName];

            region = ctx.data.meta.layout.regions[regionName];
            for (var i = 0; i < region.widgets.length; i++) {
              regionElement.append( App.structure.buildWidget(region.widgets[i]) );
            }
          }
        }
      },

      buildWidget: function buildWidget(widget) {
        var html = '<' +widget.component;

        if (widget.attributes) {
          html += App.structure.buildWidgetAttributes(widget.attributes)
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
    }
  };

  window.addEventListener('WebComponentsReady', function() {
    var app = document.querySelector('#app');

    // set admin base path
    page.base('/admin');

    // We use Page.js for routing. This is a Micro
    // client-side router inspired by the Express router
    // More info: https://visionmedia.github.io/page.js/
    page('*', function (ctx, next) {
      console.log('transition start [');

      app.isHomePage = false;
      ctx.pageContent = '';

      next();
    });

    page('/', function (ctx, next) {
      app.route = 'home';
      ctx.pageContent = '<wejs-static-home-page></wejs-static-home-page>';
      ctx.fullLayout = true;

      var url = 'http://wejs.dev/public/project/client/admin/styles/test.json';
      ctx.model = $.get(url).then(function (r) {
        ctx.data = r;
        next();
      }).fail(function(err,x ){
        console.error('err', x)
      })
    });

    page('/docs/:project', function (ctx, next) {
      app.route = 'wejsdocs.'+ctx.params.project;
      var url = '/docs/'+ ctx.params.project;

      ctx.model = $.get(url).then(function (r) {
        ctx.pageContent = r.html;
        next();
      })
    });

    page('/docs/:project/:file', function (ctx, next) {
      app.route = 'wejsdocs.'+ctx.params.project + '.' + ctx.params.file;

      var url = '/docs/'+ ctx.params.project + '/' + ctx.params.file;
      ctx.model = $.get(url).then(function (r) {
        ctx.pageContent = r.html;
        next();
      });
    });

    // page('/admin/user', function (ctx, next) {
    //   app.route = 'users';
    //   next();
    // });

    // page('/admin/user/:id', function (ctx, next) {
    //   app.route = 'user-info';
    //   app.params = ctx.params;

    //   next();
    // });

    page('*', function (ctx) {

      // if (!document.querySelector('#content')) return console.log('] transition done');
      // if (ctx.fullLayout) {
      //   document.querySelector('#content').innerHTML = ctx.pageContent;
      // } else {
      //   document.querySelector('#content').innerHTML =
      //     '<section><paper-material elevation="0">' +
      //       ctx.pageContent +
      //     '</paper-material></section>';
      // }

      App.structure.reloadWidgets(ctx);

      console.log('] transition done');
    });

    page({
      hashbang: false
    });
  });

  // See https://github.com/Polymer/polymer/issues/1381
  window.addEventListener('WebComponentsReady', function() {
    document.querySelector('body').removeAttribute('unresolved');
    // Grab a reference to our auto-binding template
    // and give it some initial binding values
    // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
    var app = document.querySelector('#app');

    /**
     * Add Accept header in all request
     */
    $.ajaxPrefilter(function( options ) {
      if ( !options.beforeSend) {
        options.beforeSend = function (xhr) {
          xhr.setRequestHeader('Accept', 'application/json');
          // set auth token
          if (app.auth && app.auth.token)
            xhr.setRequestHeader('Authorization','Bearer ' + app.auth.token);
        };
      }
    });

    // $.ajaxSetup({ data: { responseType: 'json' } });

    // var loadMenu = $.get('/api/v1/docs/we/menu').then(function(r) {
    //   app.docMenu = r.menu;
    //   app.docPreloadedPages = app.docMenu.links.map(function (d){
    //     return d.url + '?responseType=json';
    //   });
    //   app.docMenu.links.forEach(function (d) {
    //     app.docPreloadedPages.push(d.url);
    //   });
    //   app.docPreloadedPages.push('/');
    // });
  });

  window.App = App;
})(window, window.page);