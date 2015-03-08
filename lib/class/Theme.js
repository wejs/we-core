/**
 * We.js Theme Class
 *
 */

var _ = require('lodash'),
  path = require('path');

/**
 * We.js theme Class constructor
 *
 * @param {string} name   theme npm pakage name
 * @param {string} projectPath project path where the theme is instaled
 * @param {object} options extra options
 */
function Theme(name, projectPath, options) {

  if (!name || (typeof name !== 'string') ) {
    return new Error('Param name is required for instantiate a new Theme object');
  }
  this.config = {};

  this.projectPath = projectPath;

  // npm theme path / folder
  this.config.themeFolder = path.resolve(projectPath, 'node_modules', name);

  this.config.shortThemeFolder = 'node_modules' + '/' + name;

  // load theme module
  var npmModule = require(this.config.themeFolder);

  // always initialize all instance properties
  this.name = name;

  // set theme config
  this.config.stylesheet = npmModule.configs.stylesheet;
  this.config.javascript = npmModule.configs.javascript;
  this.config.fontsFolder = npmModule.configs.fontsFolder;
  this.config.imagesFolder = npmModule.configs.imagesFolder;

  //
  this.config.viewPath = npmModule.configs.views.path;

  this.config.templatesFolder = path.resolve(this.config.themeFolder, this.config.viewPath);

  this.config.viewLayout = npmModule.configs.views.layout;
  this.config.layoutPath = path.resolve(this.config.themeFolder, this.config.viewLayout)

  this.config.defaultPublicThemeAssetsFolder = '.tmp/public/theme';

  this.config.assetsFolderToCopy = npmModule.configs.assetsFolderToCopy;
  this.config.assetsFlatternsSubfolder = npmModule.configs.assetsFlatternsSubfolder;

  this.config.emberTemplates = npmModule.configs.emberTemplates;

  this.config.emailTemplates = npmModule.configs.emailTemplates;

  _.merge(this, options);

}

/**
 * Theme config object
 *
 * @type {Object}
 */
// Theme.prototype.config = {};

/**
 * Render one template with variables and template
 *
 * @param  {object} req      express js request
 * @param  {object} res      express.js response
 * @param  {string} template the template name
 * @param  {object} data     data passed to template
 */
Theme.prototype.render = function(req, res, template, data) {

  if (!res.locals.layout ) {
    res.locals.layout = this.config.layoutPath;
  }

  res.view(
    path.resolve(this.config.templatesFolder, template),
    data
  );
};

/**
 *
 */
Theme.prototype.getThemeSailsTemplatesFolder = function getThemeSailsTemplatesFolder() {
  return this.config.templatesFolder;
};


/**
 *
 */
Theme.prototype.getThemeLayout = function getThemeSailsTemplatesFolder() {
  return this.config.layoutPath;
};

// -- grunt getters --//

Theme.prototype.getAssetsCwdFolder = function getassetsCwdFolder() {
  var assetsCwdFolder = this.config.themeFolder;
  if (this.config.assetsFlatternsSubfolder) {
    assetsCwdFolder += ('/' + this.config.assetsFlatternsSubfolder);
  }
  return assetsCwdFolder;
};

/**
 * Get theme files to copy
 *
 * @return {array|string} Array or string with paths of files to copy
 * @see npm package grunt-contrib-copy
 */
Theme.prototype.getThemeFilesToCopy = function getThemeFilesToCopy() {
  var files = [];

  if (this.config.assetsFolderToCopy) {
    files = files.concat(this.config.assetsFolderToCopy);
    //return this.config.assetsFolderToCopy;
  } else {
    console.log('themeEngine:theme.configs.assetsFolderToCopy not found!');
  }

  if (this.config.stylesheet) {
    files.push(this.config.stylesheet);
  }

  if (this.config.javascript) {
    files.push(this.config.javascript);
  }

  if (this.config.fontsFolder) {
    files.push(this.config.fontsFolder);
  }

  if (this.config.imagesFolder) {
    files.push(this.config.imagesFolder);
  }

  return files;
};

/**
 * Get theme files to sync
 *
 * @return {array|string} Array or string with paths of files to sync
 * @see npm package grunt-contrib-sync
 */
Theme.prototype.getThemeFilesToSync = function getThemeFilesToSync(){
  return this.getThemeFilesToCopy();
};

/**
 *
 *
 * @return {string} [description]
 */
Theme.prototype.getThemeFilesToWatch = function getThemeFilesToWatch(){
  var filesToWatch = this.config.assetsFolderToCopy;
  if(this.config.assetsFlatternsSubfolder){
    filesToWatch += ('/' + this.config.assetsFlatternsSubfolder);
  }
  return  this.projectPath + '/' + filesToWatch;
};


/**
 * Get ember.js templates process and concat
 *
 * @return {array|string} text or one empty array to use with grunt ember templates
 */
Theme.prototype.getThemeTemplatesToProcess = function getThemeTemplatesToProcess(){
  if(this.config.emberTemplates && this.config.emberTemplates.path){
    var filesToWatch = this.config.emberTemplates.path;
    return  this.config.themeFolder + '/' + filesToWatch + '/';
  }
  // if dont have one ember template config in theme return []
  return [];
};

/**
 * Get theme templates to Watch
 *
 * @return {array|string} text or one empty array to use with grunt watch
 */
Theme.prototype.getThemeTemplatesToWatch = function getThemeTemplatesToWatch() {
  return this.getThemeTemplatesToProcess() + '**/*.hbs';
};

/**
 *
 */
Theme.prototype.getThemeEmailTemplatesFolder = function getThemeSailsTemplatesFolder(){
  return path.resolve(this.config.themeFolder, this.config.emailTemplates.path);
};

// export the class
module.exports = Theme;