var assert = require('assert');
var request = require('supertest');
var helpers = require('../../helpers');
var stubs = require('../../stubs');
var _ = require('lodash');
var async = require('async');
var http;
var we;

describe('groupFeature', function () {
  var salvedGroup, salvedUser, salvedUserPassword, authenticatedRequest;

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw new Error(err);

      salvedUser = user;
      salvedUserPassword = userStub.password;

      var stub = stubs.groupStub(user.id);
      we.db.models.group.create(stub)
      .done(function (err, g) {
        if (err) return done(err);
        salvedGroup = g;

        var pages = [
          stubs.pageStub(salvedUser.id),
          stubs.pageStub(salvedUser.id),
          stubs.pageStub(salvedUser.id)
        ];

        var salvedPages = [];

        async.eachSeries(pages, function(page, next) {
          var pageStub = stubs.pageStub(salvedUser.id);
          we.db.models.page.create(pageStub)
          .done(function (err, p) {
            if (err) return next(err);
            salvedPages.push(p);
            salvedGroup.addContent('page', p.id, next);
          });
        }, function(err) {
          if (err) return done(err);

          // login user and save the browser
          authenticatedRequest = request.agent(http);
          authenticatedRequest.post('/login')
          .set('Accept', 'application/json')
          .send({
            email: salvedUser.email,
            password: salvedUserPassword
          })
          .expect(200)
          .end(done);
        });
      })
    });
  });

  describe('find', function () {
    it('get /group route should find groups array', function (done) {
      request(http)
      .get('/group')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        assert.equal(200, res.status);
        assert(res.body.group);
        assert( _.isArray(res.body.group) , 'group not is array');
        assert(res.body.meta);

        done();
      });
    });

    it('get /user/userId/membership route should find user memberships array', function (done) {
      authenticatedRequest
      .get('/user/'+ salvedUser.id +'/membership')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        assert.equal(200, res.status);
        assert(res.body.membership);
        assert( _.isArray(res.body.membership) , 'group not is array');
        assert(res.body.meta);
        done();
      });
    });

    it('get /user/[userId]/find-new-groups?where=%7B%7D&limit=9&sort=createdAt+DESC. route should find new groups to user', function (done) {

      var userStub = stubs.userStub();
      helpers.createUser(userStub, function(err, user) {
        if (err) throw new Error(err);
        var stub = stubs.groupStub(user.id);
        we.db.models.group.create(stub)
        .done(function (err, g) {
          if (err) return done(err);

          authenticatedRequest
          .get('/user/'+ salvedUser.id +'/find-new-groups?where=%7B%7D&limit=9&sort=createdAt+DESC')
          .set('Accept', 'application/json')
          .end(function (err, res) {
            assert.equal(200, res.status);
            assert(res.body.group);
            assert( _.isArray(res.body.group) , 'group not is array');
            assert(res.body.meta);

            var haveTheTestGroup = false;
            res.body.group.forEach(function(group){
              assert(group.id != salvedGroup.id);
              if (group.id == g.id) haveTheTestGroup = true;
            });

            assert(haveTheTestGroup);

            done();
          });
        });
      });
    });

    it('get /group?where=%7B%7D&limit=9&sort=createdAt+DESC route should find group list', function (done) {
      authenticatedRequest
      .get('/group?where=%7B%7D&limit=9&sort=createdAt+DESC')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        assert.equal(200, res.status);
        assert(res.body.group);
        assert( _.isArray(res.body.group) , 'group not is array');
        assert(res.body.meta);
        done();
      });
    });

  });

  describe('create', function () {

    it('post /group create one group record', function (done) {
      this.slow(150);

      var groupStub = stubs.groupStub(salvedUser.id);

      authenticatedRequest
      .post('/group')
      .send(groupStub)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(201, res.status);
        assert(res.body.group);
        assert(res.body.group[0].id);
        assert(res.body.group[0].name, groupStub.name);

        we.db.models.group.findAllGroupRoles(
          res.body.group[0].id,
        function(err, roles){
          if (err) return done(err);

          var roleNames = roles.map(function(role) {
            return role.get().name;
          });

          assert(roles.length >= 3, 'Wrong role length: '+ roles.length);

          assert(roleNames.indexOf('member') >-1);
          assert(roleNames.indexOf('moderator') >-1);
          assert(roleNames.indexOf('administrator') >-1);

          we.db.models.group.findAllMembers(res.body.group[0].id, function (err, memberships) {
            if(err) return done(err);

            var membersIds = memberships.map(function(membership) {
              return membership.memberId;
            });

            assert(membersIds.indexOf(salvedUser.id) > -1);
            done();
          });
        });
      });
    });
  });

  describe('findOne', function () {
    it('get /page/:id should return one page', function(done){
      request(http)
      .get('/group/' + salvedGroup.id)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(200, res.status);
        assert(res.body.group);
        assert(res.body.group[0].id, salvedGroup.id);
        assert(res.body.group[0].name, salvedGroup.name);
        assert.equal(res.body.group.length, 1);

        assert(res.body.group[0].meta.membersCount == 1);

        done();
      });
    });
  });

  describe('groupContent', function () {
    it('post /api/v1/group/:groupId/addContent/:contentModelName/:contentId route should add one content in group', function (done) {
      var pageStub = stubs.pageStub(salvedUser.id);
      we.db.models.page.create(pageStub)
      .done(function (err, p) {
        if (err) return done(err);

        request(http)
        .post('/api/v1/group/'+ salvedGroup.id +'/addContent/page/'+ p.id)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          if (err) return done(err);

          assert.equal(200, res.status);

          done();
        });
      })
    });

    it('delete /api/v1/group/:groupId/addContent/:contentModelName/:contentId route should remove content from group', function (done) {
      var pageStub = stubs.pageStub(salvedUser.id);
      we.db.models.page.create(pageStub)
      .done(function (err, p) {
        if (err) return done(err);
        salvedGroup.addContent('page', p.id, function(err) {
          if (err) return done(err);
          request(http)
          .delete('/api/v1/group/'+ salvedGroup.id +'/addContent/page/'+ p.id)
          .set('Accept', 'application/json')
          .end(function (err, res) {
            if (err) return done(err);

            assert.equal(204, res.status);

            salvedGroup.findContent('page', p.id, function(err, groupContent) {
              if (err) return done(err);

              assert(!groupContent);

              done();
            });

          });
        });
      })
    });

    it('get /api/v1/group/:groupId/content route should return a content list', function (done) {

      request(http)
      .get('/api/v1/group/'+ salvedGroup.id +'/content')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(200, res.status);
        assert(res.body.groupcontent);
        assert( _.isArray(res.body.groupcontent) , 'groupcontent not is array');
        assert(res.body.meta.count);
        assert(res.body.meta.count >= 3);

        done();
      });

    });

    it('get /api/v1/group/:groupId/content/:contentModelName route should return a content list with model name', function (done) {

      request(http)
      .get('/api/v1/group/'+ salvedGroup.id +'/content/page')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(200, res.status);
        assert(res.body.groupcontent);
        assert( _.isArray(res.body.groupcontent) , 'groupcontent not is array');
        assert(res.body.meta.count);
        assert(res.body.meta.count >= 3);

        done();
      });

    });

    it('get /api/v1/group/:groupId/content route should return 2 contents with limit', function (done) {

      request(http)
      .get('/api/v1/group/'+ salvedGroup.id +'/content?limit=2')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(200, res.status);
        assert(res.body.groupcontent);
        assert( _.isArray(res.body.groupcontent) , 'groupcontent not is array');
        assert.equal(res.body.groupcontent.length, 2);

        assert(res.body.meta.count);
        assert(res.body.meta.count >= 3);

        done();
      });

    });
  });

  describe('groupMembers', function () {
    it('post /api/v1/group/:groupId/join route should add authenticated user in group', function (done) {

      authenticatedRequest
      .post('/api/v1/group/'+ salvedGroup.id +'/join')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);

        assert.equal(200, res.status);
        assert(res.body.membership);
        assert.equal(res.body.membership.memberId, salvedUser.id);
        assert.equal(res.body.membership.memberName, 'user');


        salvedGroup.findOneMember(salvedUser.id, function(err, membership) {
          if (err) return done(err);

          assert.equal(membership.memberId,  salvedUser.id);
          assert.equal(res.body.membership.memberName, 'user');

          done();
        });
      });
    });

    it('get /group/:groupId/member route should return membership users', function (done) {

      authenticatedRequest
      .get('/group/'+ salvedGroup.id +'/member?roleNames[]=administrator&roleNames[]=moderator')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(200, res.status);
        assert(res.body.membership);
        assert(res.body.meta.count);
        done();
      });
    });

    it('post /api/v1/group/:groupId/leave route should add authenticated user in group', function (done) {

      authenticatedRequest
      .post('/api/v1/group/'+ salvedGroup.id +'/leave')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(204, res.status);

        salvedGroup.findOneMember(salvedUser.id, function(err, membership) {
          if (err) return done(err);
          assert(!membership);
          done();
        });
      });
    });

  });

  describe('groupRoles', function () {
    it('get /group/:groupId/roles route should return all group roles', function (done) {

      authenticatedRequest
      .get('/group/'+ salvedGroup.id +'/role')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(200, res.status);
        assert(res.body.membershiprole);
        assert(res.body.membershiprole.length > 2);
        assert(res.body.meta.count);
        done();
      });
    });
  });

  // describe('update', function () {
  //   it('put /page/:id should upate and return page', function(done){
  //     var newTitle = 'my new title';

  //     request(http)
  //     .put('/page/' + salvedPage.id)
  //     .send({
  //       title: newTitle
  //     })
  //     .set('Accept', 'application/json')
  //     .end(function (err, res) {
  //       if (err) return done(err);
  //       assert.equal(200, res.status);
  //       assert(res.body.page);
  //       assert(res.body.page[0].title, newTitle);

  //       salvedPage.title = newTitle;
  //       done();
  //     });
  //   });
  // });

  // describe('destroy', function () {
  //   it('delete /page/:id should delete one page', function(done){
  //     var pageStub = stubs.pageStub(salvedUser.id);
  //     we.db.models.page.create(pageStub)
  //     .done(function (err, p) {
  //       if (err) return done(err);
  //       request(http)
  //       .delete('/page/' + p.id)
  //       .set('Accept', 'application/json')
  //       .end(function (err, res) {
  //         if (err) return done(err);
  //         assert.equal(204, res.status);

  //         we.db.models.page.find(p.id).done( function(err, page){
  //           if (err) return done(err);

  //           assert.equal(page, null);
  //           done();
  //         })
  //       });
  //     })
  //   });
  // });
});
