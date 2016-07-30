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
    res.locals.title = null; // dont show duplicated titles
    res.ok();
  }
};