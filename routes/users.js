var express = require('express');
var router = express.Router();

router.get('/all', (req, res) => {
    res.send("No users yet!");
});
  
module.exports = router;
