var themeEngine = require('../themeEngine');

module.exports = function viewResponse(data) {
  var req = this.req;
  var res = this.res;
  // resolve and render the template
  themeEngine.render(req, res, data);
}