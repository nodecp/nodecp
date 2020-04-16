const axios = require("axios");
let EXPORTS;

EXPORTS = function(core) {
  core.http.use(function(req, res, next) {
    req.postCaptcha = async function(body) {
      if (!body['h-captcha-response'])
        return 'Please complete the captcha.';

      let result = await axios({
        url: req.getConfig().HCaptcha.url,
        params: {
          secret: req.getConfig().HCaptcha['secret-key'],
          response: body['h-captcha-response']
        }
      })

      return result.data.success;
    };

    next();
  });
};

module.exports = EXPORTS;