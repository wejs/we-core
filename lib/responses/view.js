var themeEngine = require('../themeEngine');

module.exports = function viewResponse(data) {
  var req = this.req;
  var res = this.res;
  
  // resolve template
  themeEngine.render(req, res, data);
  // render the template
  
  // send the template
  
}