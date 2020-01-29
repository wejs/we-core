/**
 * Code from mkdirp: https://github.com/substack/node-mkdirp
 */
const path = require('path'),
  fs = require('fs'),
  _0777 = parseInt('0777', 8);

module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

function mkdirP (p, opts, f, made) {
  if (typeof opts === 'function') {
    f = opts;
    opts = {};
  }
  else if (!opts || typeof opts !== 'object') {
    opts = { mode: opts };
  }

  let mode = opts.mode;
  let xfs = opts.fs || fs;

  if (mode === undefined) {
    mode = _0777 & (~process.umask());
  }
  if (!made) made = null;

  let cb = f || function () {};
  p = path.resolve(p);

  xfs.mkdir(p, mode, function (er) {
    if (!er) {
      made = made || p;
      return cb(null, made);
    }
    switch (er.code) {
      case 'ENOENT':
        mkdirP(path.dirname(p), opts, function (er, made) {
          if (er) cb(er, made);
          else mkdirP(p, opts, cb, made);
        });
        break;

      // In the case of any other error, just see if there's a dir
      // there already.  If so, then hooray!  If not, then something
      // is borked.
      default:
        xfs.stat(p, function (er2, stat) {
          // if the stat fails, then that's super weird.
          // let the original error be the failure reason.
          if (er2 || !stat.isDirectory()) cb(er, made)
          else cb(null, made);
        });
        break;
    }
  });
}

