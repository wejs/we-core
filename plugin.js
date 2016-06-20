/**
 * We.js plugin config
 */

module.exports = function loadPlugin (projectPath, Plugin) {
  var plugin = new Plugin(__dirname);

  // folder for fallback templates
  plugin.tplFolder = projectPath + '/node_modules/we-plugin-view/server/templates/';

  // set plugin configs
  plugin.setConfigs({
    // select how bootstrap functions will run
    // values: full || install
    bootstrapMode: null,

    // enable suport to parse req.query.where to sequelize query
    enableQueryWhere: false,
    // update route methods
    updateMethods: ['POST', 'PUT', 'PATCH'],
    // default find limit
    queryDefaultLimit: 25,
    queryMaxLimit: 300,
    // map reponseType response types, used by Accept headers in response selection
    // this is set automaticaly after add new response types
    responseTypes: [
      'application/json',
      'application/vnd.api+json'
    ],
    defaultResponseType: 'application/json',
    // send nested models in response
    sendNestedModels: true,
    port: process.env.PORT || '4000',
    hostname: 'http://localhost:' + ( process.env.PORT || '4000' ),
    // default favicon, change in your project config/local.js
    favicon: __dirname + '/files/public/core-favicon.ico',

    appName: 'We.js app',
    appLogo: '/public/plugin/we-core/files/images/logo-small.png',

    robotsTXT: __dirname + '/files/robots.txt',
    log: { level: 'debug' },
    // set false to disable request log in dev env
    enableRequestLog: true,

    session: {
      secret: 'setASecreteKeyInYourAppConfig',
      resave: false,
      saveUninitialized: true,
      name: 'wejs.sid',
      rolling: false,
      cookie: {
        path: '/',
        httpOnly: true,
        secure: false,
        maxAge: 86400000*15 // 15 days
      }
    },
    // body parser settings to use in bodyParser.json()
    bodyParser: {
      limit: 20000000
    },
    // external services API keys
    apiKeys: {},
    // node-i18n configs
    i18n: {
      // setup some locales - other locales default to en silently
      locales:[],
      // you may alter a site wide default locale
      defaultLocale: 'en-us',
      // sets a custom cookie name to parse locale settings from  - defaults to NULL
      cookie: 'weLocale',
      // where to store json files - defaults to './locales' relative to modules directory
      directory: projectPath + '/config/locales',
      // whether to write new locale information to disk - defaults to true
      updateFiles: false,
      // what to use as the indentation unit - defaults to "\t"
      indent: '\t',
      // setting extension of json files - defaults to '.json'
      // (you might want to set this to '.js' according to webtranslateit)
      extension: '.json',
      // setting prefix of json files name - default to none ''
      // (in case you use different locale files naming scheme
      // (webapp-en.json), rather then just en.json)
      prefix: '',
      // enable object notation
      objectNotation: false
    },
    clientside: {
      // client side logs
      log: {},
      // publivars
      publicVars: {
        // set to true to enable the page.js partial loader
        dynamicLayout: false
      }
    },
    metadata: {},
    // default db config
    database: {
      resetAllData: false,
      prod: {
        dialect: 'mysql',
        database: 'test',
        username: 'root',
        password: '',
        // by default log to info
        logging: plugin.we.log.debug
      },
      dev: {
        dialect: 'mysql',
        database: 'test',
        username: 'root',
        password: '',
          // by default log to info
        logging: plugin.we.log.debug
      },
      test: {
        dialect: 'mysql',
        database: 'test',
        username: 'root',
        password: '',
        // by default log to info
        logging: plugin.we.log.debug
      }
    },
    // services register
    // { url: '', oauthCallback: '', name: ''}
    services: {},

    date: { defaultFormat: 'L HH:mm' },
    // cache configs
    cache: {
      // resource cache, Last-Modified cache
      resourceCacheActions: 'findOne',
      skipResourceCache: false,
      //Cache-Control: public, max-age=[maxage]
      maxage: 86400000*15 // 15 days
    },
    security: {
      // see https://github.com/expressjs/cors#configuration-options for configuration options
      // This may be override by every route configs
      CORS: {
        // block all CORS requests by default
        origin: function(origin, cb){ cb(null, false) },
        // default methods
        methods: ['GET', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
      }
    },
    router: {},
    /**
     * Resource routes, add or remove routes generated to your resource
     *
     * @type {Object}
     */
    resourceRoutes: {
      // apis
      createAPI: function createAPIRR(we, cfg, opts) {
        // set post create on list for APIS
        we.routes['post '+opts.rootRoute] = we.utils._.merge(
          {
            resourceName: opts.namePrefix+opts.name,
            action: 'create',
            controller: cfg.controller,
            model: cfg.model,
            permission: 'create_' + opts.name,
            breadcrumbHandler: 'create'
          },
          opts.create,
          we.routes['post '+opts.rootRoute] || {}
        );
      },
      findAll: function findAllRR(we, cfg, opts) {
        we.routes['get ' + opts.rootRoute] = we.utils._.merge(
          {
            resourceName: opts.namePrefix+opts.name,
            layoutName: opts.layoutName, // null = default layout
            name: opts.namePrefix + opts.name + '.find',
            action: 'find',
            controller: cfg.controller,
            model: cfg.model,
            template: opts.templateFolderPrefix + opts.name + '/find',
            fallbackTemplate: plugin.tplFolder + 'default/find.hbs',
            permission: 'find_' + opts.name,
            titleHandler: 'i18n',
            titleI18n: opts.name + '.find',
            routeQuery: opts.routeQuery,
            // default search
            search: {
              // since search is avaible in findAll by default
              since: {
                parser: 'since',
                target: {
                  type: 'field',
                  field: 'createdAt'
                }
              }
            },
            breadcrumbHandler: 'find'
          },
          opts.findAll,
          we.routes['get ' + opts.rootRoute] || {}
        );
      },
      findOne: function findOneRR(we, cfg, opts, Model) {
        we.routes['get '+opts.itemRoute] = we.utils._.merge(
          {
            layoutName: opts.layoutName, // null = default layout
            resourceName: opts.namePrefix+opts.name,
            name: opts.namePrefix + opts.name + '.findOne',
            action: 'findOne',
            controller: cfg.controller,
            model: cfg.model,
            template: opts.templateFolderPrefix + opts.name + '/findOne',
            fallbackTemplate: plugin.tplFolder + 'default/findOne.hbs',
            permission: 'find_' + opts.name,
            titleHandler: opts.itemTitleHandler,
            titleField: Model.options.titleField,
            titleI18n: opts.name + '.findOne',
            breadcrumbHandler: 'findOne'
          },
          opts.findOne,
          we.routes['get '+opts.itemRoute] || {}
        );
      },
      updateAPI: function updateAPIRR(we, cfg, opts) {
        we.routes['put '+opts.itemRoute] = we.utils._.merge(
          {
            resourceName: opts.namePrefix+opts.name,
            action: 'edit',
            controller: cfg.controller,
            model: cfg.model,
            permission: 'update_' + opts.name
          },
          opts.edit,
          we.routes['put '+opts.itemRoute] || {}
        );
      },
      deleteAPI: function deleteAPIRR(we, cfg, opts) {
        we.routes['delete '+opts.itemRoute] = we.utils._.merge(
          {
            resourceName: opts.namePrefix+opts.name,
            action: 'delete',
            controller: cfg.controller,
            model: cfg.model,
            permission: 'delete_' + opts.name
          },
          opts.delete,
          we.routes['delete '+opts.itemRoute] || {}
        );
      }
    }
  });

  return plugin;
};
