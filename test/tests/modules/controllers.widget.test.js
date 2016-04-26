var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var sinon = require('sinon');
var controller, we;

var getWidgetStub = function() {
  return {
    title: 'A widget title',
    type: 'html',
    theme: 'we-theme-site-wejs',
    regionName: 'sidebar',
    layout: 'home'
  }
}

describe('controllers.widget', function () {
  var user, widgets = [];

  before(function (done) {
    controller = require('../../../server/controllers/widget.js');
    we = helpers.getWe();
    var userStub = stubs.userStub();
    helpers.createUser(userStub, function (err, u) {
      if(err) throw err;
      user = u;

      var ws = [
        getWidgetStub(),
        getWidgetStub(),
        getWidgetStub()
      ];

      we.utils.async.each(ws, function(w, done){
        we.db.models.widget.create(w)
        .then(function (r){
          widgets.push(r);
          done();
        }).catch(done);
      }, done);
    });
  });
  describe('controllers.widget.create', function () {
    it('create action should run res.created and set creatorId for valid data', function (done) {
      var req = {
        we: we,
        user: user,
        body: getWidgetStub(),
        accepts: function(){ return false }
      };
      var res = { locals: {
        theme: 'we-theme-site-wejs',
        getTheme: function getTheme() {
          return we.view.themes['we-theme-site-wejs'];
        },
        Model: we.db.models.widget
      }, created: function(){
        assert.equal(res.locals.data.type, 'html');
        assert.equal(res.locals.data.title, 'A widget title');

        res.locals.data.destroy().then(function(){
          done();
        });
      }};
      controller.create(req, res);
    });
  });

  describe('controllers.widget.sortWidgets', function () {
    it('sortWidgets action should run we.controllers.widget.sortWidgetsList if req.method!=POST', function (done) {
      sinon.spy(we.controllers.widget, 'sortWidgetsList');
      var req = {
        method: 'GET',
        we: we,
        path: '/',
        user: user,
        params: {
          layoutName: 'default',
          regionName: 'sidebar'
        },
        body: {},
        query: {}
      };
      var res = {
        getTheme: function getTheme() {
          return we.view.themes['we-theme-site-wejs'];
        },
        locals: { layoutName: 'default' },
        ok: function(){
          assert(we.controllers.widget.sortWidgetsList.called);
          we.controllers.widget.sortWidgetsList.restore();
          done();
        }
      };
      controller.sortWidgets(req, res);
    });

    it('sortWidgets action should run res.badRequest if widgets body params not is set', function (done) {
      var req = {
        method: 'POST',
        we: we,
        path: '/',
        user: user,
        params: {},
        body: {}
      };
      var res = {
        getTheme: function getTheme() {
          return we.view.themes['we-theme-site-wejs'];
        },
        locals: { layoutName: 'default' },
        badRequest: function(){
          done();
        }
      };
      controller.sortWidgets(req, res);
    });

    it('sortWidgets action should update widgets with valid date', function (done) {
      var c=0;
      var req = {
        method: 'POST',
        we: we,
        path: '/',
        user: user,
        params: {
          theme: 'we-theme-site-wejs',
          regionName: 'sidebar',
          layout: 'home'
        },
        query:{},
        body: {
          widgets: widgets.map(function (w) {
            c++;
            return { id: w.id, weight: c };
          })
        }
      };
      var res = {
        getTheme: function getTheme() {
          return we.view.themes['we-theme-site-wejs'];
        },
        locals: { layoutName: 'default' },
        send: function(r) {
          assert(r.widget);
          for (var i = 0; i < r.widget.length; i++) {
            // widget order is same bug with diferent weights
            assert.equal(r.widget[i].id, widgets[i].id);
          }
          done();
        }
      };
      controller.sortWidgets(req, res);
    });

    it('sortWidgets action should run res.serverError if we.db.models.widget.update retur error', function (done) {


      var oldFN = we.db.models.widget.update;

      we.db.models.widget.update = function() {
        return {
          then: function() { return this; },
          catch: function(cb) {
            cb(new Error('a test error'));
          }
        }
      }
      var c = 0;
      var req = {
        __: we.i18n.__,
        method: 'POST',
        we: we,
        path: '/',
        user: user,
        params: {
          theme: 'we-theme-site-wejs',
          regionName: 'sidebar',
          layout: 'home'
        },
        query: {},
        body: {
          widgets: widgets.map(function (w) {
            c++;
            return { id: w.id, weight: 'invalid' };
          })
        }
      };
      var res = {
        getTheme: function getTheme() {
          return we.view.themes['we-theme-site-wejs'];
        },
        locals: { layoutName: 'default' },
        serverError: function() {
          we.db.models.widget.update = oldFN;
          done();
        }
      };
      controller.sortWidgets(req, res);
    });
  });

  describe('controllers.widget.findOne', function () {
    it('findOne action should run next if res.locals.data not id set ', function (done) {
      var req = {
        method: 'GET', we: we, params: {}
      };
      var res = { locals: { } };
      controller.findOne(req, res, function(){
        done();
      });
    });
    it('findOne action should run res.ok for json responseType', function (done) {
      var req = {
        method: 'GET',
        we: we,
        path: '/',
        params: {
          theme: 'we-theme-site-wejs',
          regionName: 'sidebar',
          layout: 'home'
        },
        accepts: function(){ return false }
      };
      var res = { locals: {
        theme: 'we-theme-site-wejs',
        responseType: 'json',
        data: widgets[0]
      },
      status: function() {},
      ok: function(){
        done();
      } };
      controller.findOne(req, res);
    });
  });

  describe('controllers.widget.getSelectWidgetTypes', function () {
    it('getSelectWidgetTypes should return widget types', function (done) {
      var req = {
        __: we.i18n.__,
        query: {},
        path: '/',
        method: 'GET', we: we, params: {}
      };
      var res = { locals: { }, send: function(r){
        assert(r.widget);
        done();
      }};
      controller.getSelectWidgetTypes(req, res);
    });
  });

  describe('controllers.widget.getCreateForm', function () {
    it('getCreateForm should run next if params.type or params.theme not is set', function (done) {
      var req = {
        query: {},
        path: '/',
        method: 'GET', we: we, params: {}
      };
      var res = { locals: { } };
      controller.getCreateForm(req, res, function() {
        done();
      });
    });

    it('getCreateForm should run next if not found layoutToUpdate', function (done) {
      var req = {
        query: {},
        path: '/',
        method: 'GET', we: we, params: {
          type: 'html',
          theme: 'we-theme-site-wejs',
          layout: 'invalid'
        }
      };
      var res = { locals: { } };
      controller.getCreateForm(req, res, function() {
        done();
      });
    });

    it('getCreateForm should run res.serverError if formMiddleware return error', function (done) {

      var oldFN = we.view.widgets.html.formMiddleware;
      we.view.widgets.html.formMiddleware = function(req, res, next) {
        return next(new Error('a test error'))
      }

      var req = {
        query: {},
        path: '/',
        method: 'GET', we: we, params: {
          type: 'html',
          theme: 'we-theme-site-wejs',
          layout: 'home'
        }
      };
      var res = { locals: { }, serverError: function() {
        we.view.widgets.html.formMiddleware = oldFN;
        done();
      }};

      res.req = req;
      controller.getCreateForm(req, res);
    });


    it('getCreateForm should run res.send for valid data', function (done) {
      var req = {
        query: {},
        path: '/',
        method: 'GET', we: we, params: {
          type: 'html',
          theme: 'we-theme-site-wejs',
          layout: 'home'
        },
        accepts: function(){ return true }
      };
      var res = { locals: {
        context: 'events-1',
        selectedRegion: 'afterContent',
        __: we.i18n.__
      },
      status: function(){},
      send: function() {
        done();
      }};
      res.req = req;
      controller.getCreateForm(req, res);
    });
  });


  describe('controllers.widget.getForm', function () {
    it('getForm should run next not find the record', function (done) {
      var req = {
        we: we, params: { id: '1231233'}
      };
      var res = { locals: {
        Model: we.db.models.widget
      } };
      controller.getForm(req, res, function() {
        done();
      });
    });

    it('getForm should run res.serverError formMiddleware return error', function (done) {
      var oldFN = we.view.widgets.html.formMiddleware;
      we.view.widgets.html.formMiddleware = function(req, res, next) {
        return next(new Error('a test error'))
      }

      var req = {
        query: {},
        path: '/',
        method: 'GET', we: we, params: {
          id: widgets[0].id
        }
      };
      var res = { locals: {
        Model: we.db.models.widget
      },
      status: function() {},
      serverError: function() {
        we.view.widgets.html.formMiddleware = oldFN;
        done();
      }};
      res.req = req;
      controller.getForm(req, res);
    });

    it('getForm should run send with valid data and html response', function (done) {
      var req = {
        __: we.i18n.__,
        we: we,
        params: { id: widgets[0].id },
        accepts: function(){ return true }
      };
      var res = { locals: {
        Model: we.db.models.widget,
        responseType: 'html',
        __: we.i18n.__,
      },
      status: function() {},
      send: function() {
        done();
      } };
      controller.getForm(req, res);
    });

    it('getForm should run send with valid data and json response', function (done) {
      var req = {
        __: we.i18n.__,
        we: we,
        params: { id: widgets[0].id },
        accepts: function(){ return false }
      };
      var res = { locals: {
        Model: we.db.models.widget,
        responseType: 'json',
        __: we.i18n.__,
      },
      status: function() {},
      ok: function() {
        assert.equal(res.locals.data.id, widgets[0].id);
        done();
      } };
      controller.getForm(req, res);
    });
  });
});