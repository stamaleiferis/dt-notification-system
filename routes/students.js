var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');

const HASH_COST = 10;

router.post('/add', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const grade = req.body.grade;
    const phone = req.body.phone;
    const role = "student"
    // TODO: for email-based verification
    const verificationToken = crypto({length: 16});
    const passwordHash = await bcrypt.hash(req.body.password, HASH_COST);
    try {
        const studentAdded = await req.db.collection("Student").insert({
            name, email, grade, phone
        });
        await req.db.collection("User").insert({
            email, passwordHash, verificationToken, role
        });
        res.json({
            message: 'Successfully added student',
            student: studentAdded
        });
    } catch (e) {
        res.json({
            message: 'Failed adding student'
        });
    }
    res.send()
});

module.exports = router;
