const fs = require('fs'),
      path = require('path');

/**
 * List files in dir in parallel
 *
 * see: http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
 *
 * @param  {String}   dir
 * @param  {Function} done run with error, files
 */
const walk = function walk(dir, done) {
  var results = [];

  fs.readdir(dir, (err, list)=> {
    if (err) {
      if (err.code === 'ENOENT') {
        return done(null, []);
      } else {
        return done(err);
      }
    }
    let pending = list.length;
    if (!pending) return done(null, results);

    list.forEach( (file)=> {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat)=> {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res)=> {
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