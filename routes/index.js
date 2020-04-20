var express = require('express');
var router = express.Router();
var passport = require("passport");
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var crypto = require('crypto-random-string');
var sendEmail = require('./helpers/emailHelpers').sendEmail

const HASH_COST = 10;


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
        req.login(payload, {session: false}, (error) => {
          if (error) {
            return next(error);
          }
          const cookie = jwt.sign(JSON.stringify(payload), JWT_SECRET);
          // set jwt-signed cookie on response
          res.cookie('jwt', cookie);
          res.status(200).send({ user });
        });
      }
    })(req, res)
});

router.get('/verification/:email/:verificationToken',async (req, res, next) => {
  const email = req.params.email
  const verificationToken = req.params.verificationToken
  try{
    const dbData = await req.db.collection("User").find({email: email}).project({verificationToken:1,_id:0}).toArray();
    if (verificationToken == dbData[0]['verificationToken']){
      await req.db.collection("Student").updateOne({email: email},{$set:{approved:approve}});
      res.send({Success:true})
    }else{
      res.send({Success:false})
    }
  }catch(e){
    res.send({Success:false})
  }

});

router.post('/password/change',async (req, res, next) => {
  const password = req.body.newPassword
  const email = req.body.email
  const passwordHash = await bcrypt.hash(password, HASH_COST);
  try{
    const dbData = await req.db.collection("User").updateOne({email: email},{$set:{passwordHash:passwordHash}});
    res.send({Success:true})
  }catch(e){
    console.log(e)
    res.send({Success:false})
  }
});

router.post('/password/forgot',async (req, res, next) => {
  const email = req.body.email
  const newTempPass = crypto({length: 16});
  try{
    const dbData = await req.db.collection("User").updateOne({email: email},{$set:{passwordHash:newTempPass}});
    await sendEmail(email,'noreply@school.edu','Your Password Was Reset','Email Body',newTempPass)
    console.log("Email: "+email)
    res.send({Success:true})
  }catch(e){
    res.send({Success:false})
  }
});

module.exports = router;
