/**
 * We.js plugin config
 */

var uuid = require('node-uuid');
var log = require('./lib/log')();

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
    passport: {
      strategies: {
        local: {
          usernameField: 'email',
          passwordField: 'password'
        }
      }
    },
    // default favicon, change in your project config/local.js
    favicon: __dirname + '/client/core-favicon.ico'
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
    
    '/configs.js': {
      controller: 'main',
      action: 'getConfigsJS'
    },

    '/api/v1/translations.js': {
      controller: 'main',
      action: 'getTranslations'
    },

    // ember.js models generated from sails.js models
    'get /api/v1/models/emberjs': {
      controller: 'main',
      action: 'getAllModelsAsEmberModel'
    },

    //
    // --  Images routes
    //
    'get /api/v1/image': {
      controller    : 'image',
      action        : 'find',
      model         : 'image'
    },
    'get /api/v1/image/:name?': {
      controller    : 'image',
      action        : 'findOne',
      model         : 'image'
    },
    // Image style thumbnail | medium | large
    'get /api/v1/image/:style(original|mini|thumbnail|medium|large)/:name': {
      controller    : 'image',
      action        : 'findOne',
      model         : 'image'
    },
    'get /api/v1/image/:id/data': {
      controller    : 'image',
      action        : 'findOneReturnData',
      model         : 'image'
    },
    'get /api/v1/image-crop/:id': {
      controller    : 'image',
      action        : 'cropImage',
      model         : 'image'
    },
    'post /api/v1/image-crop/:id': {
      controller    : 'image',
      action        : 'cropImage',
      model         : 'image'
    },
    // upload one image
    'post /api/v1/image': {
      controller    : 'image',
      action        : 'create',
      model         : 'image',
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
    }    
  });

  return plugin;
};
