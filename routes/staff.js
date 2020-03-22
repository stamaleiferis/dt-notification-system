var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');
var sendVerificationEmail = require('./helpers/emailHelpers').sendVerificationEmail
var sendEmail = require('./helpers/emailHelpers').sendEmail

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
        //await sendVerificationEmail(email, verificationToken);
        await sendEmail(email,'noreply@school.edu','Verify Your Email','Email Body','html')
    } catch (e) {
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

  if (dbData[0]['verificationToken'] == verificationToken){
    verificationResult = await req.db.collection("Staff").findAndModify({email: email},{cno:1},{emailVerified: true})

  }
  res.send()
});

router.post('/sendMessages', async (req, res) => {
    const email = req.body.email; //TODO: prob don't need this, replace with context
    const grades = req.body.grades;
    const subject = req.body.subject;
    const body = req.body.body;

    //TODO: body and html
    try {
        const dbData = await req.db.collection("Student").find({grade: grades}).project({email:1, _id:0}).toArray();
        emails = dbData.map(m => m.email)
        await sendEmail(emails,email,subject,body,'TODO');
        res.json({
          message:'Success'
        })

    } catch (e) {

        res.json({
            message: 'Failed'
        });
    }
    res.send()
});

router.post('/sendMessage', async (req, res) => {
  email = req.body.emails
  subject = req.body.subject
  msg = req.body.msg
  from = 'TODO@todo.todo'

  try{
    await sendEmail(email,from,subject,msg,'TODO');
    res.json({
      message:'Success'
    })
  }catch(e){
    res.json({
      message:'Failure'
    })
  }


)};

module.exports = router;
