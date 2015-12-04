/**
 * We.js route alias feature
 */
var we ;

var alias = {
  // alias cache
  cache: {},

  /**
   * Initialize we.js alias feature
   *
   * @param  {O}   we
   * @param  {Object}   we we.js
   * @param  {Function} cb callback
   */
  initialize: function initialize(w, cb) {
    we = w;
    alias.loadAndCacheAllALias().spread(function (results){
      for (var i = results.length - 1; i >= 0; i--) {
        alias.cache[results[i].target] = results[i];
      }

      cb();
    }).catch(cb);
  },

  /**
   * Load all alias in memory for use with sync methods
   *
   * @param  {Object}   we we.js
   * @param  {Function} cb callback
   * @return {Object} Sequelize query promisse
   */
  loadAndCacheAllALias: function loadAndCacheAllALias() {
    var we = require('../index.js');
    return we.db.defaultConnection.query('SELECT * FROM urlAlias');
  },

  /**
   * http handler to use in http.createServer
   */
  httpHandler: function httpHandler(req, res) {
    var we = require('../index.js');
    var self = this;

    // is a a alias for current url
    // save old url
    req.urlBeforeAlias = req.url;

    // only works with GET requests
    if (req.method != 'GET') return we.express.bind(this)(req, res);

    // skip alias
    for (var i = we.config.router.alias.excludePaths.length - 1; i >= 0; i--) {
     if (req.url.indexOf(we.config.router.alias.excludePaths[i]) === 0){
       return we.express.bind(this)(req, res);
     }
    }

    var urlParts = req.url.split(/[?#]/);
    var path = urlParts[0];

    if (!path) return we.express.bind(this)(req, res);

    var cacheUrlAlias = we.router.alias.cache[path];
    if (cacheUrlAlias) {

      var query = '';
      if (urlParts[1]) query =  '?' + urlParts[1];
      // set alias attrs for use in html redirect
      req.haveAlias = cacheUrlAlias;
      req.aliasQuery = query;

      return we.express.bind(self)(req, res);
    }

    // then check if current path have alias
    we.db.models.urlAlias.findOne({
      where: { alias: path }
    }).then(function (urlAlias) {
      if (urlAlias) {
        // save the url alias record
        req.urlAlias = urlAlias;

        req.url = urlAlias.target;

        if (urlParts[1]) req.url += '?' + urlParts[1];

        we.log.verbose('ulrAlias set for: ' + path + ' to: '+ req.url);

        we.express.bind(this)(req, res);
      } else {
        we.log.verbose('ulrAlias not found for:', path);
        // slug not found then continue with default express middlewares
        we.express.bind(self)(req, res);
      }
    }).catch(function errorInSlugHandler(err){
      we.log.error(err);
      res.status(500).end();
    });
  },

  /**
   * Check if path have a alias
   *
   * @param  {String} path
   * @return {String} Alias or null
   */
  forPath: function forPath(path) {
    if (alias.cache[path]) {
      return alias.cache[path].alias;
    } else {
      return null;
    }
  },

  /**
   * Return the alias if avaible or path
   *
   * @param  {String} path
   * @return {String} Alias or the path
   */
  resolvePath: function resolvePath(path) {
    if (alias.cache[path]) {
      return alias.cache[path].alias;
    } else {
      return path;
    }
  },

  /**
   * Check if a sequelize model class have alias
   *
   * @param  {Object} Model Sequelize model class
   * @return {Boolean}
   */
  modelHaveUrlAlias: function modelHaveUrlAlias(Model) {
    return Boolean (
      Model.options &&
      (Model.options.enableAlias !== false) &&
      Model.options.classMethods &&
      Model.options.classMethods.urlAlias
    );
  },

  // Model hook functions
  //

  /**
   * Code to run after create a record with alias
   *
   * @param  {Object}   record Sequelize record
   * @param  {Object}   opts   sequelize options
   * @param  {Function} done   callback
   */
  afterCreatedRecord: function afterCreatedRecord(record, opts, done) {
    if (!we) return done();

    var aliasObj = opts.model.options.classMethods.urlAlias(record);

    if (!aliasObj) return done();

    var newAlias = record.setAlias;
    if (newAlias) {
      aliasObj.alias = record.setAlias;
    }

    if (aliasObj.alias[0] !== '/')  aliasObj.alias = '/'+aliasObj.alias;

    we.db.models.urlAlias.create(aliasObj)
    .then(function (alS) {
      we.log.verbose('New url alias:', alS.id);
      done();
    }).catch(function (err){
      we.log.error('Error in generate url alias:', err);
      done();
    });
  },

  /**
   * Code to run after update a record with alias
   *
   * DISABLED by default
   *
   * @param  {Object}   record Sequelize record
   * @param  {Object}   opts   sequelize options
   * @param  {Function} done   callback
   */
  afterUpdatedRecord: function afterUpdatedRecord(record, opts, done) {
    if (!we) return done();

    var newAlias = record.setAlias;
    // only update if set setAlias body field
    if (!newAlias) return done();

    // aff stash if dont starts with slash
    if (newAlias[0] !== '/') record.setAlias = '/'+newAlias

    var aliasObj = {
      alias: record.setAlias,
      target: record.getUrlPath()
    };

    if (alias.cache[aliasObj.target]) {
      // alias found then update
      if (alias.cache[aliasObj.target].alias == aliasObj.alias) {
        // salved alias is same as new then do nothing
        return done();
      }

      we.db.models.urlAlias.findById(alias.cache[aliasObj.target].id)
      .then(function(a){
        a.updateAttributes(aliasObj).then(function(){
          done();
        }).catch(function (err){
          we.log.error('Error in updateAttributes url alias:', err);
          done();
        });
      }).catch(function (err) {
        we.log.error('Error in update url alias:', err);
        done();
      });
    } else {
      // this model dont have a alias, then create one
      we.db.models.urlAlias.create(aliasObj)
      .then(function (alS) {
        we.log.verbose('New url alias:', alS.id);
        done();
      }).catch(function (err){
        we.log.error('Error in generate url alias for:', err);
        done();
      });
    }
  },

  /**
   * Code to run after delete a record with alias
   *
   * @param  {Object}   record Sequelize record
   * @param  {Object}   opts   sequelize options
   * @param  {Function} done   callback
   */
  afterDeleteRecord: function afterDeleteRecord(record, opts, done) {
    if (!we) return done();

    var p = record.getUrlPath();

    if (alias.cache[p]) {
      we.db.models.urlAlias.findById(alias.cache[p].id)
      .then(function(a){
        a.destroy().then(function () {
          done();
        }).catch(function (err) {
          we.log.error('Error in delete url alias:', err);
          done();
        });
      }).catch(function (err) {
        we.log.error('Error in delete url alias:', err);
        done();
      });
    } else {
      done();
    }
  }
}

module.exports = alias;