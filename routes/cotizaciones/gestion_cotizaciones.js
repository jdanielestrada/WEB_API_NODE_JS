var express = require('express');
var router = express.Router();


var email = require('emailjs');
var pdf = require('html-pdf');
var TYPES = require('tedious').TYPES;
var _ = require('underscore')._;
var fs = require('fs');
var mkpath = require('mkpath');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var sqlServerConnection = require('../../utils/sqlServerConnection');
var CONSTANTES = require('../../utils/constantes');
var crypto = require('crypto');
var config = require('../../utils/config');
var utils = require('../../utils/utils');
var sql = require('mssql');

var server = config.serverEmail;
var pathBaseGestionDocumental = "./public/uploads";
var async = require('async');

//PRUEBA SERVIDOR 37
router.get('/prueba', function (req, res, next) {
   //  console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.POSDB;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.verbose = true;

        request.execute('POSMADECENTRO.SSP_GET_CIUDADES', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});

//PRUEBA SERVIDOR 192.168.1.20 RTA

router.get('/get_tipos_proyectos', function (req, res, next) {
    //  console.log(req.params);
     //return;
     config.configBD3.database = CONSTANTES.RTABD;
     console.log(config.configBD3.database);
     var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
         // ... error checks
         if (err) {
             console.error(err);
             res.json(err);
         }
 
         // Stored Procedure
         var request = new sql.Request(connection);
         request.verbose = true;
 
         request.execute('RTA.SSP_GET_PRUEBA', function (err, recordsets, returnValue) {
             if (err) {
                 res.json(err);
             }
 
             res.json({
                 data: recordsets
             });
         });
 
     });
 });

module.exports = router;
