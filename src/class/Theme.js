/**
 * We.js Theme prototype
 */

const _ = require('lodash'),
  path = require('path');

module.exports = function getThemePrototype(we) {
  /**
   * We.js theme Class constructor
   *
   * @param {string} name   theme npm pakage name
   * @param {string} projectPath project path where the theme is instaled
   */
  function Theme (name, projectPath, options) {
    if (!name || (typeof name !== 'string') ) {
      return new Error('Param name is required for instantiate a new Theme object');
    }
    if (!options) options = {};

    this.we = we;
    this.hooks = this.we.hooks;
    this.events = this.we.events;

    const self = this;

    this.config = {};

    this.projectPath = projectPath;

    // npm theme path / folder
    this.config.themeFolder = options.themeFolder || path.resolve(projectPath, 'node_modules', name);

    this.config.shortThemeFolder = options.themeFolder || 'node_modules' + '/' + name;

    // load theme module
    const npmModule = require(this.config.themeFolder);

    // always initialize all instance properties
    this.name = name;

    this['package.json'] = require(this.config.themeFolder+'/package.json');
    // shortcut for get installed theme version
    this.version = this['package.json'].version;

    this.templates = {};
    this.layouts = {};
    this.widgets = {};

    this.tplsFolder = path.resolve(self.config.themeFolder, 'templates/server');

    _.merge(this, npmModule);
  }

  Theme.prototype.init = function init(cb) {
    const self = this;

    // if autoLoadAllTemplates not is set or is true load all template names
    if (!we.view.loadFromCache() &&
       (this.autoLoadAllTemplates !== false)
    ){
      we.utils.listFilesRecursive(self.tplsFolder, (err, files)=> {
        if (err) return cb(err);

        files.filter(function filterTPL(f) {
          if (f.endsWith('.hbs')) return true;
          return false;
        })
        .forEach(function loadTPL(f) {
          // remove the base url and the file extension
          let name = f.replace(self.tplsFolder + path.sep, '')
                      .replace('.hbs', '');

          // ensures that template names always have / slashes
          if (path.sep != '/') name = name.split(path.sep).join('/');

          self.templates[name] = f;
        });

        cb();
      });
    }
  };
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
  Theme.prototype.render = function render(req, res, template, data) {

    if (!res.locals.layout ) {
      res.locals.layout = this.config.layoutPath;
    }

    res.view( path.resolve(this.config.templatesFolder, template), data );
  };

  /**
   * Get theme layout path
   */
  Theme.prototype.getThemeLayout = function getThemeSailsTemplatesFolder() {
    return this.config.layoutPath;
  };

  /**
   * Get theme email template folder
   */
  Theme.prototype.getThemeEmailTemplatesFolder = function getThemeSailsTemplatesFolder(){
    return path.resolve(this.config.themeFolder, this.config.emailTemplates.path);
  };

  return Theme;
};