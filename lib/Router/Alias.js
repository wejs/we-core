/**
 * We.js route alias feature
 *
 * alias = temporary url or clean url
 * target = url permanent
 */
var Alias = function AliasPrototype(w) {
  this.we = w;
}
/**
 * Initialize we.js alias feature
 *
 * @param  {O}   we
 * @param  {Object}   we we.js
 * @param  {Function} cb callback
 */
Alias.prototype.initialize = function initialize(cb) {
  cb();
};

/**
 * Load all alias in memory for use with sync methods
 *
 * @param  {Object}   we we.js
 * @param  {Function} cb callback
 * @return {Object} Sequelize query promisse
 */
Alias.prototype.loadAndCacheAllALias = function loadAndCacheAllALias() {
  return this.we.db.defaultConnection.query('SELECT * FROM urlAlias');
};

/**
 * http handler to use in http.createServer
 */
Alias.prototype.httpHandler = function httpHandler(req, res) {
  var we = req.we;

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

  // check if current path have alias
  we.db.models.urlAlias.findOne({
    where: {
      $or: [ { alias: path }, { target: path } ]
    }
  }).then(we.router.alias.httpHandler_afterLoadAlias.bind({
    path: path, req: req, res: res,  urlParts: urlParts
  })).catch(function errorInSlugHandler (err){
    we.log.error(err);
    res.status(500).end();
  });
};

Alias.prototype.httpHandler_afterLoadAlias = function afterLoadAlias (urlAlias){
  var self = this,
      path = this.path,
      req = this.req,
      res = this.res,
      we = this.req.we,
      urlParts = this.urlParts;

  var query = '';
  if (urlParts[1]) query =  '?' + urlParts[1];

  if (urlAlias) {
    // is alias and have a target url
    if (urlAlias.alias == path) {
      // save the url alias record
      req.urlAlias = urlAlias;

      req.url = urlAlias.target;

      if (query) req.url += query;

      we.log.verbose('ulrAlias set for: ' + path + ' to: '+ req.url);

      we.express.bind(this)(req, res);
    } else {
    // is target and have an alias
      // set alias attrs for use in html redirect
      req.haveAlias = urlAlias;
      req.aliasQuery = query;
      return we.express.bind(self)(req, res);
    }
  } else {
    we.log.verbose('ulrAlias not found for:', path);
    // slug not found then continue with default express middlewares
    we.express.bind(self)(req, res);
  }
}

/**
 * Check if path have a alias
 *
 * !Cache feature is removed from core
 *
 * @param  {String} path
 * @return {String} Alias or null
 */
Alias.prototype.forPath = function forPath() {
  return null;
};

/**
 * Return the alias if avaible or path
 *
 * @param  {String} path
 * @return {String} Alias or the path
 */
Alias.prototype.resolvePath = function resolvePath(path) {
  return path;
};

/**
 * Check if a sequelize model class have alias
 *
 * @param  {Object} Model Sequelize model class
 * @return {Boolean}
 */
Alias.prototype.modelHaveUrlAlias = function modelHaveUrlAlias(Model) {
  return Boolean (
    Model.options &&
    (Model.options.enableAlias !== false) &&
    Model.options.classMethods &&
    Model.options.classMethods.urlAlias
  );
};

// Model hook functions
//

/**
 * Code to run after create a record with alias
 *
 * @param  {Object}   record Sequelize record
 * @param  {Object}   opts   sequelize options
 * @param  {Function} done   callback
 */
Alias.prototype.afterCreatedRecord = function afterCreatedRecord(record, opts, done) {
  if (!this.we) return done();
  var we = this.we;

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
};

/**
 * Code to run after update a record with alias
 *
 * DISABLED by default
 *
 * @param  {Object}   record Sequelize record
 * @param  {Object}   opts   sequelize options
 * @param  {Function} done   callback
 */
Alias.prototype.afterUpdatedRecord = function afterUpdatedRecord(record, opts, done) {
  if (!this.we) return done();
  var we = this.we;

  var newAlias = record.setAlias;
  // only update if set setAlias body field
  if (!newAlias) return done();

  // add stash if dont starts with slash
  if (newAlias[0] !== '/') record.setAlias = '/'+ newAlias;

  var aliasObj = {
    alias: record.setAlias,
    target: record.getUrlPath()
  };

  // check if exists:
  we.db.models.urlAlias.findOne({
    where: {
      alias: record.setAlias
    }
  }).then(function (a) {
    if (a) {
    // exists then update
      a.updateAttributes(aliasObj)
      .then(function () {
        done();
      }).catch(function (err) {
        we.log.error('Error in updateAttributes url alias:', err);
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
  }).catch(function (err) {
    we.log.error('Error in update url alias:', err);
    done();
  });
};

/**
 * Code to run after delete a record with alias
 *
 * @param  {Object}   record Sequelize record
 * @param  {Object}   opts   sequelize options
 * @param  {Function} done   callback
 */
Alias.prototype.afterDeleteRecord = function afterDeleteRecord(record, opts, done) {
  if (!this.we || !record.getUrlPath) return done();
  var we = this.we;
  var p = record.getUrlPath();

  if (!p) return done();

  we.db.models.urlAlias.destroy({
    individualHooks: true,
    where: { target: p }
  }).then(function (count) {
    we.log.verbose(count+' url alias deleted for path: '+p);
    done();
  }).catch(function (err) {
    we.log.error('Error in delete url alias:', err);
    done();
  });
}

module.exports = Alias;