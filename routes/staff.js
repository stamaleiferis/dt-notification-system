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
    // TODO: for email-based verification
    const verificationToken = crypto({length: 16});
    //console.log(role,phone,email)
    const passwordHash = await bcrypt.hash(req.body.password, HASH_COST);
    //let passwordHash = "passwordHash"
    try {
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
