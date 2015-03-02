/**
 * We.js plugin config
 */

module.exports = function pluginConstructor(we) {
  var plugin = new we.class.Plugin(__dirname);
  // set plugin configs
  plugin.setConfigs({
    log: {
      level: 'debug'
    },
    upload: {
      dest: we.projectPath + '/files/tmp',
      rename: function (fieldname, filename) {
        return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
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

    favicon: we.projectPath + '/files/public/favicon.ico'
  });
  // load models and controllers
  plugin.loadFeatures();
  // ser plugin routes
  plugin.setRoutes({
    // homepage | default home page
    'get /': {
      controller: 'main',
      action: 'index'
    },
    // 'get /emberjs/app.js': {
    //   controller: 'main',
    //   action: 'getEmberApp'
    // }
    // 
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
