/**
 * We.js plugin config
 */

module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);

  // set plugin configs
  plugin.setConfigs({
    // default app permissions
    permissions: require('./lib/acl/corePermissions.json'),

    port: process.env.PORT || '3000',
    hostname: 'http://localhost:' + ( process.env.PORT || '3000' ),
    // default favicon, change in your project config/local.js
    favicon: __dirname + '/files/public/core-favicon.ico',

    appName: 'We.js app',
    appLogo: '/public/plugin/we-core/files/images/logo-small.png',

    defaultUserAvatar: projectPath + '/node_modules/we-core/files/public/images/avatars/user-avatar.png',

    log: { level: 'debug' },

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
        maxAge: null
      }
    },
    auth : {
      requireAccountActivation: true,
      allowUserSignup: true
    },
    acl : {
      disabled: true
    },
    passport: {
      accessTokenTime: 300000000,
      cookieDomain: 'localhost:' + ( process.env.PORT || '3000' ),
      cookieName: 'weoauth',
      cookieSecure: false,

      strategies: {
        bearer: true,
        // session
        local: {
          usernameField: 'email',
          passwordField: 'password'
        }
      }
    },

    // see https://github.com/andris9/nodemailer-smtp-transport for config options
    email: {
      // default mail options
      mailOptions: {
        // by default log emails in console
        sendToConsole: true,
        // default from and to
        from: 'We.js project <contato@wejs.org>', // sender address
        subject: 'A We.js project email', // Subject line
      },
      // connection configs
      port: 25,
      auth: {
        user: '',
        pass: ''
      },
      debug: true,
      ignoreTLS: false,
      name: null,
      // optional params
      // host: 'localhost',
      // secure: 'true',
      // localAddress: '',
      // connectionTimeout: '',
      // greetingTimeout: '',
      // socketTimeout: '',

      // authMethod: '',
      // tls: ''
    },

    // node-i18n configs
    i18n: {
      // setup some locales - other locales default to en silently
      locales:['en-us', 'pt-br'],
      // you may alter a site wide default locale
      defaultLocale: 'pt-br',
      // sets a custom cookie name to parse locale settings from  - defaults to NULL
      cookie: 'weLocale',
      // where to store json files - defaults to './locales' relative to modules directory
      directory: projectPath + '/config/locales',
      // whether to write new locale information to disk - defaults to true
      updateFiles: true,
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
      log: {

      },
      // publivars
      publicVars: {}
    },
    metadata: {},

    forms: {
      'login': __dirname + '/server/forms/login.json',
      'register': __dirname + '/server/forms/register.json'
    },
    database: { resetAllData: false },
    menu: {
      main: {},
      admin: {
        class: 'nav',
        links: [
          {
            beforeText: '<i class="fa fa-picture-o"></i>',
            text: 'theme.link',
            afterText: '',
            type: 'route',
            name: 'theme.themesList',
            roles: ['administrator']
          },
          {
            beforeText: '<i class="fa fa-users"></i>',
            text: 'users.link',
            afterText: '',
            type: 'route',
            name: 'user_manage',
            roles: ['administrator']
          },
          {
            beforeText: '<i class="fa fa-unlock-alt"></i>',
            text: 'permission.link',
            afterText: '',
            type: 'route',
            name: 'permission_manage',
            roles: ['administrator']
          },
        ]
      }
    },
    // services register
    // { url: '', oauthCallback: '', name: ''}
    services: {},

    date: {
      defaultFormat: 'YYYY-MM-DD HH:mm'
    },
    // cache configs
    cache: {
      //Cache-Control: public, max-age=[maxage]
      maxage: 86400000 // one day
    }
  });
  // set plugin routes
  plugin.setRoutes({
    // homepage | default home page
    'get /': {
      controller: 'main',
      action: 'index',
      template   : 'home/index',
      layoutName : 'fullwidth'
    },
    //
    // -- config routes
    //
    'get /api/v1/configs.json': {
      controller: 'main',
      action: 'getConfigsJS',
      responseType  : 'json'
    },

    'get /api/v1/translations.js': {
      controller: 'main',
      action: 'getTranslations',
      responseType  : 'json',
      permission    : true
    },

    // ember.js models generated from sails.js models
    'get /api/v1/models/emberjs': {
      controller: 'main',
      action: 'getAllModelsAsEmberModel',
      responseType  : 'json'
    },

    //
    // - Auth routes
    //
    'get /account': {
      controller: 'auth',
      action: 'current',
      model: 'user'
    },

    'get /signup': {
      controller: 'auth',
      action: 'signup',
      template: 'auth/register',
      titleHandler  : 'i18n',
      titleI18n: 'Register'
    },

    'post /signup': {
      controller: 'auth',
      action: 'signup',
      template: 'auth/register',
      titleHandler  : 'i18n',
      titleI18n: 'Register'
    },

    // form login
    'get /login': {
      controller: 'auth',
      action: 'loginPage',
      titleHandler  : 'i18n',
      titleI18n: 'Login'
    },
    // form login / post
    'post /login': {
      controller: 'auth',
      action: 'login',
      titleHandler  : 'i18n',
      titleI18n: 'Login'
    },

    // api login
    'post /auth/login': {
      controller    : 'auth',
      action        : 'login'
    },

    '/auth/logout': {
      controller    : 'auth',
      action        : 'logout'
    },

    // form to get one time login email
    'get /auth/forgot-password': {
      controller    : 'auth',
      action        : 'forgotPasswordPage'
    },

    // post for get new password link
    'post /auth/forgot-password': {
      controller    : 'auth',
      action        : 'forgotPassword'
    },

    'get /auth/:id([0-9]+)/reset-password/:token': {
      controller: 'auth',
      action: 'consumeForgotPasswordToken'
    },

    'get /api/v1/auth/check-if-can-reset-password': {
      controller: 'auth',
      action: 'checkIfCanResetPassword',
      responseType  : 'json'
    },

    // change password
    'post /change-password':{
      controller    : 'auth',
      action        : 'changePassword'
    },
    'get /change-password':{
      controller    : 'auth',
      action        : 'changePasswordPage'
    },

    // activate

    // 'get /api/v1/auth/callback/:access_token?':{
    //   controller    : 'auth',
    //   action        : 'oauth2Callback'
    // },

    'get /user/:id([0-9]+)/activate/:token':{
      controller    : 'auth',
      action        : 'activate'
    },

    'post /auth/auth-token':{
      controller    : 'auth',
      action        : 'authToken'
    },

    // new password
    'post /auth/new-password':{
      controller    : 'auth',
      action        : 'newPassword'
    },
    'get /auth/:id([0-9]+)/new-password':{
      controller    : 'auth',
      action        : 'newPasswordPage'
    },

    //
    // -- User routes
    //
    'get /user/:username?': {
      controller    : 'user',
      action        : 'findOneByUsername',
      model         : 'user',
      permission    : 'find_user'
    },
    'get /user': {
      controller    : 'user',
      action        : 'find',
      model         : 'user',
      permission    : 'find_user'
    },

    'get /user/:id([0-9]+)': {
      controller    : 'user',
      action        : 'findOne',
      model         : 'user',
      permission    : 'find_user'
    },
    'post /user': {
      controller    : 'user',
      action        : 'create',
      model         : 'user',
      permission    : 'create_user'
    },
    'put /user/:id([0-9]+)': {
      controller    : 'user',
      action        : 'update',
      model         : 'user',
      permission    : 'update_user'
    },
    'delete /user/:id([0-9]+)': {
      controller    : 'user',
      action        : 'destroy',
      model         : 'user',
      permission    : 'delete_user'
    },

    //
    // -- ROLES
    //

    'get /role/:id([0-9]+)': {
      controller    : 'role',
      action        : 'findOne',
      model         : 'role'
    },
    'get /role': {
      controller    : 'role',
      action        : 'find',
      model         : 'role'
    },
    'post /role': {
      controller    : 'role',
      action        : 'create',
      model         : 'role',
      permission    : 'manage_role'
    },
    'put /role/:id([0-9]+)': {
      controller    : 'role',
      action        : 'update',
      model         : 'role',
      permission    : 'manage_role'
    },
    'delete /role/:id([0-9]+)': {
      controller    : 'role',
      action        : 'destroy',
      model         : 'role',
      permission    : 'manage_role'
    },
    // add user role
    'post /user/:id([0-9]+)/role': {
      controller    : 'role',
      action        : 'addRoleToUser',
      model         : 'user',
      permission    : 'manage_role'
    },
    // remove role in user
    'delete /user/:id([0-9]+)/role': {
      controller    : 'role',
      action        : 'removeRoleFromUser',
      model         : 'user',
      permission    : 'manage_role'
    },

    //
    // Widget
    //
    'get /api/v1/widget/:id([0-9]+)': {
      controller    : 'widget',
      action        : 'findOne',
      model         : 'widget',
      permission    : true
    },
    'get /api/v1/widget/:id([0-9]+)/form': {
      controller    : 'widget',
      action        : 'getForm',
      model         : 'widget',
      permission    : 'update_widget'
    },
    'get /api/v1/widget-form/:theme/:layout/:type': {
      controller    : 'widget',
      action        : 'getCreateForm',
      model         : 'widget',
      permission    : 'create_widget'
    },
    'get /api/v1/widget': {
      controller    : 'widget',
      action        : 'find',
      model         : 'widget',
      permission    : true
    },
    'post /api/v1/widget-sort': {
      controller    : 'widget',
      action        : 'sortWidgets',
      model         : 'widget',
      permission    : 'update_widget'
    },
    'post /api/v1/widget': {
      controller    : 'widget',
      action        : 'create',
      model         : 'widget',
      permission    : 'create_widget'
    },
    'put /api/v1/widget/:id([0-9]+)': {
      controller    : 'widget',
      action        : 'update',
      model         : 'widget',
      permission    : 'update_widget'
    },
    'delete /api/v1/widget/:id([0-9]+)': {
      controller    : 'widget',
      action        : 'destroy',
      model         : 'widget',
      permission    : 'delete_widget'
    },
    'get /admin/structure/theme/:name/layout/:layout': {
      controller    : 'widget',
      action        : 'updateThemeLayout',
      template      : 'admin/structure/theme/layout',
      permission    : 'update_theme'
    },

    'get /api/v1/routes': {
      controller: 'main',
      action: 'getRoutes',
      permission    : true,
      responseType: 'json'
    },

    // - admin
    'get /admin': {
      controller    : 'admin',
      action        : 'index',
      permission    : 'access_admin'
    },

    //
    // -- Permissions
    'get /admin/permission': {
      name          : 'permission_manage',
      controller    : 'permission',
      action        : 'manage',
      template      : 'admin/permission/index',
      responseType  : 'html',
      permission    : 'manage_permissions',
    },

    'post /admin/role/:roleName/permissions/:permissionName': {
      controller    : 'role',
      action        : 'addPermissionToRole',
      model         : 'role',
      permission    : 'manage_permissions',
    },
    'delete /admin/role/:roleName/permissions/:permissionName': {
      controller    : 'role',
      action        : 'removePermissionFromRole',
      model         : 'role',
      permission    : 'manage_permissions',
    },
    // admin - users
    'get /admin/user': {
      name          : 'user_manage',
      controller    : 'user',
      action        : 'manage',
      template      : 'admin/user/index',
      responseType  : 'html',
      permission    : 'manage_users'
    },
    // theme routes
    'get /admin/structure/theme': {
      controller: 'theme',
      action: 'themesList',
      permission    : 'manage_theme',
      template      : 'admin/structure/theme/list',
      responseType: 'html'
    },
    'get /admin/structure/theme/:themeName': {
      controller: 'theme',
      action: 'themeSettings',
      permission    : 'manage_theme',
      template      : 'admin/structure/theme/index',
      responseType: 'html'
    }
  });

  plugin.setHelpers({
    'render-metadata-tags': __dirname + '/lib/view/template-helpers/render-metadata-tags.js',
    'render-stylesheet-tags': __dirname + '/lib/view/template-helpers/render-stylesheet-tags.js',
    'render-javascript-tags': __dirname + '/lib/view/template-helpers/render-javascript-tags.js',
    'render-bootstrap-config': __dirname + '/lib/view/template-helpers/render-bootstrap-config.js',
    't':  __dirname + '/lib/view/template-helpers/t.js',
    'widget-wrapper': __dirname + '/lib/view/template-helpers/widget-wrapper.js',
    'layout': __dirname + '/lib/view/template-helpers/layout.js',
    'region': __dirname + '/lib/view/template-helpers/region.js',
    'link-to': __dirname + '/lib/view/template-helpers/link-to.js',
    'template': __dirname + '/lib/view/template-helpers/template.js',
    'we-menu':  __dirname + '/lib/view/template-helpers/we-menu.js',
    'ifCond': __dirname + '/lib/view/template-helpers/ifCond.js',
    'we-contains': __dirname + '/lib/view/template-helpers/we-contains.js',
    'we-messages': __dirname + '/lib/view/template-helpers/we-messages.js',
    'we-date': __dirname + '/lib/view/template-helpers/we-date.js'
  });

  plugin.setLayouts({
    default: __dirname + '/server/templates/default-layout.hbs'
  });

  plugin.setTemplates({
    'region': __dirname + '/server/templates/region.hbs',
    'messages': __dirname + '/server/templates/messages.hbs',
    '400': __dirname + '/server/templates/400.hbs',
    '403': __dirname + '/server/templates/403.hbs',
    '404': __dirname + '/server/templates/404.hbs',
    '500': __dirname + '/server/templates/500.hbs'
  });

  plugin.setWidgets({
    html: __dirname + '/server/widgets/html',
    menu: __dirname + '/server/widgets/menu'
  });

  plugin.assets.addCoreAssetsFiles(plugin);

  plugin.events.on('we:express:set:params', function(data) {
    // user pre-loader
    data.express.param('userId', function (req, res, next, id) {
      if (!/^\d+$/.exec(String(id))) return res.notFound();
      data.we.db.models.user.findById(id).then(function (user) {
        if (!user) return res.notFound();
        res.locals.user = user;
        next();
      });
    })
  })

  return plugin;
};
