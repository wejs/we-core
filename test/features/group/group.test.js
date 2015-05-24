var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var _ = require('lodash');
var async = require('async');
var http;
var we;

describe('groupFeature', function () {
  var salvedGroup, salvedUser, salvedUserPassword, salvedUser2, salvedUser2Password;
  var authenticatedRequest, authenticatedRequest2;

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw err;

      salvedUser = user;
      salvedUserPassword = userStub.password;

      var stub = stubs.groupStub(user.id);
      we.db.models.group.create(stub)
      .then(function (g) {
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
          .then(function (p) {
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
          .expect(200).end(function() {

            var userStub = stubs.userStub();
            helpers.createUser(userStub, function(err, user) {
              if (err) throw err;
              salvedUser2 = user;
              salvedUser2Password = userStub.password;
              // login user and save the browser
              authenticatedRequest2 = request.agent(http);
              authenticatedRequest2.post('/login')
              .set('Accept', 'application/json')
              .send({
                email: salvedUser2.email,
                password: salvedUser2Password
              })
              .expect(200)

              .end(done);
            });
          });
        });
      })
    });
  });

  describe('find', function () {
    it('get /group route should find groups array', function (done) {
      request(http)
      .get('/group')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        console.log('>>',res.text)
        if (err) throw err;
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
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;
        assert(res.body.membership);
        assert( _.isArray(res.body.membership) , 'group not is array');
        assert(res.body.meta);
        done();
      });
    });

    it('get /user/[userId]/find-new-groups?where=%7B%7D&limit=9&sort=createdAt+DESC. route should find new groups to user', function (done) {

      var userStub = stubs.userStub();
      helpers.createUser(userStub, function(err, user) {
        if (err) throw err;
        var stub = stubs.groupStub(user.id);
        we.db.models.group.create(stub)
        .then(function (g) {
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
      .then(function (p) {
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
      .then(function (p) {
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

        salvedGroup.findOneMember(salvedUser.id, function(err, membership) {
          if (err) return done(err);

          assert.equal(membership.memberId,  salvedUser.id);

          done();
        });
      });
    });

    it('get /group/:groupId/member route should return membership users', function (done) {
      authenticatedRequest
      .get('/group/'+ salvedGroup.id + '/member')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(200, res.status);
        assert(res.body.membership);
        assert(res.body.meta.count);
        done();
      });
    });

    it('get /group/:groupId/member route should return membership users with role filter', function (done) {
      authenticatedRequest
      .get('/group/'+ salvedGroup.id +'/member?roleNames[]=manager&roleNames[]=moderator')
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
        assert(res.body.role);
        assert( _.isEqual(res.body.role, we.config.groupRoles) );
        done();
      });
    });
  });

  describe('groupACL', function () {
    before(function (done) {
      we.config.acl.disabled = false;
      done();
    });
    after(function (done) {
      we.config.acl.disabled = true;
      done();
    });

    describe('privateGroup', function () {
      var privateGroup, salvedPages = [];
      before(function (done) {
        var stub = stubs.groupStub(salvedUser.id);
        stub.privacity = 'private';
        we.db.models.group.create(stub)
        .then(function (g) {
          privateGroup = g;
          var pages = [
            stubs.pageStub(salvedUser.id),
            stubs.pageStub(salvedUser.id),
            stubs.pageStub(salvedUser.id)
          ];
          async.eachSeries(pages, function(page, next) {
            var pageStub = stubs.pageStub(salvedUser.id);
            we.db.models.page.create(pageStub)
            .then(function (p) {
              salvedPages.push(p);
              privateGroup.addContent('page', p.id, next);
            });
          }, function(err) {
            if (err) return done(err);
            done();
          });
        });
      });

      describe('privateGroupNotMember', function() {
        it('get /api/v1/group/:groupId/content route should return all group roles', function (done) {
          authenticatedRequest2
          .get('/api/v1/group/' + privateGroup.id + '/content')
          .set('Accept', 'application/json')
          .end(function (err, res) {
            if (err) return done(err);
            assert.equal(403, res.status);
            assert(_.isEmpty(res.body.group));
            done();
          });
        });

        it('post group invite engine should work', function (done) {
          this.slow(200);
          // invite one user
          authenticatedRequest
          .post('/group/' + privateGroup.id + '/member')
          .send({
            name: 'Santos Souza',
            email: salvedUser2.email,
            text: 'You are invited to our comunity!'
          })
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            assert(res.body.membershipinvite);
            assert.equal(res.body.membershipinvite.inviterId, salvedUser.id);
            assert.equal(res.body.membershipinvite.userId, salvedUser2.id);
            assert.equal(res.body.membershipinvite.groupId, privateGroup.id);
            assert(_.isEmpty(res.body.group));

            // check if the invite exits
            authenticatedRequest
            .get('/group/'+ privateGroup.id +'/members/invites')
            .set('Accept', 'application/json')
            .expect(200)
            .end(function (err, res) {
              if (err) return done(err);
              assert(res.body.membershipinvite);
              assert( _.isArray(res.body.membershipinvite) );

              // accept
              authenticatedRequest2
              .post('/group/' + privateGroup.id + '/accept-invite/')
              .set('Accept', 'application/json')
              .expect(200)
              .end(function (err, res) {
                if (err) return done(err);
                assert(res.body.membership);
                assert.equal(res.body.membership.memberId, salvedUser2.id);
                privateGroup.findOneMember(salvedUser2.id, function(err, membership) {
                  if (err) return done(err);
                  assert(membership);
                  done();
                });
              });
            });
          });
        });

        it('post /group/:groupId/leave should remove user from group', function (done) {
          authenticatedRequest2
          .post('/api/v1/group/'+ privateGroup.id +'/leave')
          .set('Accept', 'application/json')
          .end(function (err, res) {
            if (err) return done(err);
            assert.equal(204, res.status);
            privateGroup.findOneMember(salvedUser2.id, function(err, membership) {
              if (err) return done(err);
              assert(!membership);
              done();
            });
          });
        });
      });

      describe('privateGroupMember', function() {
        before(function (done) {
          authenticatedRequest2
          .post('/api/v1/group/'+ privateGroup.id +'/join')
          .set('Accept', 'application/json')
          .end(function (err, res) {
            if (err) return done(err);
            assert.equal(200, res.status);
            assert(res.body.membershiprequest);
            assert.equal(res.body.membershiprequest.userId, salvedUser2.id);
            assert.equal(res.body.membershiprequest.groupId, privateGroup.id);
            assert(!res.body.membership);
            done();
          });
        });

        it('get /api/v1/group/:groupId/content route should return all group roles', function (done) {
          authenticatedRequest2
          .get('/api/v1/group/' + privateGroup.id + '/content')
          .set('Accept', 'application/json')
          .end(function (err, res) {
            if (err) return done(err);
            assert.equal(403, res.status);
            assert(_.isEmpty(res.body.group));
            done();
          });
        });
      });
    });
  });
});
