/**
 * We.js default grunt config
 *
 * @param {String} projectFolder
 * @return {Object} one object with grunt configs
 */
module.exports = function getDefaultConfig(wg) {
  var themeEngine = require('../themeEngine');

  var appFiles = [
    'node_modules/*/client/app/beforeAll/*.js',
    'node_modules/*/client/app/libs/*.js',

    'client/app/emberApp.js',

    'node_modules/*/client/app/mixins/*.js',
    'node_modules/*/client/app/helpers/*.js',
    'node_modules/*/client/app/adapters/*.js',
    'node_modules/*/client/app/routes/*.js',
    'node_modules/*/client/app/controllers/*.js',
    'node_modules/*/client/app/models/*.js',
    'node_modules/*/client/app/views/*.js',
    'node_modules/*/client/app/components/*.js',

    'client/app/afterEmberFilesLoaded.js'
  ];

  var appAdminFiles = [
    'node_modules/*/client/app/beforeAll/*.js',
    // load client libs for admin
    'node_modules/*/client/app/libs/*.js',
    'node_modules/*/client/appAdmin/libs/*.js',

    'client/appAdmin/emberApp.js',

    'node_modules/*/client/app/mixins/*.js',
    'node_modules/*/client/appAdmin/mixins/*.js',

    'node_modules/*/client/appAdmin/helpers/*.js',

    'node_modules/*/client/app/adapters/*.js',
    'node_modules/*/client/appAdmin/adapters/*.js',

    'node_modules/*/client/appAdmin/routes/*.js',
    'node_modules/*/client/appAdmin/controllers/*.js',
    'node_modules/*/client/appAdmin/models/*.js',
    'node_modules/*/client/appAdmin/views/*.js',
    // load client components
    'node_modules/*/client/app/components/*.js',
    'node_modules/*/client/appAdmin/components/*.js',

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

        'files/public/concat',
        'files/public/concat'
      ]
    },

    copy: {
      clientFiles: {
        files: [
          {
            expand: true,
            cwd: '.',
            src: appFiles.concat(appAdminFiles),
            dest: wg.devAssetsFolder,
            rename: function(dest, src) {
              if (isAppFile(src)) {
                return dest + '/public/project/' + src.replace('client/', '');
              } else {
                // is plugin file
                return dest + '/' + src
                  .replace('node_modules', 'public/plugin')
                  .replace('client/', '');
              }
            }
          }
        ]
      },
      assetsFiles: {
        files: [
          // project
          {
            expand: true,
            cwd: 'client/assets',
            src: '**/*',
            dest: wg.devAssetsFolder,
            rename: function(dest, src) {
              return dest + '/public/project/' + src;
            }
          },
          // plugins
          {
            expand: true,
            cwd: 'node_modules',
            src: '*/client/assets/**/*',
            dest: wg.devAssetsFolder,
            rename: function(dest, src) {
              return dest + '/public/plugin/' + src.replace('client/', '') ;
            }
          }
        ]
      },

      // active theme assets
      'themeApp': {
        files: [
          {
            expand: true,
            cwd:  themeEngine.themes.app.getAssetsCwdFolder(),
            src:  themeEngine.themes.app.getThemeFilesToCopy(),
            dest: themeEngine.themes.app.config.defaultPublicThemeAssetsFolder
          },
          {
            expand: true,
            cwd: themeEngine.themes.app.getAssetsCwdFolder(),
            src: themeEngine.themes.app.config.stylesheet,
            dest: wg.devAssetsFolder + '/public/theme'
          }
        ]
      },
      // admin theme assets
      'themeAdmin': {
        files: [
          {
            expand: true,
            cwd: themeEngine.themes.admin.getAssetsCwdFolder(),
            src: themeEngine.themes.admin.getThemeFilesToCopy(),
            dest: wg.devAssetsFolder + '/public/adminTheme'
          }         ,
          {
            expand: true,
            cwd: themeEngine.themes.admin.getAssetsCwdFolder(),
            src: themeEngine.themes.admin.config.stylesheet,
            dest: wg.devAssetsFolder + '/public/adminTheme'
          }
        ]
      }
    },

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
          'node_modules/*/client/app/templates/**/*.hbs',
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
          'node_modules/*/client/app/templates/components/*.hbs',
          'node_modules/*/client/appAdmin/templates/**/*.hbs',
          'client/app/templates/components/*.hbs',
          'client/appAdmin/templates/**/*.hbs'
        ],
        dest: wg.devAssetsFolder + '/public/admin.tpls.hbs.js'
      }
    },

    watch: {
      clientFiles: {
        // Assets to watch:
        files: appFiles.concat(appAdminFiles),
        // When assets are changed:
        tasks: [
          'copy:clientFiles'
        ],
        options: { }
      },

      assetsFiles: {
        // Assets to watch:
        files: [
          'client/assets/**/*',
          'node_modules/*/client/assets/**/*'
        ],
        // When assets are changed:
        tasks: [
          'copy:assetsFiles'
        ],
        options: { }
      },

      themeApp: {
        files: themeEngine.themes.app.getThemeFilesToCopy().map(function(filePattern) {
          return  themeEngine.themes.app.getAssetsCwdFolder() + '/' + filePattern;
        }),
        // When assets are changed:
        tasks: [
          'copy:themeApp'
        ],
        options: { }
      },

      themeAdmin: {
        files: themeEngine.themes.admin.getThemeFilesToCopy().map(function(filePattern) {
          return  themeEngine.themes.admin.getAssetsCwdFolder() + '/' + filePattern;
        }),
        // When assets are changed:
        tasks: [
          'copy:themeAdmin'
        ],
        options: {}
      },

      themeEmberTemplates: {
        files: themeEngine.themes.app.getThemeTemplatesToWatch(),
        tasks: [
          'weThemeEmberHandlebars:app'
        ],
        options: {}
      },
      // admin theme assets
      themeEmberTemplatesAdmin: {
        files: themeEngine.themes.admin.getThemeTemplatesToWatch(),
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
          .concat(themeEngine.themes.app.config.javascript),
        dest: 'files/public/concat/production.js'
      },
      css: {
        src: [
          'node_modules/we-core/client/assets/css/app.css',
          themeEngine.themes.app.config.stylesheet
        ],
        dest: 'files/public/concat/production.css'
      },

      // // -- admin assets
      jsAdmin: {
        src: appAdminFiles
          .concat('files/public/admin.tpls.hbs.js')
          .concat(themeEngine.themes.admin.config.javascript),
        dest: 'files/public/concat/admin.production.js'
      },
      cssAdmin: {
        src: [
          'node_modules/we-core/client/assets/css/app.css',
          themeEngine.themes.admin.config.stylesheet
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
    }
  }

  return config;
};

function formatPath (list, options, dest) {
  for (var i = list.length - 1; i >= 0; i--) {

    if( list[i].substring(0, 12) === 'node_modules' ) {
      // plugin file
      list[i] = list[i]
        .replace('node_modules', 'public/plugin')
        .replace('client/', '');
    } else if(list[i].substring(0, 12) === '.tmp/public/'){
      // theme file
      list[i] = list[i].replace('.tmp/public/', '');
    } else {
      // project app file
      list[i] = list[i]
        .replace('client', 'public/project');
    }
  }

  return JSON.stringify(list, null, '  ');
}

function isAppFile(str) {
  return (str.indexOf('client/') == 0);
}