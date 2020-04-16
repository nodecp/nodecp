const Mysql = require('../helpers/wrappers/Mysql');
const { readFileSync } = require('fs');
const YAML = require('yaml');
let EXPORTS;

EXPORTS = function(core) {
  const connection = new Mysql(core.config.mysql);

  core.http.use(function(req, res, next) {
    if (req.url !== '/' && new RegExp(/\/+$/g).test(req.url))
      req.url = req.url.replace(/\/+$/g, '');

    if (req.url.length < 1)
      req.url = '/';

    req.getPageContent = function(fileName) {
      if (!fileName)
        fileName = req.url;

      if (fileName === '/')
        fileName = core.config.webserver.homepage;

      try {
        return core.pug.renderFile(`${core.dir}/contents/${fileName.endsWith('/')
        ? fileName.slice(1)
        : fileName}.pug`, { req, res })    
      } catch(e) {
        if (e.code === 'ENOENT') {
          if (req.getConfig().allowDebugging)
            console.log(`Removed ${fileName} from routes, with method [GET]`);
          
          return res.send(404);
        }
      }
    };

    req.isHomePage = function(url) {
      if (url === "/")
        return true;
      else if (url === `/${req.getConfig().webserver.homepage}`)
        return true;
      else return false;
    }
    
    req.getConfig = function() {
      return core.config.reloadConfigPerRequest ?
      YAML.parse(readFileSync(`${process.cwd()}/config.yaml`, 'utf-8')) :
      core.config;
    }

    req.getDatabase = function() {
      return connection;
    }

    req.addURLParams = function(url, params) {
      return `${url}/?${Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')}`;
    }

    next();
  });
};

module.exports = EXPORTS;