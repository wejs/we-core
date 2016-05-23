module.exports = {
  /**
   * Index page route /
   */
  index: function index(req, res) {
    res.locals.template = 'home/index';
    res.view();
  },

  findThemes: function findThemes(req, res) {
    var we = req.we;

    res.locals.themes = we.view.themes;
    res.locals.themeConfigs = we.config.themes;

    res.ok();
  }
}