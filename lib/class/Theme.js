/**
 * We.js Theme Class
 *
 */

var _ = require('lodash'),
  hooks = require('../hooks'),
  events = require('../events'),
  path = require('path');

/**
 * We.js theme Class constructor
 *
 * @param {string} name   theme npm pakage name
 * @param {string} projectPath project path where the theme is instaled
 */
function Theme(name, projectPath) {

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

  // // set theme config
  // this.config.stylesheet = npmModule.configs.stylesheet;
  // this.config.javascript = npmModule.configs.javascript;
  // this.config.fontsFolder = npmModule.configs.fontsFolder;
  // this.config.imagesFolder = npmModule.configs.imagesFolder;

  // this.config.emailTemplates = npmModule.configs.emailTemplates;

  this.templates = {};
  this.layouts = {};
  this.widgets = {};

  _.merge(this, npmModule);
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
Theme.prototype.getThemeLayout = function getThemeSailsTemplatesFolder() {
  return this.config.layoutPath;
};

/**
 *
 */
Theme.prototype.getThemeEmailTemplatesFolder = function getThemeSailsTemplatesFolder(){
  return path.resolve(this.config.themeFolder, this.config.emailTemplates.path);
};

// we.js hooks and events is avaible in themes
Theme.prototype.events = events;
Theme.prototype.hooks = hooks;

// export the class
module.exports = Theme;