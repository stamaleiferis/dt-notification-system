var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');

const HASH_COST = 10;

router.post('/add', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const role = req.body.role;
    const phone = req.body.phone;
    // TODO: for email-based verification
    const verificationToken = crypto({length: 16});
    const passwordHash = await bcrypt.hash(req.body.password, HASH_COST);
    try {
        const staffAdded = await req.db.collection("Staff").insert({
            name, email, phone, passwordHash, verificationToken
        });
        await req.db.collection("User").insert({
            email, passwordHash
        });
        res.json({
            message: 'Successfully added '+ role,
            staff: staffAdded
        });
    } catch (e) {
        res.json({
            message: 'Failed adding' + role
        });
    }
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
