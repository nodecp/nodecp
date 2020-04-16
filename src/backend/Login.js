const EXPORTS = {};

EXPORTS.method = "post";
EXPORTS.route = "/login";

EXPORTS.run = async function(req, res) {
  if (!req.body || Object.keys(req.body).length < 1)
    res.send("Please supply all required fields.");

  if (req.getConfig().HCaptcha.enabled) {
    let captchaResult = await req.postCaptcha(req.body);

    if (typeof captchaResult !== 'boolean')
      return res.send(captchaResult);
  }

  let accounts = req.getDatabase().fetch('login', function(data) {
    return data.userid.toLowerCase() === req.body.username.toLowerCase()
  });

  if (accounts.length < 1)
    return res.send(`User "${req.body.username}" does not exist.`);
  
  if (accounts[0].user_pass !== req.body.password)
    return res.send('Password was incorrect. Please try again.');

  req.session.put('account', accounts[0]);
    
  return res.send(`Successfully logged in as "${accounts[0].userid}"`);
};

module.exports = EXPORTS;