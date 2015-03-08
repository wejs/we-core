/**
 * We.js grunt tasks
 */

var path = require('path');

/**
 * We.js grunt tasks
 * 
 * @param  {String} projectPath optional 
 * @return {Object} wg  we.js grunt tasks loader and controller    
 */
var wg = function init(projectPath) {
  if (projectPath) wg.projectPath = projectPath;
  return wg;
}

/**
 * Project folder where the grunt tasks is instaled
 * @type {String}
 */
wg.projectPath = process.cwd();

/**
 * project npm modules folder
 * @type {String}
 */
wg.projectNpmModulesFolder = path.resolve( wg.projectPath , 'node_modules' );


wg.devAssetsFolder = 'files';
wg.prodAssetsFolder = 'files';

/**
 * grunt config used in grunt.initConfig(config);
 * @type {Object}
 */
wg.config = {};

/**
 * grunt register config used in grunt.registerTask(registers)
 * @type {Object}
 */
wg.register = {};

/**
 * grunt npm modules for load from project path
 * @type {Array}
 */
wg.gruntModules = [
  'grunt-contrib-clean',
  'grunt-contrib-concat',
  'grunt-contrib-copy',
  'grunt-contrib-watch',
  //'grunt-contrib-cssmin',
  'grunt-we-ember-template',
  'grunt-contrib-uglify',
  'grunt-fileindex'
];

wg.loadGruntConfig = function loadGruntConfig() {
  // load configs
  wg.config = require('./config.js')(wg);
}

wg.loadGruntRegister = function loadGruntRegister() {
  // load configs
  wg.register = require('./register.js');
}

wg.initGrunt = function(grunt) {

  // register core tasks
  for ( var register in wg.register) {
    grunt.registerTask(register, wg.register[register]);
  }

  // load all npm modules
  for (var i = wg.gruntModules.length - 1; i >= 0; i--) {
    wg.loadGruntNpmModule(wg.gruntModules[i], grunt);
  };
  
  // init grunt config
  grunt.initConfig(wg.config);

  //grunt.tasks(['default']);
}

wg.loadDefaultTasks = function loadDefaultTasks() {
  wg.loadGruntConfig();
  // grunt config
  wg.loadGruntRegister();
}

/**
 * Require one grunt npm module from project modules
 * 
 * @param  {String} packageName npm package module name
 * @param  {Object} grunt grunt object
 * @return {Function}            npm module
 */
wg.loadGruntNpmModule = function loadGruntNpmModule(packageName, grunt) {

  try {
    return grunt.loadNpmTasks(packageName);
  } catch(e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.error('Install the grunt task: ' + packageName + ' with "npm install ' + packageName + ' --save" ');
    } else {
      console.error(e);
    }
    // stop the process
    process.exit();
  }
}


module.exports = wg;