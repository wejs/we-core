// var assert = require('assert');
// var request = require('supertest');
// var helpers = require('we-test-tools').helpers;
// var stubs = require('we-test-tools').stubs;
// var http;
// var we;
// var agent;

// describe('mainFeature', function () {
//   var salvedUser, salvedUserPassword;
//   var authenticatedRequest;

//   before(function (done) {
//     http = helpers.getHttp();
//     agent = request.agent(http);

//     we = helpers.getWe();
//     var userStub = stubs.userStub();
//     helpers.createUser(userStub, function(err, user) {
//       if (err) throw err;

//       salvedUser = user;
//       salvedUserPassword = userStub.password;

//       // login user and save the browser
//       authenticatedRequest = request.agent(http);
//       authenticatedRequest.post('/login')
//       .set('Accept', 'application/json')
//       .send({
//         email: salvedUser.email,
//         password: salvedUserPassword
//       })
//       .expect(200)
//       .set('Accept', 'application/json')
//       .end(function () {
//         done();
//       });
//     })

//   });

//   it('get / should load main.index route', function (done) {
//     request(http)
//     .get('/')
//     .expect(200)
//     .end(function (err, res) {
//       if (err) throw err;
//       assert(res.text.indexOf('We test') > -1);
//       done();
//     });
//   });

//   it('get /api/v1/configs.json should return public configs', function (done) {
//     request(http)
//     .get('/api/v1/configs.json')
//     .set('Accept', 'application/json')
//     .expect(200)
//     .end(function (err, res) {
//       if (err) throw err;

//       assert.equal('test', res.body.env);
//       assert.equal('We test', res.body.appName);
//       assert(res.body.auth);
//       assert(res.body.acl);

//       done();
//     });
//   });

//   it('get /api/v1/routes should return all routes', function (done) {
//     request(http)
//     .get('/api/v1/routes')
//     .set('Accept', 'application/json')
//     .expect(200)
//     .end(function (err, res) {
//       if (err) throw err;
//       assert(res.body);
//       assert(res.body['/admin/permission']);
//       done();
//     });
//   });

// });