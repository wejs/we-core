/**
 * List files in dir in parallel
 *
 * see: http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
 */
var fs = require('fs');
var path = require('path');
var walk = function(dir, done) {
  var results = [];

  fs.readdir(dir, function(err, list) {
    if (err) {
      if (err.code === 'ENOENT') {
        return done(null, []);
      } else {
        return done(err);
      }
    }
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

module.exports = walk;