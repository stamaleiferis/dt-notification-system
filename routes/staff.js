var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');
var sendEmail = require('./helpers/emailHelpers').sendEmail

const HASH_COST = 10;

router.post('/add', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const phone = req.body.phone;
    const emailVerified = false;
    const approved = false;
    const role = "staff"
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
        await sendEmail(email,'noreply@school.edu','Verify Your Staff Email','Email Body','html')
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
        await sendEmail(dbData,email,subject,body,'TODO');
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

});

router.post('/invite/students', async (req,res)=>{
  emails = req.body.email
  grade = req.body.grade
  const role = "student"
  const emailVerified = false
  const approved = true
  //TODO: check if emails already exist in database
  //TODO: use sendgrid to validate emails
  //TODO: assert all lengths equal
  emails_dict = emails.map(x=>{return {email:x}})
  users_dict = emails.map(x=>{return {email:x,verificationToken:crypto({length: 16}),role:role }})
  //records = names.map((x,i)=>[{name:x,email:emails[i],grade:grades[i],phone:phones[i],passwordHash:await bcrypt.hash(req.body.password[i], HASH_COST),verificationToken:crypto({length: 16})}])
  try{
    await req.db.collection('Student').insertMany(emails_dict)
    await req.db.collection("User").insertMany(users_dict)
    await sendEmail(emails,'noreply@school.edu','Verify Your Student Email','Email Body','html')
    res.json({
        message: 'Successfully invited students',
        student: emails
    });
  }catch(e){
    res.json({
        message: 'Failed inviting students'
    });
  }
  res.send()
});

//TODO: add route students/:grade to get all students of specific grade
router.get('/students', async (req,res)=>{

  try {
      const dbData = await req.db.collection("Student").find().toArray();
      res.json({
          message: 'Successfully got student records',
          students: dbData
      });
  }catch(e){
    res.json({
        message: 'Failed to get student records'
    });
  }
  res.send()
});

router.get('/staff', async (req,res)=>{

  try {
      const dbData = await req.db.collection("Staff").find().toArray();
      res.json({
          message: 'Successfully got staff records',
          students: dbData
      });
  }catch(e){
    res.json({
        message: 'Failed to get staff records'
    });
  }
  res.send()
});

module.exports = router;
