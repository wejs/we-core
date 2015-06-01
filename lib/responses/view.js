module.exports = function viewResponse() {
  var req = this.req;
  var res = this.res;
  var we = req.getWe();

  if (res.locals.isAdmin) {
    return res.sendFile(we.projectPath + '/server/templates/admin/index.html');
  } else {
    return res.sendFile(we.projectPath + '/server/templates/app/index.html');
  }
};