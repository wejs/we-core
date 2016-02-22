var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var Plugin = require('../class/Plugin.js');
var projectPath = process.cwd();
// npm module folder from node_modules
var nodeModulesPath = path.resolve(projectPath, 'node_modules');

/**
 * Plugin manager, load, valid and store avaible plugins
 *
 * @type {Object}
 */
var pluginManager = {
  configs: require('../staticConfig')(projectPath),
  plugins: {},
  isPlugin: require('./isPlugin.js'),
  pluginNames: [],
  // a list of plugin.js files get from npm module folder
  pluginFiles: {},
  // array with all plugin paths
  pluginPaths: [],
  // plugin records from db
  records: [],
  // a list of plugins to install
  pluginsToInstall: {},
  // return the name of all enabled plugins
  getPluginNames: function getPluginNames() {
    return Object.keys( pluginManager.plugins );
  },
  // load one plugin running related plugin.js file
  loadPlugin: function loadPlugin(pluginFile, npmModuleName, projectPath) {
    pluginManager.plugins[npmModuleName] = require(pluginFile)( projectPath , Plugin);
  },

  /**
   * Get plugin list from config or from npm_modules folder
   *
   * @param  {Object}   we   we.js
   * @param  {Function} done callback
   * @return {Array}        Plugin names list
   */
  getPluginsList: function getPluginsList(we, done) {
    if (we.config.plugins) {
      return done(null, Object.keys(we.config.plugins));
    }

    fs.readdir(nodeModulesPath, function (err, folders) {
      if (err) return done(err);

      done(null, folders.filter(function (f) {
        if (f.substring(0, 3) === 'we-') return true;
        return false;
      }));
    });
  }
};

/**
 * Load and register all avaible plugins
 *
 * @param  {object}   we we.js object
 * @param  {Function} cb callback
 */
pluginManager.loadPlugins = function loadPlugins(we, done) {
  // only load one time
  if (! _.isEmpty(pluginManager.plugins) )
    return pluginManager.plugins;

  this.getPluginsList(we, function (err, folders) {
    if (err) return done(err);

    var npmModuleName, pluginPath, pluginFile;
    // skip if dont starts with we-
    var files = folders.filter(function (f) {
      if (f.substring(0, 3) === 'we-') return true;
      return false;
    });

    // move we-core to list start if it is installed and
    // is in list start
    var weCoreIndex = files.indexOf('we-core');
    if (weCoreIndex !== -1 && weCoreIndex > 0) {
      files.unshift(files.splice(weCoreIndex, 1))
    }

    for (var i = 0; i < files.length; i++) {
      npmModuleName = files[i];
      // get full path
      pluginPath = path.resolve(nodeModulesPath, npmModuleName);
      // check if is plugin
      if (pluginManager.isPlugin(pluginPath) ) {
        // save plugin name
        pluginManager.pluginNames.push(npmModuleName);
        // save plugin path
        pluginManager.pluginPaths.push(pluginPath);
        // resolve full plugin file path
        pluginFile = path.resolve( pluginPath, 'plugin.js' );
        // save this plugin file
        pluginManager.pluginFiles[npmModuleName] = pluginFile;
        // load plugin resources
        pluginManager.loadPlugin(pluginFile, npmModuleName, projectPath);
        // check if needs to install this plugin
        if (!pluginManager.isInstalled(npmModuleName)) {
          pluginManager.pluginsToInstall[npmModuleName] = pluginFile;
        }
      }
    }

    // check if project is plugin
    if (pluginManager.isPlugin(projectPath) ) {
      // save plugin name
      pluginManager.pluginNames.push('project');
      // - then load project as plugin if it have the plugin.js file
      var projectFile = path.resolve(projectPath, 'plugin.js');
      // after all plugins load the project as plugin
      loadProjectAsPlugin();
      // check if needs to install the project
      if (!pluginManager.isInstalled('project')) {
        pluginManager.pluginsToInstall.project = projectFile;
      }
    }

    done(null, pluginManager.plugins);
  });
}
/**
 * Check if one plugin is installed
 *
 * @param  {String}  name plugin Name
 * @return {Boolean}
 */
pluginManager.isInstalled = function isInstalled(name) {
  for (var i = 0; i < pluginManager.records.length; i++) {
    if (pluginManager.records[i].name == name) {
      return true;
    }
  }
  return false;
}

/**
 * Get the plugin install.js script if is avaible
 * @param  {String} name   plugin name
 */
pluginManager.getPluginInstallScript = function getPluginInstallScript(name) {
  var pluginFolder;
  // get folder, for suport with project plugin
  if (name == 'project') {
    pluginFolder = projectPath;
  } else {
    pluginFolder = path.resolve(nodeModulesPath, name);
  }
  // get the install file
  var installFile = path.resolve(pluginFolder, 'install.js');
  var install;
  try {
    return install = require(installFile);
  } catch (e) {
    if (e.code == 'MODULE_NOT_FOUND') {
      // this plugin dont have the install file
      return null;
    }
    // unknow error
    throw(e);
  }
}

pluginManager.installPlugin = function installPlugin(name, done) {
  var install = pluginManager.getPluginInstallScript(name);
  var we = require('../index');

  // dont have the install script
  if (!install || !install.install) {
    we.log.info('Plugin '+ name + ' dont have install method');
    return done();
  }
  // run the install script if avaible
  install.install(we, function (err) {
    if (err) return done(err);

    we.log.info('Plugin '+ name + ' installed');
    return done();
  });
}

pluginManager.registerPlugin = function registerPlugin(name, done) {
  var we = require('../index');

  var filename;
  if (name == 'project') {
    filename = 'plugin.js';
  } else {
    filename = 'node_modules/'+ name + '/plugin.js';
  }

  var install = pluginManager.getPluginInstallScript(name);

  var version = '0.0.0';

  // get version of last update
  if (install && install.updates) {
    var updates = install.updates(we);
    if (updates && updates.length) {
      version = updates[updates.length - 1].version;
    }
  }

  we.db.models.plugin.create({
    filename: filename,
    name: name,
    version: version,
    status: 1
  }).then(function (r) {
    we.log.info('Plugin '+name+' registered with id: '+ r.id);
    // push to plugin record array
    pluginManager.records.push(r);
    done();
  }).catch(done);
}

/**
 * Load all plugin settings from DB
 *
 * @param  {Object}   we  we.js object
 * @param  {Function} cb  callback
 */
pluginManager.loadPluginsSettingsFromDB = function(we, cb) {
  we.db.models.plugin.findAll({
    order: [['weight', 'ASC'], ['id', 'ASC']]
  }).then(function (plugins) {
    // move we-core to start of array if exists
    for (var i = 0; i < plugins.length; i++) {
      if (plugins[i].name == 'we-core') {
        plugins.unshift(plugins.splice(i, 1)[0]);
        break;
      }
    }

    pluginManager.records = plugins;

    cb(null, plugins);
  }).catch(cb);
}

/**
 * Get one plugin record from pluginManager.records array
 *
 * @param  {String} name  pluginName
 * @return {Object}       sequelize plugin record
 */
pluginManager.getPluginRecord = function getPluginRecord(name) {
  for (var l = 0; l < pluginManager.records.length; l++) {
    if (pluginManager.records[l].name == name)
      return pluginManager.records[l];
  }
  return null;
}

pluginManager.getPluginsToUpdate = function(done) {
  var we = require('../index');
  var pluginsToUpdate = [];
  var name, installFile, updates, pluginRecord;

  for (var i = 0; i < pluginManager.pluginNames.length; i++) {
    name = pluginManager.pluginNames[i];
    installFile = pluginManager.getPluginInstallScript(name);

    // skip if dont have updates
    if (!installFile || !installFile.updates) continue;

    updates = installFile.updates(we);

    if (!updates.length) continue;

    pluginRecord = pluginManager.getPluginRecord(name);

    if (!pluginRecord) continue;

    if (pluginRecord.version == '0.0.0') {
      pluginsToUpdate.push({
        name: name,
        installFile: installFile,
        record: pluginRecord
      });
      continue;
    }

    var firstUpdateFound = false;
    for (var j = 0; j < updates.length; j++) {
      if (firstUpdateFound) {
        pluginsToUpdate.push({
          name: name,
          installFile: installFile,
          record: pluginRecord
        });
        break;
      }

      if (!firstUpdateFound && updates[j].version == pluginRecord.version) {
        firstUpdateFound = true;
      }
    }
  }

  done(null, pluginsToUpdate);
}

pluginManager.runPluginUpdates = function(name, done) {
  var we = require('../index');
  var installFile = pluginManager.getPluginInstallScript(name);
  var updates = installFile.updates(we);
  var pluginRecord = pluginManager.getPluginRecord(name);

  var updatesToRun = [];

  // get all updates to run for this plugin
  if (pluginRecord.version == '0.0.0') {
    updatesToRun = updates;
  } else {
    var firstUpdateFound = false;
    for (var i = 0; i < updates.length; i++) {
      if (firstUpdateFound) {
        updatesToRun.push(updates[i]);
      }
      if (!firstUpdateFound && updates[i].version == pluginRecord.version) {
        firstUpdateFound = true;
      }
    }
  }

  we.utils.async.eachSeries(updatesToRun, function (up, next) {
    // run the update fn
    up.update(we, function (err) {
      if (err) return next (err);
      // update the plugin version in db
      pluginRecord.version = up.version;
      pluginRecord.save().then(function() {
        we.log.info('Plugin '+name+ ' updated to: '+up.version);
        next();
      }).catch(next);
    });
  }, done);
}

// exports pluginManager
module.exports = pluginManager;

//
// - private functions
//

/**
 * Check is project have a plugin.js file and if yes load it as plugin
 */
function loadProjectAsPlugin() {
  var file = null;
  // load project plugin.js file if exists
  try {
    file = path.join( projectPath, 'plugin.js' );
    pluginManager.loadPlugin(file, 'project', projectPath);
  } catch (e) {
    if (e.code != 'MODULE_NOT_FOUND') {
      throw e;
    }
  }
  return file;
}