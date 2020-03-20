var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');
var checkRole = require('../utils/handlers').checkRole;
var passport = require("passport");

const HASH_COST = 10;

router.post('/add', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const grade = req.body.grade;
    const phone = req.body.phone;
    const role = "STUDENT";
    // TODO: for email-based verification
    const verificationToken = crypto({length: 16});
    const passwordHash = await bcrypt.hash(req.body.password, HASH_COST);
    try {
        const studentAdded = await req.db.collection("Student").insert({
            name, email, grade, phone, passwordHash, verificationToken
        });
        await req.db.collection("User").insert({
            email, passwordHash, role
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
});

// TODO: for testing checkRole handler
router.get('/onlyStudent', checkRole("STUDENT"), passport.authenticate('jwt', {session: false}), (req, res, next) => {
    res.status(200).send("You now have secret knowledge!");
});

module.exports = router;
