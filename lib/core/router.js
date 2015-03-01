var express = require('express');
var eRouter = express.Router();

var router = {};

router.bindRoute = function(we, route, config) {
  var method, path;

  var r = route.split(' ');
  if (r.length > 1) {
    method = r[0];
    path = r[1];
  } else {
    method = 'get';
    path = r[0];
  }

  if (config.method) {
    method = config.method;
  }
  
  we.express[method](path, we.controllers[config.controller][config.action].bind({ 
    we: we,
    options: config
  }));
}

module.exports = router;