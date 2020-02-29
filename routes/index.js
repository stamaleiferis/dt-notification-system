var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("This is the index page!");
});

router.get('/testConnection', function(req, res, next) {
  res.send('connection is working!');
});

module.exports = router;