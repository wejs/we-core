module.exports = {
  /**
   * Index admin route /admin
   */
  index: function index(req, res) {
    res.locals.template = 'home/index';
    res.ok();
  }
}