const EXPORTS = {};

EXPORTS.method = "post";
EXPORTS.route = "/logout";

EXPORTS.run = async function(req, res) {
  if (!req.session.has('account'))
    return res.send('Currently not logged in.');

  req.session.forget('account');
    
  return res.send(`Successfully logged out.`);
};

module.exports = EXPORTS;