/**
 * We.js plugin config
 */

var uuid = require('node-uuid');
var log = require('./lib/log')();
var mkdirp = require('mkdirp');

module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);

  var imageMimeTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/bmp',
    'image/x-icon',
    'image/tiff'
  ];

  // set plugin configs
  plugin.setConfigs({
    port: process.env.PORT || '3000',
    hostname: 'http://localhost:' + ( process.env.PORT || '3000' ),
    // default favicon, change in your project config/local.js
    favicon: __dirname + '/client/core-favicon.ico',
    defaultUserAvatar: '111111',
    log: {
      level: 'debug'
    },
    upload: {
      image: {
        uploadPath: projectPath + '/files/uploads/images',
        avaibleStyles: [
          'mini',
          'thumbnail',
          'medium',
          'large'
        ],

        styles: {
          mini: {
            width: '24',
            heigth: '24'
          },
          thumbnail: {
            width: '75',
            heigth: '75'
          },
          medium: {
            width: '250',
            heigth: '250'
          },
          large: {
            width: '640',
            heigth: '640'
          }
        }
      }
    },
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
      requireAccountActivation: true
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
      indent: "\t",
      // setting extension of json files - defaults to '.json' (you might want to set this to '.js' according to webtranslateit)
      extension: '.json',
      // setting prefix of json files name - default to none '' (in case you use different locale files naming scheme (webapp-en.json), rather then just en.json)
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
    }
  });
  // ser plugin routes
  plugin.setRoutes({
    // homepage | default home page
    'get /': {
      controller: 'main',
      action: 'index'
    },

    //
    // -- config routes
    //

    '/api/v1/configs.json': {
      controller: 'main',
      action: 'getConfigsJS',
      responseType  : 'json'
    },

    '/api/v1/translations.js': {
      controller: 'main',
      action: 'getTranslations',
      responseType  : 'json'
    },

    // ember.js models generated from sails.js models
    'get /api/v1/models/emberjs': {
      controller: 'main',
      action: 'getAllModelsAsEmberModel',
      responseType  : 'json'
    },

    //
    // --  Images routes
    //
    'get /api/v1/image': {
      controller    : 'image',
      action        : 'find',
      model         : 'image',
      responseType  : 'json'
    },
    'get /api/v1/image/:name': {
      controller    : 'image',
      action        : 'findOne',
      model         : 'image',
      responseType  : 'json'
    },
    // Image style thumbnail | medium | large
    'get /api/v1/image/:style(original|mini|thumbnail|medium|large)/:name': {
      controller    : 'image',
      action        : 'findOne',
      model         : 'image',
      responseType  : 'json'
    },
    'get /api/v1/image/:id/data': {
      controller    : 'image',
      action        : 'findOneReturnData',
      model         : 'image',
      responseType  : 'json'
    },
    'get /api/v1/image-crop/:id': {
      controller    : 'image',
      action        : 'cropImage',
      model         : 'image',
      responseType  : 'json'
    },
    'post /api/v1/image-crop/:id': {
      controller    : 'image',
      action        : 'cropImage',
      model         : 'image',
      responseType  : 'json'
    },
    // upload one image
    'post /api/v1/image': {
      controller    : 'image',
      action        : 'create',
      model         : 'image',
      responseType  : 'json',
      upload: {
        dest: projectPath + '/files/uploads/images/original',
        rename: function (fieldname, filename) {
          return Date.now() + '_' + uuid.v1();
        },
        limits: {
          fieldNameSize: 150,
          files: 1,
          fileSize: 10*1000000, // 10MB
          fieldSize: 20*1000000 // 20MB
        },
        onFileUploadStart: function(file) {
          // check if file is valir on upload start
          if (imageMimeTypes.indexOf(file.mimetype) < 0) {
            log.debug('Image:onFileUploadStart: Invalid file type for file:', file);
            // cancel upload on invalid type
            return false;
          }
        }
      }
    },

    // -- FILES

    'get /files': {
      controller    : 'files',
      action        : 'find'
    },

    'post /files': {
      controller    : 'files',
      action        : 'create'
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
      action: 'signupPage'
    },

    'post /signup': {
      controller: 'auth',
      action: 'signup'
      //view: 'users/signup'
    },

    'post /api/v1/signup': {
      controller: 'auth',
      action: 'signup'
      //view: 'users/signup'
    },

    // form login
    'get /login': {
      controller: 'auth',
      action: 'loginPage'
    },
    // form login / post
    'post /login': {
      controller: 'auth',
      action: 'login'
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

    'get /auth/:id/reset-password/:token': {
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

    'get /user/:id/activate/:token':{
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
    'get /auth/:id/new-password':{
      controller    : 'auth',
      action        : 'newPasswordPage'
    },

    //
    // -- User routes
    //

    'get /user/:username?': {
      controller    : 'user',
      action        : 'findOneByUsername',
      model         : 'user'
    },

    // get logged in user avatar
    'get /avatar/:id': {
      controller    : 'avatar',
      action        : 'getAvatar'
    },

    'post /api/v1/user/:id/avatar': {
      controller    : 'avatar',
      action        : 'changeAvatar'
    },


    //
    // -- ROLES
    //

    // add role in user
    'post /user/:id/role': {
      controller    : 'role',
      action        : 'addRoleToUser',
      model         : 'user'
    },

    // remove role in user
    'delete /user/:id/role': {
      controller    : 'role',
      action        : 'removeRoleFromUser',
      model         : 'user'
    }

  });

  plugin.events.on('we:create:default:folders', function(we) {
    // create image upload path
    mkdirp(we.config.upload.image.uploadPath, function(err) {
      if (err) we.log.error('Error on create image upload path', err);
    })

  });

  return plugin;
};
