var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');
var checkRole = require('../utils/handlers').checkRole;
var passport = require("passport");
var sendEmail = require('./helpers/emailHelpers').sendEmail
var ObjectID = require('mongodb').ObjectID;
var uploadPdf = require('./helpers/driveHelpers').uploadPdf

const HASH_COST = 10;

router.post('/student', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const grade = parseInt(req.body.grade);
    const phone = req.body.phone;

    const role = "STUDENT"
    const emailVerified = false
    const approved = false

    const verificationToken = crypto({length: 16});
    const passwordHash = await bcrypt.hash(req.body.password, HASH_COST);

    const courses = []
    try {
        const studentAdded = await req.db.collection("Student").insert({
            name, email, grade, phone, courses
        });
        await req.db.collection("User").insert({
            email, passwordHash, verificationToken, role, emailVerified, approved
        });
        await sendEmail(email,'noreply@school.edu','Verify Your Student Email','Email Body',verificationToken)
        res.json({
            message: 'Successfully added student',
            student: studentAdded
        });
    } catch (e) {
      console.log("Error student.js#add")
        res.status(500).json({
            message: 'Failed adding student',
            error: e
        });
    }

});

router.get('/student/:email', passport.authenticate('jwt', {session: false}), async (req,res)=>{
  const email = req.params.email
  try {
      const studentData = await req.db.collection("Student").find({email: email}).toArray();
      const userData = await req.db.collection("User").find({email: email}).toArray();
      const role = userData.role
      let message = ''
      if (!studentData.length  || !userData.length){
        message = "Record doesn't exist"
      }else{
        message = "Successfully got student details"
      }
      res.json({
          message: message,
          student: studentData,
          user: userData
      });
  }catch(e){
    console.log("Error student.js#get")
    res.status(500).json({
        message: 'Database read error',
        error: e
    });
  }

});

router.get('/status/:email', passport.authenticate('jwt', {session: false}), async (req,res)=>{
  const email = req.params.email
  try {
      const studentData = await req.db.collection("Student").find({email: email}).project({emailVerified:1,approved:1,_id:0}).toArray();
      if (studentData.length ){
      res.json({
          message: "Successfully got status",
          emailVerified: studentData[0].emailVerified,
          approved: studentData[0].approved
        });

      }
  }catch(e){
    console.log("Error student.js#status")
    res.status(500).json({
        message: "Error",
        error: e
      });

  }
});

router.get('/verification/:email/:verificationToken', async (req,res)=>{
  const email = req.params.email
  const verificationToken = req.params.verificationToken
  const dbData = await req.db.collection("User").find({email: email}).project({verificationToken:1,_id:0}).toArray();
  let success = false
  //TODO: assert dbData.length == 1
  if (dbData[0]['verificationToken'] == verificationToken){
    try{
      verificationResult = await req.db.collection("User").findAndModify({email: email},{cno:1},{"$set":{emailVerified: true}})
      res.json({
        success:true
      });
    }catch(e){
      console.log("Error student.js#verification")
      res.status(500).json({
        success:false,
        error: e
      });
    }
  }else{
    res.json({
      success:false
    });
  }

});

router.delete('/student', passport.authenticate('jwt', {session: false}), async (req,res)=>{
  email = req.body.email
  //TODO: assert email.length == 1
  try{
    await req.db.collection("Student").deleteOne({email:email})
    res.json({success: true})
  }catch(e){
    console.log("Error student.js#delete")
    res.status(500).json({Succes: false, error: e})
  }
});

router.put('/student', passport.authenticate('jwt', {session: false}), async (req,res)=>{
  const name = req.body.name
  const phone = req.body.phone
  const id = req.body.id

  try{
    await req.db.collection("Student").findAndModify({_id: ObjectID(id)},{cno:1},{"$set":{name: name,phone:phone}})
    res.json({success:true})
  }catch(e){
    console.log("Error student.js#put student")
    res.status(500).json({error: e})
  }

});

router.get('/assignments/:studentId', passport.authenticate('jwt', {session: false}), async (req,res)=>{
  const studentId = req.params.studentId
 try{
   let student = await req.db.collection("Student").findOne({_id:ObjectID(studentId)})
   const assignments = await req.db.collection("Assignment").find({courseId:{$in: student.courses}}).project({_id:0,assignmentFileLink:1, name:1, date:1}).toArray()
   res.json({success:true, assignments})
 }catch(e){
   console.log("Error student.js#get assignments")
   res.status(500).json({error: e})
 }

});

router.post('/assignment', passport.authenticate('jwt', {session: false}), async (req,res)=>{
 const assignmentId = req.body.assignment
 const studentId = req.body.studentId
 const file = req.body.file

 try{
   const student = await req.db.collection("Student").find({_id:ObjectID(studentId)}).project({_id:0,name:1}).toArray()
   const assignment = await req.db.collection("Assignment").find({_id:ObjectID(assignmentId)}).project({_id:0,submissionFolderId:1,name:1}).toArray()
   const submissionFolderId = assignment[0].submissionFolderId
   const assignmentName = assignment[0].name
   const studentName = student[0].name
   uploadPdf(studentName+"'s submission for assignment "+assignmentName,submissionFolderId,file)
   res.json({success:true})
 }catch(e){
   console.log("Error student.js#post assignment")
   res.status(500).json({error: e})
 }

});


// TODO: for testing checkRole handler
router.get('/onlyStudent', checkRole("STUDENT"), passport.authenticate('jwt', {session: false}), (req, res, next) => {
    res.status(200).send("You now have secret knowledge!");
});



module.exports = router;
