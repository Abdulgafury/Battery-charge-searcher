var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
  	title: 'Battery Charger',
  	API_KEY: 'AIzaSyARn84OSkDLxgqDW3Zr4lnzlmAm4Hys5DA',

  });
});

module.exports = router;
