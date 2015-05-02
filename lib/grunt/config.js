/**
 * We.js default grunt config
 *
 * @param {String} projectFolder
 * @return {Object} one object with grunt configs
 */
module.exports = function getDefaultConfig(wg) {
  var themeEngine = require('../themeEngine');
  var staticConfig = require('../staticConfig')(wg.projectFolder);

  var coreCssApp;
  if (staticConfig.coreCssApp) {
    coreCssApp = staticConfig.coreCssApp;
  } else {
    if (!staticConfig.disableCoreCssApp)
      coreCssApp = '/public/plugin/we-core/files/css/app.css';
  }

  var appFiles = [
    'node_modules/*/client/shared/beforeAll/*.js',
    'node_modules/*/client/app/beforeAll/*.js',
    'client/app/beforeAll/*.js',

    'node_modules/*/client/shared/libs/*.js',
    'node_modules/*/client/app/libs/*.js',
    'client/app/libs/*.js',

    'client/app/emberApp.js',

    'node_modules/*/client/shared/mixins/*.js',
    'node_modules/*/client/app/mixins/*.js',
    'client/app/mixins/*.js',

    'node_modules/*/client/shared/helpers/*.js',
    'node_modules/*/client/app/helpers/*.js',
    'client/app/helpers/*.js',

    'node_modules/*/client/shared/adapters/*.js',
    'node_modules/*/client/app/adapters/*.js',
    'client/app/adapters/*.js',

    'node_modules/*/client/shared/routes/*.js',
    'node_modules/*/client/app/routes/*.js',
    'client/app/routes/*.js',

    'node_modules/*/client/shared/controllers/*.js',
    'node_modules/*/client/app/controllers/*.js',
    'client/app/controllers/*.js',

    'node_modules/*/client/shared/models/*.js',
    'node_modules/*/client/app/models/*.js',
    'client/app/models/*.js',

    'node_modules/*/client/shared/views/*.js',
    'node_modules/*/client/app/views/*.js',
    'client/app/views/*.js',

    'node_modules/*/client/shared/components/*.js',
    'node_modules/*/client/app/components/*.js',
    'client/app/components/*.js',

    'client/app/afterEmberFilesLoaded.js'
  ];

  var appAdminFiles = [
    'node_modules/*/client/shared/beforeAll/*.js',
    'node_modules/*/client/appAdmin/beforeAll/*.js',
    'client/appAdmin/beforeAll/*.js',

    // // load client libs for admin
    'node_modules/*/client/shared/libs/*.js',
    'node_modules/*/client/appAdmin/libs/*.js',
    'client/appAdmin/libs/*.js',

    'client/appAdmin/emberApp.js',

    'node_modules/*/client/shared/mixins/*.js',
    'node_modules/*/client/appAdmin/mixins/*.js',
    'client/appAdmin/mixins/*.js',

    'node_modules/*/client/shared/helpers/*.js',
    'node_modules/*/client/appAdmin/helpers/*.js',
    'client/appAdmin/helpers/*.js',

    'node_modules/*/client/shared/adapters/*.js',
    'node_modules/*/client/appAdmin/adapters/*.js',
    'client/appAdmin/adapters/*.js',

    'node_modules/*/client/shared/routes/*.js',
    'node_modules/*/client/appAdmin/routes/*.js',
    'client/appAdmin/routes/*.js',

    'node_modules/*/client/shared/controllers/*.js',
    'node_modules/*/client/appAdmin/controllers/*.js',
    'client/appAdmin/controllers/*.js',

    'node_modules/*/client/shared/models/*.js',
    'node_modules/*/client/appAdmin/models/*.js',
    'client/appAdmin/models/*.js',

    'node_modules/*/client/shared/views/*.js',
    'node_modules/*/client/appAdmin/views/*.js',
    'client/appAdmin/views/*.js',

    // // load client components
    'node_modules/*/client/shared/components/*.js',
    'node_modules/*/client/appAdmin/components/*.js',
    'client/appAdmin/components/*.js',

    'client/appAdmin/afterEmberFilesLoaded.js'
  ];

  /**
   * Default configs
   * @type {Object}
   */
  var config = {
    clean: {
      dev: [
        wg.devAssetsFolder + '/public/plugin',
        wg.devAssetsFolder + '/public/project'
      ],

      afterProdBuild: [
        'files/plugin/*/app',
        'files/plugin/*/appAdmin',

        'files/project/app',
        'files/project/appAdmin',

        // 'files/public/concat',
        // 'files/public/concat'
      ]
    },

    copy: {},

    fileindex:  {
      list: {
        options: {
          format: formatPath,
          pretty: true
        },
        files: [{
          dest: wg.devAssetsFolder + '/config/jsFileslist.json',
          src: appFiles
        }],
      },

      listAdmin: {
        options: {
          format: formatPath,
          pretty: true
        },
        files: [{
          dest: wg.devAssetsFolder + '/config/jsAdminFileslist.json',
          src: appAdminFiles
        }],
      }
    },

    weThemeEmberHandlebars: {
      app: {
        options: {
          // theme template folder to override templates
          themeTemplatesFolder: themeEngine.themes.app.getThemeTemplatesToProcess()
        },
        // local files
        files: [
          'node_modules/*/client/shared/templates/**/*.hbs',
          'node_modules/*/client/app/templates/**/*.hbs',

          'client/shared/templates/**/*.hbs',
          'client/app/templates/**/*.hbs'
        ],
        dest:  wg.devAssetsFolder + '/public/tpls.hbs.js'
      },
      admin: {
        options: {
          // theme template folder to override templates
          themeTemplatesFolder: themeEngine.themes.admin.getThemeTemplatesToProcess()
        },
        // local files
        files: [
          'node_modules/*/client/shared/templates/components/*.hbs',
          'node_modules/*/client/appAdmin/templates/**/*.hbs',

          'client/shared/templates/components/*.hbs',
          'client/appAdmin/templates/**/*.hbs'
        ],
        dest: wg.devAssetsFolder + '/public/admin.tpls.hbs.js'
      }
    },

    watch: {
      sharedFiles: {
        // Assets to watch:
        files: [
          'client/shared/**/*',
          'node_modules/*/client/shared/**/*'
        ],
        // When assets are changed:
        tasks: [ 'fileindex' ],
        options: { }
      },
      clientFiles: {
        // Assets to watch:
        files: [
          'client/app/**/*',
          'node_modules/*/client/app/**/*'
        ],
        // When assets are changed:
        tasks: [
          'fileindex:list'
        ],
        options: { }
      },
      clientAdminFiles: {
        // Assets to watch:
        files: [
          'client/appAdmin/**/*',
          'node_modules/*/client/appAdmin/**/*'
        ],
        // When assets are changed:
        tasks: [
          'fileindex:listAdmin'
        ],
        options: { }
      },

      // - client side templates

      themeSharedEmberTemplates: {
        files: [
          'node_modules/*/client/shared/templates/**/*.hbs',
          'client/shared/templates/**/*.hbs'
        ],
        tasks: [
          'weThemeEmberHandlebars:app',
          'weThemeEmberHandlebars:admin'
        ],
        options: {}
      },

      themeEmberTemplates: {
        files: [
          'node_modules/*/client/app/templates/**/*.hbs',
          'client/app/templates/**/*.hbs'
        ],
        tasks: [
          'weThemeEmberHandlebars:app'
        ],
        options: {}
      },
      // admin theme assets
      themeEmberTemplatesAdmin: {
        files: [
          'node_modules/*/client/appAdmin/templates/**/*.hbs',
          'client/appAdmin/templates/**/*.hbs'
        ],
        tasks: [
          'weThemeEmberHandlebars:admin'
        ],
        options: {}
      }
    },

    // build tasks
    concat: {
      js: {
        src: appFiles
          .concat('files/public/tpls.hbs.js')
          .concat(
            themeEngine.themes.app.config.themeFolder +'/'+
            themeEngine.themes.app.config.javascript
          ),
        dest: 'files/public/concat/production.js'
      },
      css: {
        src: [
          coreCssApp,
          themeEngine.themes.app.config.themeFolder +'/'+
          themeEngine.themes.app.config.stylesheet
        ],
        dest: 'files/public/concat/production.css'
      },

      // // -- admin assets
      jsAdmin: {
        src: appAdminFiles
          .concat('files/public/admin.tpls.hbs.js')
          .concat(
            themeEngine.themes.admin.config.themeFolder +'/'+
            themeEngine.themes.admin.config.javascript
          ),
        dest: 'files/public/concat/admin.production.js'
      },
      cssAdmin: {
        src: [
          coreCssApp,
          themeEngine.themes.admin.config.themeFolder +'/'+ themeEngine.themes.admin.config.stylesheet
        ],
        dest: 'files/public/concat/admin.production.css'
      }
    },

    uglify: {
      app: {
        src: ['files/public/concat/production.js'],
        dest: 'files/public/min/production.js'
      },
      admin: {
        src: ['files/public/concat/admin.production.js'],
        dest: 'files/public/min/admin.production.js'
      }
    },

    cssmin: {
      options: {
         processImport: false
      },
      app: {
        src: 'files/public/concat/production.css',
        dest: 'files/public/min/production.css'
      },
      prod: {
        src: 'files/public/concat/admin.production.css',
        dest: 'files/public/min/admin.production.css'
      }
    }
  }

  return config;
};

function formatPath (list, options, dest) {
  for (var i = list.length - 1; i >= 0; i--) {

    if( list[i].substring(0, 12) === 'node_modules' ) {
      // plugin file
      list[i] = list[i]
        .replace('node_modules', 'public/plugin');
    } else if(list[i].substring(0, 12) === '.tmp/public/'){
      // theme file
      list[i] = list[i].replace('.tmp/public/', '');
    } else {
      // project app file
      list[i] = list[i]
        .replace('client', 'public/project/client');
    }
  }

  return JSON.stringify(list, null, '  ');
}

function isAppFile(str) {
  return (str.indexOf('client/') == 0);
}