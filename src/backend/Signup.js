const EXPORTS = {};

EXPORTS.method = "post";
EXPORTS.route = "/signup";

EXPORTS.run = async function(req, res) {
  if (!req.body || Object.keys(req.body).length < 1)
    res.send("Please supply all required fields.");

  if (req.getConfig().HCaptcha.enabled) {
    let captchaResult = await req.postCaptcha(req.body);

    if (typeof captchaResult !== 'boolean')
      return res.send(captchaResult);
  }

  // TODO: ADD GENDER AND BIRTHDATE.
  req.body.sex = "M";

  if (!req.body.username ||
    !req.body.password ||
    !req.body.email)
    return res.send('Please fill up all required fields.');


  if (req.getDatabase().fetch('login', {
  	userid: req.body.username.toLowerCase()
  }).length >= 1)
    return res.send('Account already exists.');

  req.getDatabase().insert('login', {
    userid: req.body.username.toLowerCase(),
    user_pass: req.body.password,
    sex: req.body.sex,
    email: req.body.email
  });
    
  return res.send('Successfully registered account');
};

module.exports = EXPORTS;