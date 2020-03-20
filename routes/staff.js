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
            name, email, grade, phone, passwordHash, verificationToken
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

module.exports = router;
