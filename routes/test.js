var express = require('express');
var router = express.Router();

router.get('/testConnection', function(req, res, next) {
    res.json({'message':'connection is working!'});
  });

router.post('/testPost', function(req, res, next) {
    const param1 = req.body.param1;
    res.json({'param' : param1});
});

router.get('/getTestData', async (req, res, next) => {
    const dbData = await req.db.collection("testCollection").find().toArray();
    res.json({'testData' : dbData});
});

router.get('/addData/:name/:profession', async (req, res, next) => {
    const name = req.params.name;
    const profession = req.params.profession;
    await req.db.collection("testCollection").insert({
        name, profession
    });
    const dbData = await req.db.collection("testCollection").find().toArray();
    res.json({'response' : dbData});
});

router.get('/data/clear', async (req, res, next) => {
    await req.db.collection("testCollection").remove({});
    res.json({'message' : 'deleted all records!'});
});

router.get('/dataTest', async (req, res, next) => {
    //// TODO:
    
});

module.exports = router;
