var helpers = {};

helpers.getHttp = function getHttp() {
  return  require('../lib').http;
}

module.exports = helpers;