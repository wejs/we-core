var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var sinon = require('sinon');
var moment = require('moment');
var we;

describe('coreHelpers', function () {

  before(function (done) {
    we = helpers.getWe();
    done();
  });

  describe('canHelper', function () {
    var helper;

    before(function (done) {
      helper = require('../../../server/helpers/can.js')(we);
      done();
    });

    it('canHelper should run fn if user has access to permission', function (done) {
      helper.bind({
        context: 'ctx'
      })({
        hash: {
          permission: 'find_user',
          roles: ['authenticated']
        },
        fn: function(ctx) {
          assert(ctx);
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });

    it('canHelper should run inverse if user done have access to permission', function (done) {
      we.config.acl.disabled = false;
      helper.bind({
        context: 'ctx'
      })({
        hash: {
          permission: 'find_user',
          roleNames: ['authenticated']
        },
        inverse: function(ctx) {
          assert(ctx);
          assert.equal('ctx', ctx.context);
          we.config.acl.disabled = true;
          done();
        }
      });
    });
  });

  describe('ifCondHelper', function () {
    var helper;

    before(function (done) {
      helper = require('../../../server/helpers/ifCond.js')(we);
      done();
    });

    it('ifCondHelper should should run fn if v1 === v2 ', function (done) {
      helper.bind({
        context: 'ctx'
      })(1, 1, {
        fn: function(ctx) {
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });

    it('ifCondHelper should run inverse v1 !== v2', function (done) {
      helper.bind({
        context: 'ctx'
      })(1, 2, {
        inverse: function(ctx) {
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });
  });

  describe('isArrayHelper', function () {
    var helper;

    before(function (done) {
      helper = require('../../../server/helpers/isArray.js')(we);
      done();
    });

    it('isArrayHelper should run fn if v1 is array', function (done) {
      helper.bind({
        context: 'ctx'
      })([':)'], {
        fn: function(ctx) {
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });

    it('isArrayHelper should run inverse if v1 not is array', function (done) {
      helper.bind({
        context: 'ctx'
      })('string', {
        inverse: function(ctx) {
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });
  });

  describe('isPairHelper', function () {
    var helper;

    before(function (done) {
      helper = require('../../../server/helpers/isPair.js')(we);
      done();
    });
    it('isPairHelper should should run fn if index number is pair', function (done) {
      helper.bind({
        context: 'ctx'
      })(10, {
        fn: function(ctx) {
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });
    it('isPairHelper should run inverse if index not is pair', function (done) {
      helper.bind({
        context: 'ctx'
      })(3, {
        inverse: function(ctx) {
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });
    it('isPairHelper should run inverse if index not is a Number', function (done) {
      helper.bind({
        context: 'ctx'
      })('a string', {
        inverse: function(ctx) {
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });
  });

  describe('layoutHelper', function () {
    var helper;

    before(function (done) {
      helper = require('../../../server/helpers/layout.js')(we);
      done();
    });

    it('layoutHelper should run we.view.renderTemplate and return a html text', function (done) {
      // set spy to check if renderTemplate is called
      sinon.spy(we.view, 'renderTemplate');

      var text = helper.bind({
        context: 'ctx'
      })('default', {
        data: {
          root: { regions: { default: { widgets: [] } } }
        }
      });

      assert(text);
      assert(we.view.renderTemplate.called);
      // then remove the spy
      we.view.renderTemplate.restore();

      done();
    });
  });

  describe('linkToHelper', function () {
    var helper;

    before(function (done) {
      helper = require('../../../server/helpers/link-to.js')(we);
      done();
    });

    it('linkToHelper should return a url from valid find /user url', function (done) {
      var text = 'a link text';
      var url = helper.bind({
        context: 'ctx'
      })('user.find', {
        hash: { rel: 'rel' },
        fn: function() {  return text; }
      });

      assert(url.string);
      assert(url.string.indexOf('"/user"') >-1 );
      assert(url.string.indexOf(text) >-1 );
      assert(url.string.indexOf('rel="rel"') >-1 );

      done();
    });
  });

  describe('paginateHelper', function () {
    var helper;

    before(function (done) {
      helper = require('../../../server/helpers/paginate.js')(we);
      done();
    });

    it('paginateHelper should render one pagination html', function (done) {
      var text = helper.bind({
        context: 'ctx'
      })({
        hash: {
          count: 100, limit: 10,
          req: {
            res: { locals: {} },
            query: {}
          }
        },
        data: {
          root: { theme: 'app' }}
      });

      assert(text.string);
      assert(text.string.indexOf('<span>10</span>') >-1 );
      assert(text.string.indexOf('href="?page=1"') >-1 );
      assert(text.string.indexOf('<ul class="pagination">') >-1 );
      assert(text.string.indexOf('<a href="?page=1" aria-label="Next">') >-1 );
      done();
    });
  });

  describe('regionHelper', function () {
    var helper;

    before(function (done) {
      helper = require('../../../server/helpers/region.js')(we);
      done();
    });
    it('regionHelper should render region template html', function (done) {
      // set spy to check if renderTemplate is called
      sinon.spy(we.view, 'renderTemplate');

      var text = helper.bind({
        context: 'ctx'
      })('default', {
        data: {
          root: { regions: { default: { widgets: [] } } }
        }
      });
      assert(text);
      assert(we.view.renderTemplate.called);
      // then remove the spy
      we.view.renderTemplate.restore();
      done();
    });
  });

  describe('rendeBootstrapConfigHelper', function () {
    var helper;

    before(function (done) {
      helper = require('../../../server/helpers/render-bootstrap-config.js')(we);
      done();
    });
    it('rendeBootstrapConfigHelper generate client side WE_BOOTSTRAP_CONFIG configs', function (done) {

      var text = helper.bind({
        widgetContext: 'event-1',
        model: 'user',
        id: 1,
        locale: 'en-us',
        theme: 'app',
        __: function(string) {
          return string;
        }
      })('default', {
        data: {
          root: { regions: { default: { widgets: [] } } }
        }
      });

      assert(text.string);
      assert(text.string.indexOf('window.WE_BOOTSTRAP_CONFIG') >-1 );
      assert(text.string.indexOf('<script type="text/javascript">') >-1 );
      assert(text.string.indexOf('"locale":"en-us"') >-1 );
      assert(text.string.indexOf('"theme":"app"') >-1 );
      assert(text.string.indexOf('"widgetContext":"event-1"') >-1 );
      assert(text.string.indexOf('"modelName":"user"') >-1 );
      assert(text.string.indexOf('"modelId":1') >-1 );

      done();
    });
  });

  describe('renderClientComponentTemplatesHelper', function () {
    var helper;

    before(function (done) {
      helper = require('../../../server/helpers/render-client-component-templates.js')(we);
      done();
    });
    it('renderClientComponentTemplatesHelper should run we.view.renderTemplate for render core components templates', function (done) {
      // set spy to check if renderTemplate is called
      sinon.spy(we.view, 'renderTemplate');

      var text = helper.bind({
        theme: 'app'
      })({});

      assert(text.string);
      assert(text.string.indexOf('<div class="we-components-area">') >-1 );
      assert(we.view.renderTemplate.called);
      // then remove the spy
      we.view.renderTemplate.restore();
      done();
    });
  });

  describe('tHelper', function () {
    var helper;
    before(function (done) {
      helper = require('../../../server/helpers/t.js')(we);
      done();
    });
    it('tHelper should should localize a i18n string with global i18n', function (done) {
      sinon.spy(we.i18n, '__');
      var string = 'Login';
      var text = helper.bind({
      })(string, {
        data: { root: { locals: {} } }
      });
      assert(text);
      assert.equal(string, text);
      assert(we.i18n.__.called);
      // then remove the spy
      we.i18n.__.restore();
      done();
    });

    it('tHelper should should localize a i18n string with this.__', function (done) {
      var string = 'Login';

      var ctx = {
        __: function(s) {
          assert.equal(string, s);
          return s;
        }
      }
      sinon.spy(ctx, '__');

      var text = helper.bind(ctx)(string, {
        data: { root: { locals: {} } }
      });
      assert(text);
      assert.equal(string, text);
      assert(ctx.__.called);
      // then remove the spy
      ctx.__.restore();
      done();
    });

    it('tHelper should should localize a i18n string with this.locals.__', function (done) {
      var string = 'Login';

      var ctx = {
        locals: {
          __: function(s) {
            assert.equal(string, s);
            return s;
          }
        }
      }
      sinon.spy(ctx.locals, '__');

      var text = helper.bind(ctx)(string, {
        data: { root: { locals: {} } }
      });
      assert(text);
      assert.equal(string, text);
      assert(ctx.locals.__.called);

      done();
    });

    it('tHelper should should localize a i18n string with options.data.root.locals.__', function (done) {
      var string = 'Login';

      var opts = { data: { root: {
        locals: {
          __: function(s) {
            assert.equal(string, s);
            return s;
          }
        }
      }}}

      sinon.spy(opts.data.root.locals, '__');
      var text = helper.bind({})(string, opts);
      assert(text);
      assert.equal(string, text);
      assert(opts.data.root.locals.__.called);
      done();
    });

    it('tHelper should should localize a i18n string object attr', function (done) {
      var string = 'Login';

      var text = helper({
        field: string
      }, 'field', {
        data: { root: { locals: {} } }
      });
      assert(text);
      assert.equal(string, text);
      done();
    });
  });

  describe('templateHelper', function () {
   var helper;

    before(function (done) {
      helper = require('../../../server/helpers/template.js')(we);
      done();
    });

    it('templateHelper should run we.view.renderTemplate for render 400.hbs template with this.theme', function (done) {
      // set spy to check if renderTemplate is called
      sinon.spy(we.view, 'renderTemplate');

      var text = helper.bind({
        theme: 'app'
      })('400', {hash: {}});

      assert(text.string.indexOf('response.badRequest.title') > -1);
      assert(we.view.renderTemplate.called);
      // then remove the spy
      we.view.renderTemplate.restore();
      done();
    });

    it('templateHelper should run we.view.renderTemplate for render 400.hbs template with this.locals.theme', function (done) {
      // set spy to check if renderTemplate is called
      sinon.spy(we.view, 'renderTemplate');

      var text = helper.bind({
        locals: {
          theme: 'app'
        }
      })('400', {hash: {}});

      assert(text.string.indexOf('response.badRequest.title') > -1);
      assert(we.view.renderTemplate.called);
      // then remove the spy
      we.view.renderTemplate.restore();
      done();
    });

    it('templateHelper should return a empty string without theme', function (done) {
      // set spy to check if renderTemplate is called
      sinon.spy(we.view, 'renderTemplate');

      var text = helper.bind({})('400', {hash: {}});

      assert.equal(text, '');
      assert(!we.view.renderTemplate.called);
      // then remove the spy
      we.view.renderTemplate.restore();
      done();
    });
  });

  describe('containsHelper', function () {
   var helper;

    before(function (done) {
      helper = require('../../../server/helpers/we-contains.js')(we);
      done();
    });
    it('containsHelper should run fn if array contains the value', function (done) {
      helper.bind({
        context: 'ctx'
      })([10, 20, 30], 20, {
        fn: function(ctx) {
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });
    it('containsHelper should run inverse if array not contains the value', function (done) {
      helper.bind({
        context: 'ctx'
      })([10, 20, 30], 100, {
        inverse: function(ctx) {
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });
    it('containsHelper should run inverse if array not contains the value', function (done) {
      helper.bind({
        context: 'ctx'
      })([10, 20, 30], 100, {
        inverse: function(ctx) {
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });
    it('containsHelper should run inverse if array variable not is a array', function (done) {
      helper.bind({
        context: 'ctx'
      })({}, 100, {
        inverse: function(ctx) {
          assert.equal('ctx', ctx.context);
          done();
        }
      });
    });
  });

  describe('dateHelper', function () {
   var helper, dateF, date = new Date('Thu Sep 17 2015 16:08:20 GMT-0300 (BRT)');

    before(function (done) {
      dateF = moment(date).format(we.config.date.defaultFormat);
      helper = require('../../../server/helpers/we-date.js')(we);
      done();
    });
    it('we-date should format and return one date without format attr and user', function (done) {
      var text = helper.bind({})(date, null, {
        data: { root: { req: {} }}
      });

      assert.equal(dateF, text);

      done();
    });
    it('we-date should format and return one date with user', function (done) {
      var text = helper.bind({})(date, null, {
        data: { root: { req: {
          user: { language: 'en-us' }
        }}}
      });
      assert.equal(dateF, text);
      done();
    });
    it('we-date should format and return one date with user from locals', function (done) {
      var text = helper.bind({})(date, null, {
        data: { root: { locals: { req: {
          user: { language: 'en-us' }
        }}}}
      });
      assert.equal(dateF, text);
      done();
    });
    it('we-date should format and return one date with custom format', function (done) {
      var text = helper.bind({})(date, 'YYYY MM DD', {
        data: { root: { locals: { req: {
          user: { language: 'en-us' }
        }}}}
      });
      assert.equal('2015 09 17', text);
      done();
    });
  });

  describe('eventHelper', function () {
   var helper;
    before(function (done) {
      helper = require('../../../server/helpers/we-event.js')(we);
      done();
    });
    it('eventHelper should return a html from events', function (done) {

      we.events.on('we-html-body-start', function (data){
        data.html.text += 'One <i>html</i> from event';
      });
      we.events.on('we-html-body-start', function (data){
        data.html.text += '2 <i>html</i> from event';
      });
      we.events.on('we-html-body-start', function (data){
        data.html.text += '3 <i>html</i> from event';
      });
      we.events.on('we-html-body-start', function (data){
        data.html.text += '4 <i>html</i> from event';
      });

      var opts = {
        hash: { event: 'we-html-body-start' }
      }
      var text = helper.bind({})(opts);

      assert(text.string);
      assert(text.string.indexOf('One <i>html</i> from event') >-1 );
      assert(text.string.indexOf('2 <i>html</i> from event') >-1 );
      assert(text.string.indexOf('3 <i>html</i> from event') >-1 );
      assert(text.string.indexOf('4 <i>html</i> from event') >-1 );

      done();
    });
    it('eventHelper should return a empty string if dont pass the event', function (done) {

      we.events.on('we-html-body-start', function (data){
        data.html.text += 'One <i>html</i> from event';
      });

      var opts = { hash: { } }
      var text = helper.bind({})(opts);

      assert.equal('',text);
      done();
    });
  });

  describe('gridHelper', function () {
   var helper;
    before(function (done) {
      helper = require('../../../server/helpers/we-grid.js')(we);
      done();
    });
    it('gridHelper should render one grid with 3 cols', function (done) {
      var opts = {
        hash: {
          items: ['1', '2', '3', '4', '5'],
          cols: 2,
        },
        fn: function(i) {
          assert(opts.hash.items.indexOf(i)>-1);
          return i;
        }
      }
      var text = helper.bind({})(opts);
      assert(text.string);
      assert(text.string.indexOf('<div class="row we-grid-row"><div class="we-grid-col col col-md-6">') >-1 );
      done();
    });
    it('gridHelper should fun inverse fn without items', function (done) {
      var opts = {
        hash: { items: null, cols: 2 },
        inverse: function(ctx) {
          assert.equal(ctx.context, 'event-1');
          return 'inverse';
        }
      }
      var text = helper.bind({
        context: 'event-1'
      })(opts);
      assert.equal('inverse', text.string);
      done();
    });
  });

  describe('weMessagesHelper', function () {
   var helper;
    before(function (done) {
      helper = require('../../../server/helpers/we-messages.js')(we);
      done();
    });
    it('weMessagesHelper should render messages from options.data.root.locals.req.res.getMessages()', function (done) {
      var opts = {
        data: {
          root: {
            theme: 'app',
            req: {
              res: {
                getMessages: function() {
                  return [{
                    status: 'warning',
                    message: 'a message'
                  }];
                }
              }
            }
          }
        }
      }
      var text = helper.bind({})(opts);
      assert(text.string);
      assert(text.string.indexOf('<div class="alert alert-warning alert-dismissable">') >-1 );
      assert(text.string.indexOf('a message') >-1 );
      done();
    });
  });

  describe('weStripTagsHelper', function () {
   var helper;
    before(function (done) {
      helper = require('../../../server/helpers/we-strip-tags.js')(we);
      done();
    });
    it('weStripTagsHelper should all tags from html text and strip tags', function (done) {
      var opts = {
        hash: {
          text: '<strong>Hello word</strong>',
          maxLength: 5
        }
      }
      var text = helper(opts);
      assert.equal('Hello...', text);
      done();
    });
  });
});