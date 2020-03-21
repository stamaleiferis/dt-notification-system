var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');
var sendVerificationEmail = require('./helpers/emailHelpers').sendVerificationEmail

const HASH_COST = 10;

router.post('/add', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const role = req.body.role;
    const phone = req.body.phone;
    const emailVerified = false;
    const approved = false;
    const verificationToken = crypto({length: 16});
    const passwordHash = await bcrypt.hash(req.body.password, HASH_COST);
    try {
        //TODO: check if email is already in database
        const staffAdded = await req.db.collection("Staff").insert({
            name, email, phone, emailVerified, approved
        });
        await req.db.collection("User").insert({
            email, passwordHash, role, verificationToken
        });
        res.json({
            message: 'Successfully added '+ role,
            staff: staffAdded
        });

        await sendVerificationEmail(email, verificationToken);
        console.log("Sent email")
    } catch (e) {
        console.log("Error: "+e)
        res.json({
            message: 'Failed adding' + role
        });

    }
    res.send()

});

router.get('/:email/:verificationToken', async (req,res)=>{
  const email = req.params.email
  const verificationToken = req.params.verificationToken
  const dbData = await req.db.collection("User").find({email: email}).project({verificationToken:1,_id:0}).toArray();
  //TODO: assert len(storedVerification)==1
  console.log(dbData)
  if (dbData[0]['verificationToken'] == verificationToken){
    verificationResult = await req.db.collection("Staff").findAndModify({email: email},{cno:1},{emailVerified: true})
    console.log('Verification token matches')
    console.log(dbData)
  }
  res.send()
});

router.post('/sendEmail', async (req, res) => {
    const email = req.body.email; //Get current email
    const grades = req.body.grades;
    const subject = req.body.subject;
    const body = req.body.body;



    // TODO: for email-based verification
    //const verificationToken = crypto({length: 16});
    //const passwordHash = await bcrypt.hash(req.body.password, HASH_COST);
    try {
        const dbData = await req.db.collection("Student").find({grade: grades}).project({email:1}).toArray();
        res.json({
          message:'Success'
        })
        console.log(dbData)
    } catch (e) {
      console.log(e)
        res.json({
            message: 'Failed'
        });
    }
    res.send()
    //TODO: send email to address in dbData[i]["email"]

});

module.exports = router;
