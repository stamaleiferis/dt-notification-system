var express = require('express');
var router = express.Router();
var passport = require("passport");

router.get('/', function(req, res, next) {
  res.send("This is the index page!");
});

// login route
router.post('/login', (req, res) => {
  passport.authenticate(
    'local',
    { session: false },
    (error, user) => {
      if (error || !user) {
        res.status(400).json({ error });
      }
      const payload = {
        email: user.email,
        expires: Date.now() + parseInt(JWT_EXPIRATION_MS),
      };
      req.login(payload, {session: false}, (error) => {
        if (error) {
          res.status(400).send({ error });
        }
        const cookie = jwt.sign(JSON.stringify(payload), JWT_SECRET);
        res.cookie('jwt', cookie)
        res.status(200).send({ user });
      });
    },
  )(req, res);
});

module.exports = router;