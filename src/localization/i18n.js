const path = require('path'),
  fs = require('fs'),
  hbs = require('handlebars');

const i18n = {
  we: null,
  fileI18nConfig: null,
  systemSettingsEnabled: false,
  // file locale directory:
  directory: null,
  locales: [],
  defaultLocale: null,

  lastLocaleUpdatedTimestamp: 0,

  // translations methods:
  fns: {},
  // translations cache
  cache: {},
  // translations with strings only:
  strCache: {},

  configure(c, we) {
    this.we = we;
    this.fileI18nConfig = c || {};

    if (c.locales) i18n.setLocales(c.locales);
    if (c.defaultLocale) i18n.setLocale(c.defaultLocale);
    if (c.directory) i18n.directory = c.directory;

    // system settings is avaible:
    if (typeof we.systemSettings == 'object') {
      this.systemSettingsEnabled = true;
    }

    this.setHooksAndEvents();

    this.loadFilesIFExists();
  },

  /**
   * Init middleware
   *
   * @param  {Object}   req
   * @param  {Object}   res
   * @param  {Function} next
   */
  init(req, res, next) {
    req.setLocale = (locale)=> {
      req.locale = locale;
      res.locale = locale;
      res.locals.locale = locale;
    };

    req.getLocale = ()=> {
      return req.locale;
    };

    req.setLocale(i18n.getDefaultLocale(req));

    req.__ = function __(t, params) {
      return i18n.__(t, params, req);
    };

    res.__ = req.__;
    res.locals.__ = req.__;

    next();
  },

  setHooksAndEvents() {
    const we = this.we;
    we.hooks.on('we:models:ready', (we, done)=> {
      i18n.loadAllTranslationsFromDB(done);
    });

    // on system settings start:
    we.hooks.on('system-settings:started', (we, done)=> {
      if (we.systemSettings) {
        if (we.systemSettings.defaultLocale) {
          this.defaultLocale = we.systemSettings.defaultLocale;
        }

        if (we.systemSettings.LLUT) {
          i18n.lastLocaleUpdatedTimestamp = Number(we.systemSettings.LLUT);
        }
      }

      done();
    });

    // on system settings change:
    we.events.on('system-settings:updated:after', (we)=> {
      if (we.systemSettings.LLUT) {
        if (we.systemSettings.LLUT > i18n.lastLocaleUpdatedTimestamp) {
          // should update ...
          i18n.loadTranslationChangesInDB();
          // set new timestamp:
          i18n.lastLocaleUpdatedTimestamp = Number(we.systemSettings.LLUT);
        }
      }
    });

  },

  /**
   * Set global locale
   * @param {String} locale locale to set as default
   */
  setLocale(locale) {
    this.defaultLocale = locale;
  },

  getDefaultLocale(req) {
    const cookieLocale = i18n.getLocaleFromCookie(req);
    if (cookieLocale) return cookieLocale;

    const queryLocale = i18n.getLocaleFromQuery(req);
    if (queryLocale) return queryLocale;

    return i18n.defaultLocale;
  },

  getLocaleFromCookie(req) {
    const c = i18n.fileI18nConfig.cookie;

    if (
      c &&
      req &&
      req.cookies &&
      req.cookies[c] &&
      i18n.locales.indexOf(req.cookies[c]) > -1
    ) {
      return req.cookies[c];
    }

    return null;
  },

  getLocaleFromQuery(req) {
    const q = i18n.fileI18nConfig.queryParameter;

    if (
      q &&
      req &&
      req.query &&
      req.query[q] &&
      i18n.locales.indexOf(req.query[q]) > -1
    ) {
      return req.query[q];
    }

    return null;
  },

  /**
   * Set global locales
   * @param {Array} locales array of locales strings
   */
  setLocales(locales) {
    this.locales = locales;
  },

  __(s, params, req) {
    if (
      req &&
      i18n.fns[req.locale] &&
      i18n.fns[req.locale][s]
    ) {
      return i18n.fns[req.locale][s](params);
    }

    if (
      i18n.defaultLocale &&
      i18n.fns[i18n.defaultLocale] &&
      i18n.fns[i18n.defaultLocale][s]
    ) {
      return i18n.fns[i18n.defaultLocale][s](params);
    }

    return s;
  },

  loadFilesIFExists() {
    for (let i = 0; i < this.locales.length; i++) {
      let d = i18n.loadFileIfExists(this.locales[i]);
      i18n.parseAndImportTraslations(d, this.locales[i]);
    }
  },

  loadFileIfExists(locale) {
    let file = path.join(this.directory, locale+'.json');

    try {
      let contents = fs.readFileSync(file);
      return JSON.parse(contents);
    } catch(e) {
      i18n.we.log.verbose('Error on parse location file:', {
        error: e
      });
    }

    return null;
  },

  parseAndImportTraslations(d, locale) {
    if (!d) return;

    if (!i18n.fns[locale]) i18n.fns[locale] = {};
    if (!i18n.cache[locale]) i18n.cache[locale] = {};
    if (!i18n.strCache[locale]) i18n.strCache[locale] = {};

    for (let s in d) {
      let t = d[s];

      i18n.parseAndImportTraslation({
        s: s,
        t: t,
        l: locale,
        isChanged: false
      }, locale);
    }
  },

  parseAndImportTraslation(r, locale) {
    if (!r || !r.s) return;
    if (!locale) return;

    if (r.t) {
      if (i18n.isTPLString(r.t)) {
        i18n.fns[locale][r.s] = hbs.compile(r.t);
      } else {
        i18n.fns[locale][r.s] = i18n.getSimpleTMethod(r.t);
      }

      i18n.strCache[locale][r.s] = r.t;
    } else {
      i18n.fns[locale][r.s] = i18n.getSimpleTMethod(r.s);
    }

    i18n.cache[locale][r.s] = r;
  },

  isTPLString(s) {
    // if the msg string contains {{Mustache}} patterns we render it as a mini tempalate
    if ((/{{.*}}/).test(s)) return true;
    return false;
  },

  getSimpleTMethod(t) {
    return function() {
      return t;
    };
  },

  loadAllTranslationsFromDB(done) {
    const we = this.we;

    let sql = `SELECT s, t, l, isChanged, updatedAt
      FROM t
      ORDER BY s, updatedAt`;
    we.db.defaultConnection.query(sql)
    .then( (r)=> {

      if (r && r[0] && r[0].length) {
        let ts = r[0];

        ts.forEach( (tRecord)=> {
          i18n.parseAndImportTraslation(tRecord, tRecord.l);
        });
      }

      done();
    })
    .catch( (e)=> {
      we.log.warn('we-core.i18n:Error on load db translations', {
        error: e
      });

      done();
    });
  },

  loadTranslationChangesInDB(done) {
    if (!done) done = function(){};

    const we = this.we;
    const changeTime = we.utils
      .moment
      .unix( this.lastLocaleUpdatedTimestamp )
      .utc()
      .format('YYYY/MM/DD HH:mm:ss');

    let sql = `SELECT
        s, t, l, isChanged, updatedAt
      FROM t
      WHERE updatedAt >= '${changeTime}'
      ORDER BY s, updatedAt`;
    we.db.defaultConnection.query(sql)
    .then( (r)=> {
      if (r && r[0] && r[0].length) {
        let ts = r[0];
        ts.forEach( (tRecord)=> {
          i18n.parseAndImportTraslation(tRecord, tRecord.l);
        });
      }

      done();
    })
    .catch( (e)=> {
      we.log.warn('we-core.i18n:Error on load db translations', {
        error: e
      });

      done();
    });
  },

  getCachedTranslations(locale) {
    if (locale) {
      return i18n.strCache[locale];
    } else {
      return i18n.strCache;
    }
  }
};

module.exports = i18n;