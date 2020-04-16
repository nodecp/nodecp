const { existsSync } = require('fs');
let EXPORTS;

EXPORTS = function(core) {
  core.http.use(function(req, res ,next) {
    let routes = core.http.routes();

    if (existsSync(`${core.dir}/contents/${req.url === '/' ? core.config.webserver.homepage : req.url}.pug`)
    && !routes.includes(`[GET]${req.url === '/' ? '//' : req.url}`)) {
      core.http.get(req.url, function(_req, _res) {
        _res.send(core.pug.renderFile(`${core.dir}/contents/${req.url === '/'
        ? core.config.webserver.homepage
        : req.url}.pug`, { _req, res }));
      });
    }

    next();
  });
};

module.exports = EXPORTS;