var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');
var passport = require("passport");
var sendEmail = require('./helpers/emailHelpers').sendEmail
var ObjectID = require('mongodb').ObjectID;
var createCourseFolder = require('./helpers/driveHelpers').createCourseFolder

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
            name, email, phone
        });
        await req.db.collection("User").insert({
            email, passwordHash, role, verificationToken,emailVerified, approved
        });
        res.json({
            message: 'Successfully added '+ role,
            staff: staffAdded   //TODO: filter staffAdded to return only needed info
        });
        await sendEmail(email,'noreply@school.edu','Verify Your Staff Email','Email Body',verificationToken)
    } catch (e) {
        console.log("Error staff.js#add")
        res.status(500).json({
            message: 'Failed adding' + role,
            error: e
        });
    }

});

router.get('verification/:email/:verificationToken', async (req,res)=>{
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
      console.log("Error staff.js#verification/:email/:verificationToken")
      res.status(500).json({
        success:false,
        error:e
      });

    }
  }


});

router.post('/sendMessages', /*passport.authenticate('jwt', {session: false}),*/ async (req, res) => {
    const grades = req.body.grades.map(e=>parseInt(e));
    //const grades = req.body.grades
    const subject = req.body.subject;
    const body = req.body.body;
    const email_from = "noreply@school.edu"

    //TODO: body and html
    try {
        const dbData = await req.db.collection("Student").find({grade: {$in:grades}}).project({email:1, _id:0}).toArray();
        console.log(dbData)
        //await sendEmail(dbData,email_from,subject,body,'TODO');
        res.json({
          message:'success'
        })

    } catch (e) {
        console.log("Error staff.js#sendMessages")
        res.status(500).json({
            message: 'Failed',
            error: e
        });
    }

});

router.post('/sendMessage', passport.authenticate('jwt', {session: false}), async (req, res) => {
  email = req.body.email
  msg = req.body.message
  from = 'TODO@todo.todo'

  try{
    await sendEmail(email,from,subject,msg,'TODO');
    res.json({
      message:'success'
    })
  }catch(e){
    console.log("Error staff.js#sendMessage")
    res.status(500).json({
      message:'Failure',
      error: e
    })
  }


});

router.post('/invite/students', passport.authenticate('jwt', {session: false}), async (req,res)=>{
  emails = req.body.emails
  grade = req.body.grade
  const role = "student"
  const emailVerified = false
  const approved = true
  //TODO: check if emails already exist in database
  //TODO: use sendgrid to validate emails
  //TODO: assert all lengths equal
  const tempPasswords = Array(emails.length).fill(null).map(x=>crypto({length: 16}))
  emails_dict = emails.map(x=>{return {email:x}})
  users_dict = emails.map((x,i)=>{return {email:x,verificationToken:crypto({length: 16}),role:role, approved:approved, emailVerified:emailVerified, passwordHash:tempPasswords[i]}})

  try{
    await req.db.collection('Student').insertMany(emails_dict) //why is emails_dict modified by insertMany??
    await req.db.collection("User").insertMany(users_dict)

    emails.forEach(async (email,i)=>{
        await sendEmail(email,'noreply@school.edu','You Were Added As a Student','Email Body',tempPasswords[i])
    })

    res.json({
        message: 'Successfully invited students',
        student: emails
    });
  }catch(e){
    console.log("Error staff.js#invite/students")
    res.status(500).json({
        message: 'Failed inviting students',
        error: e
    });
  }

});

router.post('/invite/teachers', passport.authenticate('jwt', {session: false}), async (req,res)=>{
  emails = req.body.email

  const role = "teacher"
  const emailVerified = false
  const approved = true
  //TODO: check if emails already exist in database
  //TODO: use sendgrid to validate emails
  //TODO: assert all lengths equal
  const tempPasswords = Array(emails.length).fill(null).map(x=>crypto({length: 16}))
  emails_dict = emails.map(x=>{return {email:x}})
  users_dict = emails.map((x,i)=>{return {email:x,verificationToken:crypto({length: 16}),role:role, approved:approved, emailVerified:emailVerified, passwordHash:tempPasswords[i]}})
  try{
    await req.db.collection('Teacher').insertMany(emails_dict)
    await req.db.collection("User").insertMany(users_dict)

    emails.forEach(async (email,i)=>{
        await sendEmail(email,'noreply@school.edu','You Were Added As a Teacher','Email Body',tempPasswords[i])
    })

    res.json({
        message: 'Successfully invited teachers',
        teacher: emails
    });
  }catch(e){
    console.log("Error staff.js#invite/teachers")
    res.status(500).json({
        message: 'Failed inviting teachers',
        error: e
    });
  }

});

//TODO: add route students/:grade to get all students of specific grade
router.get('/students', passport.authenticate('jwt', {session: false}), async (req,res)=>{

  try {
      const dbData = await req.db.collection("Student").find().toArray();
      res.json({
          message: 'Successfully got student records',
          students: dbData
      });
  }catch(e){
    console.log("Error staff.js#students")
    res.status(500).json({
        message: 'Failed to get student records',
        error: e
    });
  }

});

router.get('/staff', passport.authenticate('jwt', {session: false}), async (req,res)=>{

  try {
      const dbDataStaff = await req.db.collection("Staff").find().toArray();
      const dbDataUser = await req.db.collection("User").find().toArray();
      res.json({
          message: 'Successfully got staff records',
          staff: dbDataStaff,
          user: dbDataUser
      });
  }catch(e){
    console.log("Error staff.js#staff")
    res.status(500).json({
        message: 'Failed to get staff records'
    });
  }

});

router.get('/get/:email', passport.authenticate('jwt', {session: false}), async (req,res)=>{
  const email = req.params.email
  try {
      const staffData = await req.db.collection("Staff").find({email: email}).toArray();
      const userData = await req.db.collection("User").find({email: email}).toArray();
      const role = userData.role
      let message = ''
      if (!staffData.length  || !userData.length){
        message = "Record doesn't exist"
      }else{
        message = "Successfully got staff details"
      }
      res.json({
          message: message,
          staff: staffData,
          user: userData
      });
  }catch(e){
    console.log("Error staff.js#get")
    res.status(500).json({
        message: 'Database read error',
        error: e
    });
  }

});

router.get('/status/:email', passport.authenticate('jwt', {session: false}), async (req,res)=>{
  const email = req.params.email
  try {
      const staffData = await req.db.collection("Staff").find({email: email}).project({emailVerified:1,approved:1,_id:0}).toArray();
      if (staffData.length ){
      res.json({
          message: "Successfully got status",
          emailVerified: staffData[0].emailVerified,
          approved: staffData[0].approved
        });

      }
  }catch(e){
    console.log("Error staff.js#status")
    res.status(500).json({
        message: "Error",
        error: e
      });

  }
});

router.post('/approve/student', async (req,res)=>{
  const approved = req.body.approved
  const email = req.body.email

  try{
    const dbData = await req.db.collection("User").updateOne({email: email},{$set:{approved:approved}});
    //TODO send email to confirm account verification
    res.json({success:true})

  }catch(e){
    console.log("Error staff.js#approve/student")
    res.status(500).json({success:false, error:e})
  }
});

router.post('/approve/staff', async (req,res)=>{
  const approve = req.body.approve
  const email = req.body.email

  try{
    const dbData = await req.db.collection("User").updateOne({email: email},{$set:{approved:approve}});
    //TODO send email to confirm account verification
    res.json({success:true})

  }catch(e){
    console.log("Error staff.js#approve/staff")
    res.status(500).json({success:false, error: e})
  }
});

router.post('/course', async (req,res)=>{ //TODO allow two folders to have same name?, mitigate errors at different levels
  const name = req.body.name
  const teacher = req.body.teacher
  const grade = parseInt(req.body.grade)
  const rootFolderId = "1Me9rIsA9i6ifOoRXf17xvpFk3WUQw-Yh" //top level directory for the whole school
  try{

    let [_id, webViewLink] = await createCourseFolder(name,rootFolderId )
    const assignments = []

    const courseAdded = await req.db.collection("Course").insertOne({
        name, grade, teacher, _id, webViewLink, assignments
      });

    await req.db.collection("Teacher").updateOne({_id:ObjectID(teacher)},{$push:{courses:_id}})
    await req.db.collection("Student").update({grade:grade},{$push:{courses:_id}})

    const teacherEmail = await req.db.collection("Teacher").findOne({_id: ObjectID(teacher)},{email:1})
    await sendEmail(teacherEmail,'noreply@school.edu','You Were Added As Course Teacher','Email Body',teacher)

    res.json({success: true, folder_id:_id, webViewLink:webViewLink})

  }catch(e){
    console.log("Error staff.js#post course: "+e)
    res.status(500).json({error: e})

  }

});

router.delete('/course/:id', async (req,res)=>{
  const id = req.params.id

  try{
    await req.db.collection("Course").deleteOne({_id: id})
    res.json({success:true})
  }catch(e){
    console.log("Error staff.js#delete course: "+e)
    res.status(500).json({error: e})
  }

});

router.get('/courses', async (req,res)=>{
  try{
    let courses = await req.db.collection("Course").find({}).toArray()
    Promise.all(courses.map( async (course) => {
        let teacher = await req.db.collection("Teacher").find({courses: { $elemMatch: { $eq: course._id }}}).toArray()
        let courseWithTeacher = {...course, teacherName: teacher[0].name}
        return Promise.resolve(courseWithTeacher)
      })).then((coursesWithTeacher) => {
        res.json({success:true, courses: coursesWithTeacher})
      })
  }catch(e){
    console.log("Error staff.js#courses: "+e)
    res.status(500).json({error: e})
  }

});

router.get('/teachers', async (req,res)=>{
  try{
    const teachers = await req.db.collection("Teacher").find({}).toArray()
    res.json({success:true, teachers: teachers})
  }catch(e){
    console.log("Error staff.js#teachers: "+e)
    res.status(500).json({error: e})
  }

});

module.exports = router;
