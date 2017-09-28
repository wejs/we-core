const staticConfig = require('./staticConfig'),
      localization = require('./localization'),
      weExpress = require('./express');

module.exports = {
  checkDBConnection(we, next) {
    we.db.checkDBConnection(we, next);
  },
  loadCoreFeatures(we, next) {
    we.log.verbose('loadCoreFeatures step');

    we.db.loadCoreModels( err => {
      if(err) return next(err);

      we.pluginManager.loadPluginsSettingsFromDB(we, err => {
        if (err) return next(err);
        // preload all plugins
        we.pluginManager.loadPlugins(we, (err, plugins) => {
          if (err) return next(err);
          we.plugins = plugins;
          next();
        });
      });
    });
  } ,
  loadPluginFeatures(we, next) {
    we.log.verbose('loadPluginFeatures step');

    we.pluginNames = we.pluginManager.pluginNames;
    // load plugin static configs, merge with old we.config and
    // override the defalt config
    we.config = staticConfig.loadPluginConfigs(we);
    // set add ResponseFormat here for use we.js app
    we.responses.addResponseFormater = (extension, formater, position)=> {
      position = (position === 0 || position)? position: we.config.responseTypes.length;

      we.config.responseTypes.splice(position, 0, extension);
      we.responses.formaters[extension] = formater;
    };

    we.hooks.trigger('we:before:load:plugin:features', we, (err)=> {
      if (err) return next(err);

      we.utils.async.eachSeries(we.pluginNames, (pluginName, next)=> {
        we.plugins[pluginName].loadFeatures(we, next);
      }, (err) => {
        if (err) return next(err);

        we.events.emit('we:after:load:plugins', we);
        next();
      });
    });
  },
  loadTemplateCache(we, next) {
    // step to plug we-plugin-view
    we.hooks.trigger('we-core:on:load:template:cache', we, next);
  },
  instantiateModels(we, next) {

    //  step to define all models with sequelize
    we.log.verbose('instantiateModels step');
    we.hooks.trigger('we:models:before:instance', we, (err) => {
      if (err)  return next(err);

      for (let modelName in we.db.modelsConfigs) {
        let mc = we.db.modelsConfigs[modelName];

        // all models have a link permanent
        mc.definition.linkPermanent = {
          type: we.db.Sequelize.VIRTUAL,
          formFieldType: null,
          get(){
            if (this.cachedLinkPermanent) return this.cachedLinkPermanent;
            this.cachedLinkPermanent = this.getUrlPath();
            return this.cachedLinkPermanent;
          }
        };

        // set
        mc.definition.metadata = {
          type: we.db.Sequelize.VIRTUAL,
          formFieldType: null
        };

        we.db.setModelClassMethods();
        we.db.setModelInstanceMethods();

        // save attrs list:
        mc.attributeList = Object.keys(mc.definition);
        // add created and updated at attrs
        mc.attributeList.push('createdAt');
        mc.attributeList.push('updatedAt');
        // save assoc attr names list:
        if (mc.associations)
          mc.associationNames = Object.keys(mc.associations);

        // define the model
        we.db.models[modelName] = we.db.define(
          modelName,
          mc.definition,
          mc.options
        );
      }

      // set all associations
      we.db.setModelAllJoins();
      we.db.setModelHooks();

      we.hooks.trigger('we:models:set:joins', we, function afterSetJoins (err) {
        if (err) return next(err);
        next();
      });
    });
  },
  syncModels(we, done) {
    we.db.defaultConnection.sync().nodeify(done);
  },
  loadControllers(we, next) {
    we.log.verbose('loadControllers step');
    we.events.emit('we:after:load:controllers', we);
    next();
  },
  initI18n(we, next) {
    we.log.verbose('initI18n step');
    localization(we);
    we.events.emit('we:after:init:i18n', we);
    next();
  },
  installAndRegisterPlugins(we, next) {
    if (we.config.skipInstall) return next();

    we.log.verbose('installAndRegisterPluginsIfNeed step');
    // dont have plugins to install
    if (!we.pluginManager.pluginsToInstall) return next();
    // get plugins to install names
    var names = Object.keys(we.pluginManager.pluginsToInstall);
    we.utils.async.eachSeries(names, function onEachPlugin (name, nextPlugin) {
      // run install scripts
      we.pluginManager.installPlugin(name, function afterInstallOnePlugin (err){
        if (err) return nextPlugin(err);
        // register it
        we.pluginManager.registerPlugin(name, nextPlugin);
      });
    }, function afterInstallAllPlugins (err) {
      if (err) return next(err);
      next();
    });
  },
  setExpressApp(we, next) {
    // load express
    we.express = weExpress(we);
    we.events.emit('we:after:load:express', we);
    next();
  },
  passport(we, next) {
    // hook to set authentication.
    // if we-plugin-auth is installed, load passport here
    we.hooks.trigger('we-core:on:set:passport', we, next);
  },
  createDefaultFolders(we, next) {
    we.log.verbose('createDefaultFolders step');
    we.hooks.trigger('we:create:default:folders', we, next);
  },
  registerAllViewTemplates(we, next) {
    // hook to plugin we-plugin-view template register
    we.hooks.trigger('we-core:on:register:templates', we, next);
  },
  mergeRoutes(we, next) {
    we.log.verbose('mergeRoutes step');
    we.routes = {};
    // merge plugin routes
    for (let plugin in we.plugins) {
      we.utils._.merge(we.routes, we.plugins[plugin].routes);
    }
    // merge project routes
    we.utils._.merge(we.routes, we.config.routes);
    next();
  },
  /**
   * Bind all resources in App
   *
   * @param  {Object}   we
   * @param  {Function} next
   */
  bindResources(we, next) {
    we.log.verbose('bindResources step');
    try {
      for (let resource in we.router.resources) {
        we.router.bindResource(we.router.resources[resource]);
      }
      next();
    } catch (e) {
      next(e);
    }
  },
  bindRoutes(we, next) {
    we.log.verbose('bindRoutes step');
    we.hooks.trigger('we:before:routes:bind', we, function beforeRouteBind(err) {
      if (err) return next(err);

      for (let route in we.routes) {
        we.router.bindRoute(we, route, we.routes[route] );
      }

      we.hooks.trigger('we:after:routes:bind', we, function afterRouteBind(err) {
        if (err) return next(err);

        // bind after router handler for run responseMethod
        we.express.use( (req, res, done)=> {
          if (res.responseMethod) return res[res.responseMethod]();
          done();
        });

        we.responses.sortResponses(we);

        next();
      });
    });
  }
};