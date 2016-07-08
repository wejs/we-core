'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var projectPath = process.cwd();

/**
 * Plugin manager, load, valid and store avaible plugins
 *
 * @type {Object}
 */
function PluginManager(we) {
  this.we = we;

  projectPath = we.projectPath;
  // npm module folder from node_modules
  this.nodeModulesPath = _path2.default.resolve(projectPath, 'node_modules');

  this.configs = we.configs;
  this.plugins = {};
  this.pluginNames = this.getPluginsList();
  // a list of plugin.js files get from npm module folder
  this.pluginFiles = {};
  // array with all plugin paths
  this.pluginPaths = [];
  // plugin records from db
  this.records = [];
  // a list of plugins to install
  this.pluginsToInstall = {};
}
// flag to check if plugins already is loaded
PluginManager.prototype.pluginsLoaded = false;
// function to check if npm module is plugin
PluginManager.prototype.isPlugin = require('./isPlugin.js');
// return the name of all enabled plugins
PluginManager.prototype.getPluginNames = function () {
  return this.pluginNames;
};
// load one plugin running related plugin.js file
PluginManager.prototype.loadPlugin = function (pluginFile, npmModuleName, projectPath) {
  this.plugins[npmModuleName] = require(pluginFile)(projectPath, this.we.class.Plugin);
};
/**
 * Get plugin names list from project package.json
 *
 * @return {Array}        Plugin names list
 */
PluginManager.prototype.getPluginsList = function () {
  var names = [];

  // dev or test modules
  if (this.we.env != 'prod') {
    if (this.we.projectPackageJSON.wejs && this.we.projectPackageJSON.wejs.devPlugins) {
      for (var name in this.we.projectPackageJSON.wejs.devPlugins) {
        if (this.we.projectPackageJSON.wejs.devPlugins[name]) {
          names.push(name);
        }
      }
    }
  }

  // modules avaible in all envs
  if (this.we.projectPackageJSON.wejs && this.we.projectPackageJSON.wejs.plugins) {
    for (var _name in this.we.projectPackageJSON.wejs.plugins) {
      if (this.we.projectPackageJSON.wejs.plugins[_name]) {
        names.push(_name);
      }
    }
  }

  //
  if (this.we.projectPackageJSON.name != 'we-core') {
    // move we-core to plugin list start
    var weCoreIndex = names.indexOf('we-core');
    if (weCoreIndex == -1) {
      // not is in plugins list then add before all
      names.unshift('we-core');
    } else if (weCoreIndex !== -1 && weCoreIndex > 0) {
      // move we-core to load after others plugins
      names.unshift(names.splice(weCoreIndex, 1));
    }
  }

  return names;
};

/**
 * Load and register all avaible plugins
 *
 * @param  {object}   we we.js object
 * @param  {Function} cb callback
 */
PluginManager.prototype.loadPlugins = function (we, done) {
  var _this = this;

  // only load one time
  if (this.pluginsLoaded) return this.plugins;

  var newPluginNames = we.utils._.cloneDeep(this.pluginNames);

  this.pluginNames.forEach(function (name) {
    // load project bellow
    if (name == 'project') return;

    // get full path
    var pluginPath = _path2.default.resolve(_this.nodeModulesPath, name);

    // check if is plugin
    if (!_this.isPlugin(pluginPath)) {
      // if not is plugin, remove from array and show log
      var index = newPluginNames.indexOf(name);
      newPluginNames.splice(index, 1);

      we.log.warn('pluginManager:' + name + ' not is plugin');
      return;
    }

    // save plugin path
    _this.pluginPaths.push(pluginPath);
    // resolve full plugin file path
    var pluginFile = _path2.default.resolve(pluginPath, 'plugin.js');
    // save this plugin file
    _this.pluginFiles[name] = pluginFile;
    // load plugin resources
    _this.loadPlugin(pluginFile, name, projectPath);
    // check if needs to install this plugin
    if (!_this.isInstalled(name)) {
      _this.pluginsToInstall[name] = pluginFile;
    }
  });

  this.pluginNames = newPluginNames;

  this.pluginNames.push('project');
  // - then load project as plugin if it have the plugin.js file
  var projectFile = _path2.default.resolve(projectPath, 'plugin.js');
  this.pluginFiles.project = projectFile;
  // after all plugins load the project as plugin
  this.loadProjectAsPlugin();
  // check if needs to install the project
  if (!this.isInstalled('project')) {
    this.pluginsToInstall.project = projectFile;
  }

  // load done
  this.pluginsLoaded = true;

  done(null, this.plugins);
};
/**
 * Check if one plugin is installed
 *
 * @param  {String}  name plugin Name
 * @return {Boolean}
 */
PluginManager.prototype.isInstalled = function (name) {
  for (var i = 0; i < this.records.length; i++) {
    if (this.records[i].name == name) {
      return true;
    }
  }
  return false;
};

/**
 * Get the plugin install.js script if is avaible
 * @param  {String} name   plugin name
 */
PluginManager.prototype.getPluginInstallScript = function (name) {
  var pluginFolder = void 0;
  // get folder, for suport with project plugin
  if (name == 'project') {
    pluginFolder = projectPath;
  } else {
    pluginFolder = _path2.default.resolve(this.nodeModulesPath, name);
  }
  // get the install file
  var installFile = _path2.default.resolve(pluginFolder, 'install.js');
  var install = void 0;
  try {
    return install = require(installFile);
  } catch (e) {
    if (e.code == 'MODULE_NOT_FOUND') {
      // this plugin dont have the install file
      return null;
    }
    // unknow error
    throw e;
  }
};

PluginManager.prototype.installPlugin = function (name, done) {
  var install = this.getPluginInstallScript(name);
  var we = this.we;

  // dont have the install script
  if (!install || !install.install) {
    we.log.info('Plugin ' + name + ' dont have install method');
    return done();
  }
  // run the install script if avaible
  install.install(we, function afterRunPluginInstallMethod(err) {
    if (err) return done(err);

    we.log.info('Plugin ' + name + ' installed');
    return done();
  });
};

PluginManager.prototype.registerPlugin = function (name, done) {
  var we = this.we;
  var pluginManager = this;

  var filename = void 0;
  if (name == 'project') {
    filename = 'plugin.js';
  } else {
    filename = 'node_modules/' + name + '/plugin.js';
  }

  var install = this.getPluginInstallScript(name);

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
    we.log.info('Plugin ' + name + ' registered with id: ' + r.id);
    // push to plugin record array
    pluginManager.records.push(r);
    done();
  }).catch(done);
};

/**
 * Load all plugin settings from DB
 *
 * @param  {Object}   we  we.js object
 * @param  {Function} cb  callback
 */
PluginManager.prototype.loadPluginsSettingsFromDB = function (we, cb) {
  var pluginManager = this;

  we.db.models.plugin.findAll({
    order: [['weight', 'ASC'], ['id', 'ASC']],
    raw: true
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
};

/**
 * Get one plugin record from pluginManager.records array
 *
 * @param  {String} name  pluginName
 * @return {Object}       sequelize plugin record
 */
PluginManager.prototype.getPluginRecord = function (name) {
  for (var l = 0; l < this.records.length; l++) {
    if (this.records[l].name == name) return this.records[l];
  }
  return null;
};

PluginManager.prototype.getPluginsToUpdate = function (done) {
  var we = this.we;
  var pluginsToUpdate = [];
  var name = void 0,
      installFile = void 0,
      updates = void 0,
      pluginRecord = void 0;

  for (var i = 0; i < this.pluginNames.length; i++) {
    name = this.pluginNames[i];
    installFile = this.getPluginInstallScript(name);

    // skip if dont have updates
    if (!installFile || !installFile.updates) continue;

    updates = installFile.updates(we);

    if (!updates.length) continue;

    pluginRecord = this.getPluginRecord(name);

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
};

PluginManager.prototype.runPluginUpdates = function (name, done) {
  var we = this.we;
  var installFile = this.getPluginInstallScript(name);
  var updates = installFile.updates(we);
  var pluginRecord = this.getPluginRecord(name);

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
      if (err) return next(err);
      // update the plugin version in db
      pluginRecord.version = up.version;
      pluginRecord.save().then(function () {
        we.log.info('Plugin ' + name + ' updated to: ' + up.version);
        next();
      }).catch(next);
    });
  }, done);
};

/**
 * Check is project have a plugin.js file and if yes load it as plugin
 */
PluginManager.prototype.loadProjectAsPlugin = function () {
  var file = null;
  // load project plugin.js file if exists
  try {
    file = _path2.default.join(projectPath, 'plugin.js');
    this.loadPlugin(file, 'project', projectPath);
  } catch (e) {
    if (e.code != 'MODULE_NOT_FOUND') {
      throw e;
    }
  }
  return file;
};

// exports pluginManager
module.exports = PluginManager;