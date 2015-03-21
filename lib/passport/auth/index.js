/**
 * We.js auth
 * @author Alberto Souza <contato@albertosouza.net>
 * @license [url] MIT
 */

var auth = {};

// load aouth2 modules
auth.util = require('./util.js');
auth.provider = require('./provider.js');
auth.consumer = require('./consumer.js');

auth.logIn = require('./logIn.js');
auth.logInWithCookie = require('./logInWithCookie.js');

auth.logOut = require('./logOut.js');

auth.validSignup = require('./validSignup.js');

//exports it!
module.exports = auth;