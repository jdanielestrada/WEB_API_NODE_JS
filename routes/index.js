var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express v4.15.2' });
});

router.get('/revienta', function(req, res, next) {
    throw "esto reventó";
  //res.json(parseInt('ades') );
});

router.get('/restartnodejs', function(req, res, next) {

  //var resultado = exec('forever restart', {silent : true}).output;
  res.json({"ok" : "200", "resultado" : resultado});
});

router.get('/stopallnodejs', function(req, res, next) {

  //var resultado = exec('forever stopall', {silent : true}).output;
  res.json({"ok" : "200", "resultado" : resultado});
});

module.exports = router; 
