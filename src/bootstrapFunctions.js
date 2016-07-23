import staticConfig from './staticConfig'
import localization from './localization'
import weExpress from './express'

module.exports = {
  checkDBConnection: function checkDBConnection (we, next) {
    we.db.checkDBConnection(we, next)
  },
  loadCoreFeatures: function loadCoreFeatures (we, next) {
    we.log.verbose('loadCoreFeatures step')

    we.db.loadCoreModels( err => {
      if(err) return next(err)

      we.pluginManager.loadPluginsSettingsFromDB(we, err => {
        if (err) return next(err)
        // preload all plugins
        we.pluginManager.loadPlugins(we, (err, plugins) => {
          if (err) return next(err)
          we.plugins = plugins
          next()
        });
      });
    });
  } ,
  loadPluginFeatures: function loadPluginFeatures (we, next) {
    we.log.verbose('loadPluginFeatures step')

    we.pluginNames = we.pluginManager.pluginNames
    // load plugin static configs, merge with old we.config and
    // override the defalt config
    we.config = staticConfig.loadPluginConfigs(we)
    // set add ResponseFormat here for use we.js app
    we.responses.addResponseFormater = function (extension, formater, position) {
      position = (position === 0 || position)? position: we.config.responseTypes.length

      we.config.responseTypes.splice(position, 0, extension)
      we.responses.formaters[extension] = formater
    }

    we.hooks.trigger('we:before:load:plugin:features', we, () => {

      we.utils.async.eachSeries(we.pluginNames, (pluginName, next) => {
        we.plugins[pluginName].loadFeatures(we, next)
      }, (err) => {
        if (err) return next(err)

        we.events.emit('we:after:load:plugins', we)
        next()
      })
    })
  },
  loadTemplateCache: function loadTemplateCache (we, next) {
    // step to plug we-plugin-view
    we.hooks.trigger('we-core:on:load:template:cache', we, next)
  },
  instantiateModels: function instantiateModels (we, next) {
    //  step to define all models with sequelize
    we.log.verbose('instantiateModels step')
    we.hooks.trigger('we:models:before:instance', we, (err) => {
      if (err)  return next(err)

      for (let modelName in we.db.modelsConfigs) {
        let mc = we.db.modelsConfigs[modelName];

        // all models have a link permanent
        mc.definition.linkPermanent = {
          type: we.db.Sequelize.VIRTUAL,
          formFieldType: null,
          get: function() {
            if (this.cachedLinkPermanent) return this.cachedLinkPermanent
            this.cachedLinkPermanent = this.getUrlPath()
            return this.cachedLinkPermanent
          }
        }

        // set
        mc.definition.metadata = {
          type: we.db.Sequelize.VIRTUAL,
          formFieldType: null
        }

        we.db.setModelClassMethods()
        we.db.setModelInstanceMethods()

        // save attrs list:
        mc.attributeList = Object.keys(mc.definition)
        // save assoc attr names list:
        if (mc.associations)
          mc.associationNames = Object.keys(mc.associations)

        // define the model
        we.db.models[modelName] = we.db.define(
          modelName,
          mc.definition,
          mc.options
        )
      }

      // set all associations
      we.db.setModelAllJoins()
      we.db.setModelHooks()

      we.hooks.trigger('we:models:set:joins', we, function afterSetJoins (err) {
        if (err)  return next(err)
        next()
      })
    })
  },
  syncModels: function (we, done) {
    we.db.defaultConnection.sync().nodeify(done)
  },
  loadControllers: function loadControllers (we, next) {
    we.log.verbose('loadControllers step')
    we.events.emit('we:after:load:controllers', we)
    next()
  },
  initI18n: function initI18n(we, next) {
    we.log.verbose('initI18n step')
    localization(we)
    we.events.emit('we:after:init:i18n', we)
    next()
  },
  installAndRegisterPlugins: function installAndRegisterPlugins(we, next) {
    if (we.config.skipInstall) return next()

    we.log.verbose('installAndRegisterPluginsIfNeed step')
    // dont have plugins to install
    if (!we.pluginManager.pluginsToInstall) return next()
    // get plugins to install names
    var names = Object.keys(we.pluginManager.pluginsToInstall);
    we.utils.async.eachSeries(names, function onEachPlugin (name, nextPlugin) {
      // run install scripts
      we.pluginManager.installPlugin(name, function afterInstallOnePlugin (err){
        if (err) return nextPlugin(err)
        // register it
        we.pluginManager.registerPlugin(name, nextPlugin)
      });
    }, function afterInstallAllPlugins (err) {
      if (err) return next(err)
      next()
    });
  },
  setExpressApp: function setExpressApp (we, next) {
    // load express
    we.express = weExpress(we)
    we.events.emit('we:after:load:express', we)
    next()
  },
  passport: function passport (we, next) {
    // hook to set authentication.
    // if we-plugin-auth is installed, load passport here
    we.hooks.trigger('we-core:on:set:passport', we, next)
  },
  createDefaultFolders: function createDefaultFolders (we, next) {
    we.log.verbose('createDefaultFolders step')
    we.hooks.trigger('we:create:default:folders', we, function() {
      next()
    })
  },
  registerAllViewTemplates: function registerAllViewTemplates (we, next) {
    // hook to plugin we-plugin-view template register
    we.hooks.trigger('we-core:on:register:templates', we, next)
  },
  mergeRoutes: function mergeRoutes(we, next) {
    we.log.verbose('mergeRoutes step')
    we.routes = {}
    // merge plugin routes
    for ( var plugin in we.plugins) {
      we.utils._.merge(we.routes, we.plugins[plugin].routes)
    }
    // merge project routes
    we.utils._.merge(we.routes, we.config.routes)
    next()
  },
  /**
   * Bind all resources in App
   *
   * @param  {Object}   we
   * @param  {Function} next
   */
  bindResources: function bindResources(we, next) {
    we.log.verbose('bindResources step')
    try {
      for (var resource in we.router.resources) {
        we.router.bindResource(we.router.resources[resource])
      }
      next()
    } catch (e) {
      next(e)
    }
  },
  bindRoutes: function bindRoutes(we, next) {
    we.log.verbose('bindRoutes step')
    we.hooks.trigger('we:before:routes:bind', we, function beforeRouteBind() {
      for (var route in we.routes) {
        we.router.bindRoute(we, route, we.routes[route] )
      }

      we.hooks.trigger('we:after:routes:bind', we, function afterRouteBind() {
        // bind after router handler for run responseMethod
        we.express.use(function (req, res, done) {
          if (res.responseMethod) return res[res.responseMethod]()
          done()
        });

        we.responses.sortResponses(we);

        next()
      });
    });
  }
}