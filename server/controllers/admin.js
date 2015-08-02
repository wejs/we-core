module.exports = {
  /**
   * Index page route /
   */
  index: function(req, res) {
    res.locals.template = 'home/index';
    res.view();
  }
}