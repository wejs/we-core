// var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var we;

describe('router.breadcrumb', function () {
  before(function (done) {
    we = helpers.getWe();
    done();
  });

  it ('router.breadcrumb.create should return breadcrumb for create route');
  it ('router.breadcrumb.find should return breadcrumb for find route');
  it ('router.breadcrumb.findOne should return breadcrumb for findOne route');
  it ('router.breadcrumb.edit should return breadcrumb for edit route');
  it ('router.breadcrumb.delete should return breadcrumb for delete route');
});