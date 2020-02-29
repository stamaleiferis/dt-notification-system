var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("This is the index page!");
});

router.get('/testConnection', function(req, res, next) {
  res.json({'message':'connection is working!'});
});

router.post('/testPost', function(req, res, next) {
  const param1 = req.body.param1;
  res.json({'param':param1});
});

module.exports = router;