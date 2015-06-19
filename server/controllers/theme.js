module.exports = {
  themeSettings: function themeSettings(req, res) {
    var we = req.getWe();
    if (!we.view.themes[req.params.themeName]) return res.notFound();

    res.locals.record = we.view.themes[req.params.themeName];
    res.view();
  },
  themesList: function themesList(req, res) {
    var we = req.getWe();

    res.locals.themes = we.view.themes;
    res.view();
  }
}