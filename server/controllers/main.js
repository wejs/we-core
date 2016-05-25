/**
 * MainController
 *
 * @module		:: Controller
 */

module.exports = {
  /**
   * Index page route /
   */
  index: function(req, res) {
    if (!res.locals.template) res.locals.template = 'home/index';
    res.locals.title = null; // dont show duplicated titles
    res.ok();
  }
};