var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');
var checkRole = require('../utils/handlers').checkRole;
var passport = require("passport");
var sendEmail = require('./helpers/emailHelpers').sendEmail
var ObjectID = require('mongodb').ObjectID;
var createFolder = require('./helpers/driveHelpers').createFolder
var uploadPdf = require('./helpers/driveHelpers').uploadPdf
var multiparty = require('multiparty');
var fs = require('fs')

const HASH_COST = 10;

router.post('', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const phone = req.body.phone;
    const emailVerified = false;
    const approved = false;
    const role = "teacher"
    const verificationToken = crypto({length: 16});
    const passwordHash = await bcrypt.hash(req.body.password, HASH_COST);
    const courses = [];

    try {
        //TODO: check if email is already in database
        const teacherAdded = await req.db.collection("Teacher").insert({
            name, email, phone, courses
        });
        await req.db.collection("User").insert({
            email, passwordHash, role, verificationToken,emailVerified, approved
        });
        res.json({
            message: 'Successfully added '+ role,
            teacher: teacherAdded   //TODO: filter teacherAdded to return only needed info
        });
        await sendEmail(email,'noreply@school.edu','Verify Your Teacher Email','Email Body',verificationToken)
    } catch (e) {
        console.log("Error teacher.js#add")
        res.status(500).json({
            message: 'Failed adding' + role,
            error: e
        });
    }
});

router.put('', async (req, res) => {
  const name = req.body.name
  const phone = req.body.phone
  const id = req.body.id

  try{
    await req.db.collection("Teacher").findAndModify({_id: ObjectID(id)},{cno:1},{"$set":{name: name,phone:phone}})
    res.json({success:true})
  }catch(e){
    res.status(500).json({error: e})
  }

});

router.post('/sendMessage', async (req, res) => {
  const course = req.body.course
  const message = req.body.message

  const dbData = await req.db.collection("Course").find({_id:course}).project({_id:0,name:1, grade:1}).toArray()
  const className = dbData[0].name
  console.log(dbData)
  console.log(dbData[0].grade)
  const grade = dbData[0].grade
  const emails = await req.db.collection("Student").find({grade:grade}).project({_id:0,email:1}).toArray()

  const from = className+'@school.edu'
  const subject = "Message from your "+className+" teacher"
  const body = "This is a teacher message to all students"
  const html = message

  try{
    await sendEmail(emails,from,subject,message,html);
    res.json({
      success:true
    })
  }catch(e){
    console.log("Error teachers.js#sendMessage")
    res.status(500).json({
      success:false,
      error: e
    })
  }
});

router.post('/assignment', async (req, res) => {
  try{
    var form = new multiparty.Form();
  
    form.parse(req, async (err, fields, files) =>  {
      const course = fields.course[0]
      const name = fields.name[0]
      const date = fields.date[0]
      const file = files.file[0]
      const assignmentFolder = await createFolder(name,course) //assignment folder
      const submissionFolder = await createFolder(`Submission Folder for${name}`, assignmentFolder.id) //submission folder
      const assignmentFile = await uploadPdf(`Assignment ${name} instructions.pdf`, assignmentFolder.id, fs.createReadStream(file.path))
      const dbData = await req.db.collection("Course").find({_id:course}).project({_id:0,name:1,grade:1}).toArray()
      const className = dbData[0].name
      const grade = dbData[0].grade

      await req.db.collection("Assignment").insert({
        name, courseName:className, courseId:course, submissionFolderId:submissionFolder.id,
        submissionFolderLink:submissionFolder.webViewLink, assignmentFileId: assignmentFile.id,
        assignmentFileLink: assignmentFile.webViewLink, date: Date.now()
      })
    const emails = await req.db.collection("Student").find({grade:grade}).project({_id:0,email:1}).toArray()
    const from = className+'@school.edu'
    const subject = "New assignment: "+name+" for class "+ className
    const body = "You can view the assignment here: "+assignmentFile.webViewLink+"/n Login to the system to submit"
    const html = body

    // await sendEmail(emails,from,subject,body,html);
    res.json({
      success:true
    })
    })
 } catch(e){
   console.log("Error teachers.js#assignment", e)
   res.status(500).json({
     success:false,
     error: e
   })
 }


});

router.get('/courses/:teacherId', async (req, res) => {
  const teacherId = req.params.teacherId
  try{
    const courses = await req.db.collection("Course").find({teacher:teacherId}).toArray()
    res.json({success:true, courses:courses})
  }catch(e){
    res.status(500).json({error: e})
  }
});

router.get('/assignments/:courseId', async (req, res) => {
  const courseId = req.params.courseId
  try{
    const assignments = await req.db.collection("Assignment").find({courseId:courseId}).toArray()
    res.json({success:true, assignments:assignments})
  }catch(e){
    res.status(500).json({error: e})
  }
});


module.exports = router;
