import path from 'path'
import fs from 'fs'
import _ from 'lodash'

let projectPath, nodeModulesPath = process.cwd()

/**
 * Plugin manager, load, valid and store avaible plugins
 *
 * @type {Object}
 */
function PluginManager (we) {
  this.we = we

  projectPath = we.projectPath
  // npm module folder from node_modules
  nodeModulesPath = path.resolve(projectPath, 'node_modules')

  this.configs = we.configs
  this.plugins = {}
  this.pluginNames = []
  // a list of plugin.js files get from npm module folder
  this.pluginFiles = {}
  // array with all plugin paths
  this.pluginPaths = []
  // plugin records from db
  this.records = []
  // a list of plugins to install
  this.pluginsToInstall = {}
}

PluginManager.prototype.isPlugin = require('./isPlugin.js')
// return the name of all enabled plugins
PluginManager.prototype.getPluginNames = function getPluginNames () {
  return Object.keys( this.plugins )
}
// load one plugin running related plugin.js file
PluginManager.prototype.loadPlugin = function loadPlugin (pluginFile, npmModuleName, projectPath) {
  this.plugins[npmModuleName] = require(pluginFile)( projectPath , this.we.class.Plugin)
}
/**
 * Get plugin list from config or from npm_modules folder
 *
 * @param  {Object}   we   we.js
 * @param  {Function} done callback
 * @return {Array}        Plugin names list
 */
PluginManager.prototype.getPluginsList = function getPluginsList (we, done) {
  if (we.config.plugins) {
    return done(null, Object.keys(we.config.plugins))
  }

  fs.readdir(nodeModulesPath, (err, folders) => {
    if (err) return done(err)

    done(null, folders.filter(f => {
      return (f.substring(0, 3) === 'we-')
    }))
  })
}

/**
 * Load and register all avaible plugins
 *
 * @param  {object}   we we.js object
 * @param  {Function} cb callback
 */
PluginManager.prototype.loadPlugins = function loadPlugins (we, done) {
  // only load one time
  if (! _.isEmpty(this.plugins) )
    return this.plugins

  let pluginManager = this

  this.getPluginsList(we, function (err, folders) {
    if (err) return done(err)

    let npmModuleName, pluginPath, pluginFile
    // skip if dont starts with we-
    let files = folders.filter(f => {
      return (f.substring(0, 3) === 'we-')
    })

    // move we-core to list start if it is installed and
    // is in list start
    let weCoreIndex = files.indexOf('we-core')

    if (weCoreIndex !== -1 && weCoreIndex > 0) {
      files.unshift(files.splice(weCoreIndex, 1))
    }

    for (let i = 0; i < files.length; i++) {
      npmModuleName = files[i]
      // get full path
      pluginPath = path.resolve(nodeModulesPath, npmModuleName)
      // check if is plugin
      if (pluginManager.isPlugin(pluginPath) ) {
        // save plugin name
        pluginManager.pluginNames.push(npmModuleName)
        // save plugin path
        pluginManager.pluginPaths.push(pluginPath)
        // resolve full plugin file path
        pluginFile = path.resolve( pluginPath, 'plugin.js' )
        // save this plugin file
        pluginManager.pluginFiles[npmModuleName] = pluginFile
        // load plugin resources
        pluginManager.loadPlugin(pluginFile, npmModuleName, projectPath)
        // check if needs to install this plugin
        if (!pluginManager.isInstalled(npmModuleName)) {
          pluginManager.pluginsToInstall[npmModuleName] = pluginFile
        }
      }
    }

    // check if project is plugin
    if (pluginManager.isPlugin(projectPath) ) {
      // save plugin name
      pluginManager.pluginNames.push('project')
      // - then load project as plugin if it have the plugin.js file
      let projectFile = path.resolve(projectPath, 'plugin.js')
      // after all plugins load the project as plugin
      pluginManager.loadProjectAsPlugin()
      // check if needs to install the project
      if (!pluginManager.isInstalled('project')) {
        pluginManager.pluginsToInstall.project = projectFile
      }
    }

    done(null, pluginManager.plugins)
  });
}
/**
 * Check if one plugin is installed
 *
 * @param  {String}  name plugin Name
 * @return {Boolean}
 */
PluginManager.prototype.isInstalled = function isInstalled (name) {
  for (let i = 0; i < this.records.length; i++) {
    if (this.records[i].name == name) {
      return true
    }
  }
  return false
}

/**
 * Get the plugin install.js script if is avaible
 * @param  {String} name   plugin name
 */
PluginManager.prototype.getPluginInstallScript = function getPluginInstallScript (name) {
  let pluginFolder
  // get folder, for suport with project plugin
  if (name == 'project') {
    pluginFolder = projectPath
  } else {
    pluginFolder = path.resolve(nodeModulesPath, name)
  }
  // get the install file
  let installFile = path.resolve(pluginFolder, 'install.js')
  let install
  try {
    return install = require(installFile)
  } catch (e) {
    if (e.code == 'MODULE_NOT_FOUND') {
      // this plugin dont have the install file
      return null
    }
    // unknow error
    throw(e)
  }
}

PluginManager.prototype.installPlugin = function installPlugin (name, done) {
  let install = this.getPluginInstallScript(name)
  let we = this.we

  // dont have the install script
  if (!install || !install.install) {
    we.log.info('Plugin '+ name + ' dont have install method')
    return done()
  }
  // run the install script if avaible
  install.install(we, function afterRunPluginInstallMethod (err) {
    if (err) return done(err)

    we.log.info('Plugin '+ name + ' installed')
    return done()
  });
}

PluginManager.prototype.registerPlugin = function registerPlugin (name, done) {
  let we =this.we
  let pluginManager = this

  let filename
  if (name == 'project') {
    filename = 'plugin.js'
  } else {
    filename = 'node_modules/'+ name + '/plugin.js'
  }

  let install = this.getPluginInstallScript(name)

  let version = '0.0.0'

  // get version of last update
  if (install && install.updates) {
    let updates = install.updates(we)
    if (updates && updates.length) {
      version = updates[updates.length - 1].version
    }
  }

  we.db.models.plugin.create({
    filename: filename,
    name: name,
    version: version,
    status: 1
  })
  .then(function (r) {
    we.log.info('Plugin '+name+' registered with id: '+ r.id)
    // push to plugin record array
    pluginManager.records.push(r)
    done()
  })
  .catch(done)
}

/**
 * Load all plugin settings from DB
 *
 * @param  {Object}   we  we.js object
 * @param  {Function} cb  callback
 */
PluginManager.prototype.loadPluginsSettingsFromDB = function (we, cb) {
  let pluginManager = this

  we.db.models.plugin.findAll({
    order: [['weight', 'ASC'], ['id', 'ASC']]
  })
  .then(function (plugins) {
    // move we-core to start of array if exists
    for (let i = 0; i < plugins.length; i++) {
      if (plugins[i].name == 'we-core') {
        plugins.unshift(plugins.splice(i, 1)[0])
        break
      }
    }

    pluginManager.records = plugins

    cb(null, plugins)
  })
  .catch(cb)
}

/**
 * Get one plugin record from pluginManager.records array
 *
 * @param  {String} name  pluginName
 * @return {Object}       sequelize plugin record
 */
PluginManager.prototype.getPluginRecord = function getPluginRecord(name) {
  for (let l = 0; l < this.records.length; l++) {
    if (this.records[l].name == name)
      return this.records[l];
  }
  return null;
}

PluginManager.prototype.getPluginsToUpdate = function (done) {
  let we = this.we
  let pluginsToUpdate = []
  let name, installFile, updates, pluginRecord

  for (let i = 0; i < this.pluginNames.length; i++) {
    name = this.pluginNames[i]
    installFile = this.getPluginInstallScript(name)

    // skip if dont have updates
    if (!installFile || !installFile.updates) continue

    updates = installFile.updates(we)

    if (!updates.length) continue

    pluginRecord = this.getPluginRecord(name)

    if (!pluginRecord) continue

    if (pluginRecord.version == '0.0.0') {
      pluginsToUpdate.push({
        name: name,
        installFile: installFile,
        record: pluginRecord
      })
      continue
    }

    let firstUpdateFound = false
    for (let j = 0; j < updates.length; j++) {
      if (firstUpdateFound) {
        pluginsToUpdate.push({
          name: name,
          installFile: installFile,
          record: pluginRecord
        })
        break
      }

      if (!firstUpdateFound && updates[j].version == pluginRecord.version) {
        firstUpdateFound = true
      }
    }
  }

  done(null, pluginsToUpdate)
}

PluginManager.prototype.runPluginUpdates = function (name, done) {
  let we = this.we
  let installFile = this.getPluginInstallScript(name)
  let updates = installFile.updates(we);
  let pluginRecord = this.getPluginRecord(name);

  let updatesToRun = [];

  // get all updates to run for this plugin
  if (pluginRecord.version == '0.0.0') {
    updatesToRun = updates;
  } else {
    let firstUpdateFound = false
    for (let i = 0; i < updates.length; i++) {
      if (firstUpdateFound) {
        updatesToRun.push(updates[i])
      }
      if (!firstUpdateFound && updates[i].version == pluginRecord.version) {
        firstUpdateFound = true
      }
    }
  }

  we.utils.async.eachSeries(updatesToRun, function (up, next) {
    // run the update fn
    up.update(we, function (err) {
      if (err) return next (err)
      // update the plugin version in db
      pluginRecord.version = up.version
      pluginRecord.save()
      .then(function () {
        we.log.info('Plugin '+name+ ' updated to: '+up.version)
        next()
      })
      .catch(next)
    })
  }, done)
}


/**
 * Check is project have a plugin.js file and if yes load it as plugin
 */
PluginManager.prototype.loadProjectAsPlugin = function loadProjectAsPlugin () {
  let file = null
  // load project plugin.js file if exists
  try {
    file = path.join( projectPath, 'plugin.js' )
    this.loadPlugin(file, 'project', projectPath)
  } catch (e) {
    if (e.code != 'MODULE_NOT_FOUND') {
      throw e
    }
  }
  return file
}

// exports pluginManager
module.exports = PluginManager