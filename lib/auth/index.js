/**
 * We.js auth module
 *
 * @author Alberto Souza <contato@albertosouza.net>
 * @license MIT
 */

var auth = {
  util: require('./util.js'),
  logIn: require('./logIn.js'),
  logOut: require('./logOut.js'),
  passport: require('./passport')
};

//exports it!
module.exports = auth;