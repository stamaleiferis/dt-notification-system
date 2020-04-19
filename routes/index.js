var express = require('express');
var router = express.Router();
var passport = require("passport");
var jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_sauce';
const JWT_EXPIRATION_MS = process.env.JWT_EXPIRATION_MS || '25000000'; // > 6 hrs;

router.get('/', function(req, res, next) {
  res.send("This is the index page!");
});

// login route
router.post('/login', (req, res, next) => {
  passport.authenticate(
    'local',
    (error, user, info) => {
      if (error) {
        next(error);
      } else if (!user) {
        next("User not found.")
      } else {
        const payload = {
          email: user.email,
          expires: Date.now() + parseInt(JWT_EXPIRATION_MS),
        };
        req.login(payload, {session: false}, async (error) => {
          if (error) {
            return next(error);
          }
          const cookie = jwt.sign(JSON.stringify(payload), JWT_SECRET);
          // set jwt-signed cookie on response
          res.cookie('jwt', cookie);
          try {
            let isStaff = user.role && user.role.toLowerCase() === "staff"
            let userToSend  = await req.db.collection(isStaff ? "Staff" : "Student").findOne({email: user.email});
            res.status(200).send({isStaff, userToSend});
          } catch (e) {
            console.log("Error: error fetching user after authentication", e);
            res.status(500).send({ error: e });
          }
        });
      }
    })(req, res)
});

module.exports = router;