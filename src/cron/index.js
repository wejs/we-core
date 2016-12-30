const path = require('path');

const cron = {
  loadAndRunAllTasks(we, cb) {
    we.cron.loadTasks(we, (err, tasks)=> {
      if (err) return cb(err);
      if (!tasks) return cb();

      we.utils.async.eachSeries(tasks, (t, next)=> {
        t(we, next);
      }, cb);
    });
  },
  /**
   * Load all project and plugin tasks
   *
   * @param  {Object}   we   We.js object
   * @param  {Function} done callback
   */
  loadTasks(we, done) {
    let tasks = {};
    we.utils.async.each(we.pluginNames, (name, next)=> {
      // try to load the cron.js files
      try {
        tasks[name] = require(path.resolve(we.plugins[name].pluginPath, 'cron.js'));
      } catch(e) {
        if (e.code != 'MODULE_NOT_FOUND') {
          we.log.error(e);
        }
      }
      next();
    }, (err)=> {
      done(err, tasks);
    });
  }
};

module.exports = cron;