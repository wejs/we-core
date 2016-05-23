// var assert = require('assert');
// var request = require('supertest');
// var helpers = require('we-test-tools').helpers;
// var stubs = require('we-test-tools').stubs;
// var http;
// var we;
// var agent;

// describe('routerAliasFeature', function() {
//   before(function (done) {

//     http = helpers.getHttp();
//     agent = request.agent(http);

//     we = helpers.getWe();

//     done();
//   });

//   describe('API', function() {

//     it('post /user should create a user with alias from header', function (done) {
//       var userStub = stubs.userStub();
//       request(http)
//       .post('/user')
//       .send(userStub)
//       .set('Accept', 'application/json')
//       .expect(201)
//       .end(function (err, res) {
//         if (err) {
//           console.error(res.text);
//           throw err;
//         }

//         assert(res.body.user);
//         assert.equal(res.body.user.linkPermanent,'/user/'+res.body.user.id);
//         assert(res.body.user.urlPath);
//         done();
//       });
//     });

//     it('put /user/:id should create a user and dont change alias on update', function (done) {
//       var userStub = stubs.userStub();
//       we.db.models.user.create(userStub)
//       .then(function (u){

//         var oldAlias = we.router.alias.forPath('/user/'+u.id);

//         request(http)
//         .put('/user/'+u.id)
//         .send({
//           username: 'wananingo'
//         })
//         .set('Accept', 'application/json')
//         .expect(200)
//         .end(function (err, res) {
//           if (err) throw err;

//           assert(res.body.user);
//           assert.equal(res.body.user.linkPermanent,'/user/'+res.body.user.id);
//           // assert.equal(res.body.user.urlPath, oldAlias);
//           done();
//         });
//       }).catch(done);
//     });

//     it('delete /user/:id should delete one user delete user alias alias', function (done) {
//       var userStub = stubs.userStub();
//       we.db.models.user.create(userStub)
//       .then(function (u){
//         request(http)
//         .delete('/user/' + u.id)
//         .set('Accept', 'application/json')
//         .expect(204)
//         .end(function (err) {
//           if (err) throw err;
//           assert(!we.router.alias.forPath('/user/'+u.id));
//           done();
//         });
//       }).catch(done);
//     });
//   });


//   after(function (done){
//     we.db.models.urlAlias
//     .destroy({ truncate: true })
//     .then(function(){
//       done();
//     }).catch(done);
//   });
// });