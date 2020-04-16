const EXPORTS = {};

EXPORTS.method = "post";
EXPORTS.route = "/changepass";

EXPORTS.run = async function(req, res) {
  if (!req.body || !req.body.oldpass || !req.body.newpass)
    return res.send('Please give all required fields.');

  // just a precaution when they're logged out then suddenly changes pass
  if (!req.session.has('account'))
    return res.send('Please login first.')

  if (req.getConfig().HCaptcha.enabled) {
    let captchaResult = await req.postCaptcha(req.body);
  
    if (typeof captchaResult !== 'boolean')
      return res.send(captchaResult);
  }

  let LoggedInAccount = req.session.get('account');
  let account = req.getDatabase().fetch('login', function(data) {
    return data.userid.toLowerCase() === LoggedInAccount.userid.toLowerCase();
  });

  // another precaution if that account suddenly didn't exist.
  if (account.length < 1)
    return res.send('Account does not exist.');

  if (account[0].user_pass !== req.body.oldpass)
    return res.send('Incorrect old password.');

  // delete this line if you'd like people to change their pass to the same pass
  if (req.body.oldpass === req.body.newpass)
    return res.send('Old password must not match the new one.');

  req.getDatabase().update('login', [
    {
      column: 'user_pass',
      value: req.body.newpass
    }
  ], {
    userid: LoggedInAccount.userid
  });

  if (req.getConfig().LogOutUponChangePass) {
    //req.session.set('account', null)
    req.session.remove('account');
    return res.send('Successfully changed password, will not log you out.');
  } else {
    return res.send('Successfully changed your password.');
  }
};

module.exports = EXPORTS;
