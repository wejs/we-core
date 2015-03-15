// api/controllers/AuthController.js

var _ = require('lodash'),
  //sendAccontActivationEmail = require('../../lib/email/accontActivationEmail.js'),
  async = require('async'),
  util = require('util');
  //wejsErrs = require('we-lib-error-parser');

module.exports = {
  _config: {
    acl: false
  },

  // getter for current logged in user
  current: function (req, res) {
    if (!req.isAuthenticated() ) return res.forbidden();

    return res.ok(req.user);
  },

  // Signup method GET function
  signupPage: function (req, res) {
    var we = req.getWe();

    // log out user if it access register page
    we.auth.logOut(req, res, function(err) {
      if(err) we.log.error(err);
      setDefaultRegisterLocals(req, res);
      res.view('auth/register');
    });
  },

  // Signup method POST function
  signup: function Register(req, res) {
    var we = req.getWe();

    // anti spam field
    if (req.params.mel) {
      we.log.info('Bot get mel:', req.ip, req.params.email);
      return;
    }

    we.antiSpam.checkIfIsSpamInRegister(req, res, function (err, isSpam) {
      if (err) {
        we.log.error('signup:Error on checkIfIsSpamInRegister', err);
        return res.serverError();
      }

      var requireAccountActivation = we.config.auth.requireAccountActivation;

      var user = req.body;

      // if dont need a account activation email then create a active user
      if (!requireAccountActivation) {
        user.active = true;
      }

      var email = req.body.email;

      var confirmPassword = req.body.confirmPassword;
      var confirmEmail = req.body.confirmEmail;
      var errors;

      errors = validSignup(user, confirmPassword, confirmEmail, req, res);

      if ( ! _.isEmpty(errors) ) {
        // error on data or confirm password
        return res.send('400',{
          messages: errors
        });
      }

      we.db.models.user.find({ where: { email: email }}).done(function (err, usr) {
        if (err) {
          we.log.error('Error on find user by email.',err);
          return res.send(500, { error: req.__('Error') });
        }

        if (usr) {
          res.locals.messages = [{
            status: 'danger',
            field: 'email',
            rule: 'email',
            message: req.__('auth.register.email.exists')
          }];
          return res.badRequest();
        }

        we.db.models.user.create(user).done(function (error, newUser) {
          if (error) {
            we.log.error('signup:User.create:Error on create user', error);
            return res.serverError();
          }

          we.db.models.password.create({
            userId: newUser.id,
            password: user.password
          }).done(function (error, password) {
            if (error) {
              we.log.error('auth:signup: Error on generate user passport');
              return res.serverError(error);
            }

            newUser.setPassword(password);

            we.log.info('Auth plugin:New user:', user.email , 'username:' , user.username , 'ID:' , newUser.id);

            if (requireAccountActivation) {

              return we.db.models.authtoken.create({ userId: newUser.id })
              .done(function (error, token) {
                if(error) return res.serverError(error);

                var templateVariables = {
                  user: newUser,
                  site: {
                    name: we.config.appName
                  },
                  confirmUrl: we.config.hostname + '/user/'+ newUser.id +'/activate/' + token.token
                };

                var options = {
                  subject: req.__('we.email.AccontActivationEmail.subject', templateVariables),
                  to: newUser.email
                };

                return we.email.sendEmail('AccontActivationEmail',
                  options, templateVariables,
                function (err) {
                  if(err) {
                    we.log.error('Action:Login sendAccontActivationEmail:',err);
                    return res.serverError('Error on send activation email for new user', newUser);
                  }

                  res.status(201).send({
                    messages: [
                      {
                        status: 'warning',
                        message: req.__('auth.register.require.email.activation', {
                          email: newUser.email
                        })
                      }
                    ]
                  });

                });
              });
            }

            we.auth.logIn(req, res, newUser, function (err, passport) {
              if (err) {
                we.log.error('logIn error: ', err);
                return res.negotiate(err);
              }

              res.created({ token: passport.token, user: newUser });

            });
          });
        });
      });
    })
  },

  /**
   * Log out current user
   * Beware! this dont run socket.io disconect
   */
  logout: function (req, res) {
    var we = req.getWe();

    we.auth.logOut(req, res, function (err) {
      if (err)
        we.log.error('Error on logout user', req.id, req.cookie);
      res.redirect('/');
    })
  },

  /**
   * Login API
   *
   * This action receives the static and JSON request
   */
  login: function (req, res, next) {
    var we = getWe();

    var email = req.body.email;

    // TODO change this passport .authenticate to sails.auth.authenticate
    we.passport.authenticate('local', function(err, user, info) {
      if (err) {
        we.log.error('AuthController:login:Error on get user ', err, email);
        return  res.send(500, {
          messages: [{
            status: 'danger',
            message: req.__('unknow.error')
          }]
        });
      }

      if (!user) {
        we.log.debug('AuthController:login:User not found', email);
        return res.send(401,{
          messages: [{
            status: 'warning',
            message: req.__('auth.login.user.not-found', { email: email })
          }]
        });
      }

      if (!user.active) {
        we.log.debug('AuthController:login:User not active', email);
        return res.send(401,{
          messages: [{
            status: 'warning',
            message: req.__('auth.login.user.not.active', {email: email})
          }]
        });
      }

      we.auth.logIn(req, res, user, function (err) {
        if(err) return res.serverError(err);
        we.log.info('AuthController:login: user autheticated:', user.id, user.username);
        res.send(user);
      });

    })(req, res, next);
  },

  /**
   * Activate a user account with activation code
   */
  activate: function(req, res) {
    var we = req.getWe();

    var user = {};
    user.id = req.body.id;
    var token = req.body.token;

    var responseForbiden = function (){
      return res.send(403, {
        responseMessage: {
          errors: [
            {
              type: 'authentication',
              message: req.__('Forbiden')
            }
          ]
        }
      });
    };

    var validAuthTokenRespose = function (err, result, authToken){
      if (err) {
        return res.send(500, { error: req.__('Error') });
      }

      // token is invalid
      if(!result){
        return responseForbiden();
      }

      // token is valid then get user form db
      User.findOneById(user.id).exec(function(err, usr) {
        if (err) {
          return res.send(500, { error: req.__('DB Error') });
        }
        // user found
        if ( !usr ) {
          // user not found
          return responseForbiden();
        }

        // activate user and login
        usr.active = true;
        usr.save(function(err){
          if (err) {
            return res.send(500, { error: req.__('DB Error') });
          }

          // destroy auth token after use
          authToken.destroy(function (err) {
            if (err) we.log.error('Error on delete token', err);
          });

          // login and respond the user
          we.auth.logIn(req, res, usr, function(err){
            if(err){
              we.log.error('logIn error:', err);
              return res.negotiate(err);
            }
            return res.format({
             'text/html': function() {
                res.redirect('/');
             },

             'application/json': function(){
                console.log('send login result here ....');
                res.send(200, usr);
             }
            });
          });
        });
      });
    };
    AuthToken.validAuthToken(user.id, token, validAuthTokenRespose);
  },

  SendPasswordResetToken: function(req, res){
    console.log('TODO GetloginResetToken');

  },

  forgotPasswordPage: function(req, res) {
    res.locals.emailSend = false;

    res.locals.messages = [];
    res.locals.user = req.param('user');
    if (!res.locals.user) res.locals.user = {};
    res.locals.formAction = '/auth/forgot-password';

    // return home page and let emeberJs mount the page
    res.view('auth/forgot-password');
  },

  /**
   * Forgot password API endpoint
   */
  forgotPassword: function(req, res) {
    var email = req.param('email');

    res.locals.emailSend = false;
    res.locals.messages = [];
    res.locals.user = req.param('user');
    if (!res.locals.user) res.locals.user = {};
    res.locals.formAction = '/auth/forgot-password';

    if (!email) {
      return res.status(401).send({
        messages: [{
          status: 'warning',
          message: req.__('auth.forgot-password.field.email.required')
        }]
      });
    }

    User.findOneByEmail(email)
    .exec(function(error, user){
      if (error) {
        req._we.log.error('AuthController:forgotPassword: Error on find user by email', error);
        return res.status(500).send({
          messages: [{
            status: 'danger',
            message: req.__('unknow.error')
          }]
        });
      }

      if (!user) {
        req._we.log.warn('AuthController:forgotPassword: User not found', email);
        return res.status(401).send({
          messages: [{
            status: 'danger',
            type: 'not_found',
            message: req.__('auth.forgot-password.user.not-found')
          }]
        });
      }

      AuthToken.create({
        'userId': user.id,
        tokenType: 'resetPassword'
      }).exec(function(error, token) {
        if (error || !token) {
          req._we.log.error('AuthController:forgotPassword: Error on create authtoken', error);
          return res.status(500).send({
            messages: [{
              status: 'danger',
              message: req.__('unknow.error')
            }]
          });
        }

        var appName = we.config.appName;

        var options = {
          email: user.email,
          subject: appName + ' - ' + req.__('auth.forgot-password.reset-password'),
          from: we.config.email.siteEmail
        };

        user = user.toJSON();

        if (!user.displayName) {
          user.displayName = user.username;
        }

        var templateVariables = {
          user: {
            name: user.username,
            displayName: user.displayName
          },
          site: {
            name: appName,
            slogan: 'MIMI one slogan here',
            url: sails.config.hostname
          },
          resetPasswordUrl: token.getResetUrl()
        };

        sails.email.sendEmail(options, 'AuthResetPasswordEmail', templateVariables, function(err , emailResp){
          if (err) {
            we.log.error('Error on send email AuthResetPasswordEmail', err, emailResp);
          }

          we.log.info('AuthResetPasswordEmail: Email resp:', emailResp);

          if (req.wantsJSON) {
            return res.send({
              success: [{
                type: 'email_send',
                status: 'success',
                message: req.__('auth.forgot-password.email.send')
              }]
            });
          }

          res.locals.emailSend = true;
          req.flash('messages',[{
            type: 'email_send',
            status: 'success',
            message: req.__('auth.forgot-password.email.send', {
              displayName: user.displayName,
              email: email,
            })
          }]);

          res.redirect('/');
        });
      });
    });
  },

  authToken: function (req, res){
    if (!req.isAuthenticated()) return res.forbiden();

    var email = req.param('email');

    if(!email){
      return res.badRequest('Email is required to request a password reset token.');
    }

    User.findOneByEmail(email)
    .exec(function(error, user){
      if (error) {
        we.log.error(error);
        return res.serverError(error);
      }

      if (!user) return res.badRequest('unknow error trying to find a user');

      AuthToken.create({
        'userId': user.id,
        tokenType: 'resetPassword'
      }).exec(function(error, token) {
        if(error){
          we.log.error(error);
          return res.serverError(error);
        }
        if (!token) {
          return res.serverError('unknow error on create auth token');
        }
        return res.json(token.getResetUrl());
      });
    });
  },

  /**
   * Api endpoint to check if current user can change the password without old password
   */
  checkIfCanResetPassword: function(req, res) {
    if(!req.isAuthenticated()) return res.forbiden();

    if (req.session && req.session.resetPassword) {
      res.status(200).send({
        messages: [{
          status: 'success',
          message: req.__('auth.reset-password.success.can')
        }]
      })
    } else {
      res.status(403).send({
        messages: [{
          status: 'danger',
          message: req.__('auth.reset-password.error.forbidden')
        }]
      })
    }
  },


  consumeForgotPasswordToken: function (req, res) {
    var uid = req.param('uid');
    var token = req.param('token');
    var sails = we;

    if(!uid || !token){
      we.log.info('consumeForgotPasswordToken: Uid of token not found', uid, token);
      return res.badRequest();
    }

    loadUserAndAuthToken(uid, token, function(error, user, authToken){
      if (error) {
        we.log.error('AuthController:consumeForgotPasswordToken: Error on loadUserAndAuthToken', error);
        return res.serverError(error);
      }

      if (!user || !authToken) {
        we.log.warn('consumeForgotPasswordToken: invalid token: ', token, ' for uid: ', uid);

        req.flash('messages',[{
          status: 'warning',
          type: 'updated',
          message: req.__('auth.consumeForgotPasswordToken.token.invalid')
        }]);
        return res.redirect('/auth/forgot-password');
      }

      if (user.active) {
        return respondToUser();
      } else {
        // If user dont are active, change and salve the active status
        user.active = true;
        user.save(function (err) {
          if (err) {
            we.log.error('Error on change user active status', err, user);
            return res.serverError(err);
          }
          respondToUser();
        });
      }

      function respondToUser() {
        we.auth.logIn(req, res, user, function (err) {
          if (err) {
            we.log.error('AuthController:consumeForgotPasswordToken:logIn error', err);
            return res.serverError(err);
          }
          // consumes the token
          authToken.isValid = false;
          authToken.save();
          // set session variable req.session.resetPassword to indicate that there is a new password to be defined
          req.session.resetPassword = true;

          if (req.wantsJSON) {
            res.send('200', authToken);
          } else {
            // res.redirect( '/auth/' + user.id + '/reset-password/' + authToken.id);
            res.redirect( '/auth/' + user.id + '/new-password/');
          }
        });
      }
    });
  },

  newPasswordPage: function(req, res, next) {
    if(!req.isAuthenticated()) return res.redirect('/');

    var userId = req.param('id');

    if (!userId) return next();

    if (userId != req.user.id) return res.redirect('/auth/forgot-password');

    // res.locals.oldPassword = req.param('password');
    // res.locals.newPassword = req.param('newPassword');
    // res.locals.rNewPassword = req.param('rNewPassword');
    res.locals.formAction = '/auth/' + req.user.id + '/new-password';
    res.locals.user = req.user;
    res.view('auth/new-password');
  },

  newPassword: function (req, res, next) {
    if(!req.isAuthenticated()) return res.redirect('/');
    if (!req.user.isAdmin && !req.session.resetPassword) return res.forbidden();

    var sails = we;
    var User = sails.models.user;

    var newPassword = req.param('newPassword');
    var rNewPassword = req.param('rNewPassword');
    // var userId = req.param('id');
    var userId = req.user.id;

    // TODO move this access check to one policy
    if(!req.isAuthenticated() || req.user.id != userId) {
      if (req.wantsJSON) {
        return res.send(403, {
          responseMessage: {
            errors: [
              {
                type: 'authentication',
                message: req.__('Forbiden')
              }
            ]
          }
        });
      } else {
        res.locals.messages = [{
          status: 'danger',
          type: 'forbiden',
          message: req.__('auth.fochange-password.forbiden')
        }];
        return sails.controllers.auth.newPasswordPage(req, res, next);
      }

    }

    var errors = [];

    //we.log.info('newPassword:' , newPassword , '| rNewPassword:' , rNewPassword);

    if( _.isEmpty(newPassword) || _.isEmpty(rNewPassword) ){
      errors.push({
        type: 'validation',
        field: 'rNewPassword',
        rule: 'required',
        status: 'danger',
        message: req.__('Field <strong>Confirm new password</strong> and <strong>New Password</strong> is required')
      });
    }

    if(newPassword !== rNewPassword){
      errors.push({
        type: 'validation',
        field: 'newPassword',
        rule: 'required',
        status: 'danger',
        message: req.__('<strong>New password</strong> and <strong>Confirm new password</strong> are different')
      });
    }

    if( ! _.isEmpty(errors) ) {
      if (req.wantsJSON) {
        // erro,r on data or confirm password
        return res.send('400',{
          messages: errors
        });
      } else {
        res.locals.messages = [];
        for (var i = 0; i < errors.password.length; i++) {
          errors.password[i].status = 'danger';
          res.locals.messages.push(errors.password[i]);
        }
        return sails.controllers.auth.newPasswordPage(req, res, next);
      }
    }

    User.findOneById(userId)
    .exec(function(error, user){
      if(error){
        we.log.error('newPassword: Error on get user', user);
        return res.negotiate(error);
      }

      if(!user){
        we.log.info('newPassword: User not found', user);
        return res.negotiate(error);
      }

      // set newPassword and save it for generate the password hash on update
      user.newPassword = newPassword;
      user.save(function(err) {
        if(err) we.log.error('Error on save user to update password',err);

        req.flash('messages',[{
          status: 'success',
          type: 'updated',
          message: req.__('New password set successfully')
        }]);

        // Reset req.session.resetPassword to indicate that the operation has been completed
        delete req.session.resetPassword;

        if (req.wantsJSON) {
          return res.send('200',{messages: res.locals.messages});
        }
        return res.redirect('/account');
      });
    });
  },

  changePasswordPage: function(req, res, next) {
    if(!req.isAuthenticated()) return res.redirect('/');

    // var userId = req.param('id');

    // if (!userId) return next();

    // if (userId != req.user.id) return res.redirect('/auth/' + req.user.id + '/change-password');

    res.locals.oldPassword = req.param('password');
    res.locals.newPassword = req.param('newPassword');
    res.locals.rNewPassword = req.param('rNewPassword');
    res.locals.formAction = '/change-password';

    res.locals.user = req.user;

    res.view('auth/change-password');
  },

  changePassword: function (req, res, next) {
    if(!req.isAuthenticated()) return res.redirect('/');
    var sails = we;
    var User = sails.models.user;

    var oldPassword = req.param('password');
    var newPassword = req.param('newPassword');
    var rNewPassword = req.param('rNewPassword');
    // var userId = req.param('id');
    var userId = req.user.id;

    // TODO move this access check to one policy
    // if(!req.isAuthenticated() || req.user.id != userId) {
    if(!req.isAuthenticated()) {
      res.locals.messages = [{
        status: 'danger',
        type: 'forbiden',
        message: req.__('auth.change-password.forbiden')
      }];
      if (req.wantsJSON) {
        return res.send(403, { messages: res.locals.messages });
      } else {
        return sails.controllers.auth.changePasswordPage(req, res, next);
      }
    }

    var errors = [];

    // skip old password if have resetPassword flag in session
    if (!req.session.resetPassword) {
      if (!oldPassword) {
        errors.push({
          type: 'validation',
          field: 'oldPassword',
          status: 'danger',
          rule: 'required',
          message: req.__("field.password.required")
        });
      }
    }

    if( _.isEmpty(newPassword) || _.isEmpty(rNewPassword) ){
      errors.push({
        type: 'validation',
        field: 'rNewPassword',
        rule: 'required',
        status: 'danger',
        message: req.__('field.confirm-password.password.required')
      });
    }

    if(newPassword !== rNewPassword){
      errors.push({
        type: 'validation',
        field: 'newPassword',
        rule: 'required',
        status: 'danger',
        message: req.__('field.password.confirm-password.diferent')
      });
    }

    if( ! _.isEmpty(errors) ) {
      res.locals.messages = errors;
      if (req.wantsJSON) {
        // erro,r on data or confirm password
        return res.send('400',{
          messages: res.locals.messages
        });
      } else {
        return sails.controllers.auth.changePasswordPage(req, res, next);
      }
    }

    User.findOneById(userId)
    .exec(function(error, user){
      if (error) {
        we.log.error('resetPassword: Error on get user', user);
        return res.negotiate(error);
      }

      if (!user) {
        we.log.info('resetPassword: User not found', user);
        return res.negotiate(error);
      }

      // skip password check if have resetPassord flag actives
      if (req.session.resetPassword) {
        return changePassword();
      } else {
        user.verifyPassword(oldPassword, function(err, passwordOk) {
          if (!passwordOk) {
            var errors = [{
              type: 'validation',
              field: 'password',
              rule: 'wrong',
              status: 'danger',
              message: req.__('field.password.invalid')
            }];
            if (req.wantsJSON) {
              // erro,r on data or confirm password
              return res.send('400',{
                messages: errors
              });
            } else {
              res.locals.messages = errors;
              return sails.controllers.auth.changePasswordPage(req, res, next);
            }
          }

          return changePassword();
        });
      }

      function changePassword() {
        // set newPassword and save it for generate the password hash on update
        user.newPassword = newPassword;
        user.save(function(err) {
          if(err) we.log.error('Error on save user to update password',err);

          // Reset req.session.resetPassword to indicate that the operation has been completed
          delete req.session.resetPassword;

          var appName = we.config.appName;

          var options = {
            email: user.email,
            subject: appName + ' - ' + req.__('auth.change-password.reset-password'),
            from: we.config.email.siteEmail
          };

          user = user.toJSON();

          if (!user.displayName) {
            user.displayName = user.username;
          }

          var templateVariables = {
            user: {
              name: user.username,
              displayName: user.displayName
            },
            site: {
              name: appName,
              slogan: 'MIMI one slogan here',
              url: sails.config.hostname
            }
          };

          sails.email.sendEmail(options, 'AuthChangePasswordEmail', templateVariables, function(err , emailResp){
            if (err) {
              we.log.error('Error on send email AuthChangePasswordEmail', err, emailResp);
            }

            res.locals.messages = [{
              status: 'success',
              type: 'updated',
              message: req.__('auth.change-password.success')
            }];

            we.log.info('AuthChangePasswordEmail: Email resp:', emailResp);

            if (req.wantsJSON) {
              return res.send('200',{ messages: res.locals.messages });
            }
            return sails.controllers.auth.changePasswordPage(req, res, next);

          });
        });
      }

    });
  }
};

/**
 * Default local variables for register locals
 *
 * @param {object} req express.js request
 * @param {object} res express.js response object
 */
function setDefaultRegisterLocals(req, res){

  var user = actionUtil.parseValues(req);

  res.locals.messages = [];
  res.locals.user = user;
  res.locals.formAction = '/signup';
  res.locals.service = req.param('service');
  res.locals.consumerId = req.param('consumerId');
  res.locals.interests = [];
}

/**
 * Load user and auth token
 * @param  {string}   uid      user id
 * @param  {string}   token    user token
 * @param  {Function} callback    callback(error, user, authToken)
 */
var loadUserAndAuthToken = function(uid, token, callback){
  User.findOneById(uid).exec(function (error, user) {
    if (error) {
      we.log.error('consumeForgotPasswordToken: Error on get user', user, token);
      return callback(error, null, null);
    }

    if (!user) {
      // user not found
      return callback(null, null, null);
    }

    AuthToken.findOneByToken(token)
    .where({
      userId: user.id,
      token: token,
      isValid: true
    })
    .exec(function(error, authToken){
      if (error) {
        we.log.error('consumeForgotPasswordToken: Error on get token', user, token);
        return callback(error, null, null);
      }

      if (authToken) {
        return callback(null, user, authToken);
      }else{
        return callback(null, user, null);
      }
    });
  });
};

function validSignup(user, confirmPassword, confirmEmail, req, res){
  var errors = [];

  if(!user.email){
    errors.push({
      type: 'validation',
      status: 'danger',
      field: 'email',
      rule: 'required',
      message: req.__('Field <strong>email</strong> is required')
    });
  }

  if(!confirmEmail){
    errors.push({
      type: 'validation',
      status: 'danger',
      field: 'confirmEmail',
      rule: 'required',
      message: req.__('Field <strong>Confirm email</strong> is required')
    });
  }

  // check if password exist
  if(!user.password){
    errors.push({
      type: 'validation',
      status: 'danger',
      field: 'password',
      rule: 'required',
      message: req.__('Field <strong>password</strong> is required')
    });
  }

  if(!confirmPassword){
    errors.push({
      type: 'validation',
      status: 'danger',
      field: 'confirmPassword',
      rule: 'required',
      message: req.__('Field <strong>Confirm new password</strong> is required')
    });
  }

  if(confirmPassword !== user.password){
    errors.push({
      type: 'validation',
      status: 'danger',
      field: 'password',
      rule: 'required',
      message: req.__('<strong>New password</strong> and <strong>Confirm new password</strong> are different')
    });
  }

  if(confirmEmail !== user.email){
    errors.push({
      type: 'validation',
      status: 'danger',
      field: 'email',
      rule: 'required',
      message: req.__('<strong>Email</strong> and <strong>Confirm email</strong> are different')
    });
  }

  return errors;
};
