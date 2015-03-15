/**
 * We.js oauth2
 * @author Alberto Souza <contato@albertosouza.net>
 * @license [url] MIT
 */

var oauth2 = {};

// load aouth2 modules
oauth2.util = require('./util.js');
oauth2.provider = require('./provider.js');
oauth2.consumer = require('./consumer.js');

oauth2.logIn = require('./logIn.js');
oauth2.logInWithCookie = require('./logInWithCookie.js');

oauth2.logOut = require('./logOut.js');

//exports it!
module.exports = oauth2;