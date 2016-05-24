module.exports = {
  /**
   * Index page route /
   */
  index: function index(req, res) {
    res.locals.template = 'home/index';
    res.ok();
  }
}