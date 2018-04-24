/**
 * @author: Jose Daniel Estrada Pulgarin.
 * @email : jdanielestrada18@gmail.com
 * @github: github.com/jdanielestrada
 */
var express = require('express');
var router  = express.Router();
var _       = require('underscore')._;
var config  = require('../../utils/config');

router.get('/get_version_app_from_server/:id_aplicacion', function (req, res, next) {
    let data_version_app = _.findWhere(config.version_apps, { id_aplicacion: parseInt(req.params.id_aplicacion) });
    res.json(data_version_app);
});

module.exports = router;