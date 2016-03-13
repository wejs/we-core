var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var http;
var we;

function widgetStub() {
  return {
    title: 'a widgetTitle',
    layout: 'default',
    regionName: 'sidebar',
    type: 'html',
    theme: 'we-theme-site-wejs',
    configuration: {
      html: '<iframe width="560" height="315" src="https://www.youtube.com/embed/Oiyh33__Txw"'+
       'frameborder="0" allowfullscreen></iframe>'
    }
  }
}

describe('widgetFeature', function() {
  var salvedUser, salvedUserPassword;

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();
    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw new Error(err);
      salvedUser = user;
      salvedUserPassword = userStub.password;
      done();
    })
  });

  describe('CRUD', function() {
    it('post /login with we-widget-action=add should create one widget and return it in HTML', function (done) {
      var w = widgetStub();
      w.html =':) a html <strong>text</strong>';
      request(http)
      .post('/login')
      .set('we-widget-action', 'add')
      .send({
        widget: JSON.stringify(w)
      })
      .expect(201)
      .end(function (err, res) {
        if (err) throw err;
        assert(res.text);
        assert( res.text.indexOf(w.html) > -1 );
        done();
      });
    });

    it('post /login with we-widget-action=add should create one widget and return it as JSON', function (done) {
      var w = widgetStub();
      request(http)
      .post('/login')
      .set('we-widget-action', 'add')
      .send({
        widget: JSON.stringify(w)
      })
      .set('Accept', 'application/json')
      .expect(201)
      .end(function (err, res) {
        if (err) throw err;
        assert(res.body);
        assert(res.body.widget);
        assert(res.body.widget.html);
        assert.equal(res.body.widget.title, w.title);
        assert.equal(res.body.widget.regionName, w.regionName);
        done();
      });
    });

    it('post /login with we-widget-action=findOne should return one widget with HTML in JSON', function (done) {
      var w = widgetStub();

      we.db.models.widget.create(w)
      .then(function (record) {

        request(http)
        .post('/login')
        .set('we-widget-action', 'findOne')
        .send({
          widget: JSON.stringify({ id: record.id })
        })
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          assert(res.text.search(w.title) > -1);
          assert(res.text.search(w.configuration.html) > -1);
          done();
        });
      });
    });

    it('post /user we-widget-action=updateSort should sort 3 widgets and update weight'
      , function (done) {
        var path = '/user';
        var ws = [ widgetStub(), widgetStub(), widgetStub() ];

        for (var i = 0; i < ws.length; i++) {
          ws[i].title += ' ' + i;
          // add all widgets in same page
          ws[i].path = path;
        }

        we.db.models.widget.bulkCreate(ws).then(function () {
        we.db.models.widget.findAll({
          where: { path: path }
        }).then(function (records) {

          var widgets = records.map(function (w, i) {
            return { id: w.id, weight: i };
          });

          var ids = widgets.map(function (r) {
            return r.id;
          });

          request(http)
          .post(path)
          .set('we-widget-action', 'updateSort')
          .send({
            params: JSON.stringify({
              regionName: 'sidebar',
              layout: 'default'
            }),
            widgets: JSON.stringify(widgets)
          }).expect(200)
          .end(function (err, res) {
            if (err) {
              we.log.error('res.text: ', res.text);
              return done(err);
            }
            we.db.models.widget.findAll({
              where: {
                theme: 'we-theme-site-wejs',
                path: path,
                id: ids
              },
              order: 'weight ASC'
            }).then(function (widgets) {
              for (var i = 0; i < widgets.length; i++) {
                assert.equal(widgets[i].weight, i);
              }
              done();
            });
          });
        }); // findAll
        });// bulk create
      }
    );

    it('post /auth/forgot-password we-widget-action=find should return the widget list with suport to filter by region', function (done) {
      var path = '/auth/forgot-password';
      var ws = [ widgetStub(), widgetStub(), widgetStub() ];

      for (var i = 0; i < ws.length; i++) {
        ws[i].title += ' ' + i;
        // add all widgets in same page
        ws[i].path = path;
      }

      ws[0].regionName = 'afterContent';

      we.db.models.widget.bulkCreate(ws)
      .then(function () {
        request(http)
        .post(path)
        .expect(200)
        .set('Accept', 'application/json')
        .set('we-widget-action', 'find')
        .end(function (err, res) {
          if (err) {
            we.log.error('res.text:', res.text);
            throw err;
          }

          assert(res.body);
          assert(res.body.widget);
          assert(res.body.widget[0].html);
          done();
        });
      });
    });

    it('post /login with we-widget-action=update should update widget configuration', function (done) {
      var w = widgetStub();
      we.db.models.widget.create(w)
      .then(function (record) {
        var w = {
          id: record.id,
          title: 'a new title 123',
          configuration: {
            html: 'new html <strong>text</strong>'
          }
        };
        request(http)
        .post('/login')
        .set('we-widget-action', 'update')
        .send({ widget: JSON.stringify(w) })
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          assert(res.text.search(w.title) > -1);
          // assert(res.text.search(w.configuration.html) > -1);
          done();
        });
      });
    });

    it('post /login with we-widget-action=delete should delete one widget', function (done) {
      var w = widgetStub();
      we.db.models.widget.create(w)
      .then(function (record) {

        request(http)
        .post('/login')
        .set('we-widget-action', 'delete')
        .send({ widgetId: record.id })
        .expect(204)
        .end(function (err) {
          if (err) throw err;

          we.db.models.widget.findById(record.id)
          .then(function (r) {
            assert(!r);

            done();
          }).catch(done);

        });
      });
    });
  });

  describe('USAGE', function() {
    it('get / should return one HTML page build with widgets'
    //   , function (done) {

    //   // create some widgets with regions
    //   var ws = [ widgetStub(), widgetStub(), widgetStub() ];

    //   we.db.models.widget.bulkCreate(ws).then(function () {
    //     request(http)
    //     .get('/')
    //     .expect(200)
    //     .end(function (err, res) {
    //       if (err) throw err;

    //       assert(res.text);

    //       done();
    //     });
    //   });

    // }
    );
  });
});