const { EventEmitter } = require('events');
const YAML = require('yaml');
const loadBackend = require('./helpers/loadBackend');
const moment = require('moment');
const chokidar = require('chokidar');
const path = require('path');

module.exports = class extends EventEmitter {
  constructor(Config, connection) {
    super();

    Object.defineProperties(this, {
      http: {
        value: require('restana')(Config.webserver.restana)
      },

      pug: {
        value: require('pug')
      },

      dir: {
        value: __dirname
      },

      config: {
        value: Config,
        enumerable: true,
        writable: true
      },
    
      connection: {
        value: connection
      }
    });
  }

  init() {
    this.useSession();
    this.registerMiddlewares();
    this.watchForContentChanges();
    this.loadBackend();
      
    this.start();
  }

  useSession() {
    // this is the only middleware that should be placed here
    let session = new (require('node-session'))(this.config.webserver.sessions);
    this.http.use((req, res, next) => session.startSession(req, res, next));
  }

  start() {
    this.http.start(this.config.webserver.port).then(() => {
      if (this.config.allowDebugging)
        console.log(`
Webserver hosted on port: ${this.config.webserver.port} (${moment().format('MMMM Do YYYY, h:mm:ss a')})
`);
    });
  }
  
  registerMiddlewares() {
    for (var Middleware of this.config.webserver.middlewares) {
      require(`./middlewares/${Middleware}`)(this);
    };
  }

  loadBackend() {
    loadBackend(this);
  }

  watchForContentChanges() {
    chokidar.watch(`${this.dir}/contents`)
    .on('add', (path) => this.fileAdded(path));
  }

  fileAdded(_path) {
    let CorrectPath = path.normalize(_path).replace(/\\/g, '/');
    let CurrentDirCorrectPath = path.normalize(`${this.dir}/contents`).replace(/\\/g, '/');

    let addedFile = CorrectPath.split(CurrentDirCorrectPath)[1];
    let route = addedFile.split('.pug')[0];

    if (route === `/${this.config.webserver.homepage}`)
      route = '/';

    if (this.config.allowDebugging)
      console.log(`Added ${route} to the routes, with method [GET]`);

    this.http.get(route, (req, res) => {
      res.send(this.pug.renderFile(`${this.dir}/web/${this.config.webserver.homepage}.pug`, { req, res }));
    });
  }
};