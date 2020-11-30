var express = require('express');
var router = express.Router();
var email = require('emailjs');
var pdf = require('html-pdf');
var _ = require('underscore')._;
var fs = require('fs');
var CONSTANTES = require('../../utils/constantes');
var crypto = require('crypto');
var config = require('../../utils/config');
var utils = require('../../utils/utils');
var sql = require('mssql');
var async = require('async');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();



router.get('/get_dt_gestion_etapas_op/:cs_id_orden_produccion', function (req, res, next) {
    
    produccion_dao.get_dt_gestion_etapas_op(req.params)
        .then(function (result) {
            res.json(result);
        })
        .catch(function (err) {
            return res.json(err);
        });
});



const http = require('http');
const agent = new http.Agent({ keepAlive: true });

function retriableRequest() {
  const req = http
    .get('http://localhost:3000', { agent }, (res) => {
      // ...
    })
    .on('error', (err) => { 
      // Check if retry is needed
      if (req.reusedSocket && err.code === 'ECONNRESET') {
        retriableRequest();
      }
    });
}

retriableRequest();



router.post('/getInventarioProductos', function (req, res, next) {

    config.configBD2.database = CONSTANTES.POSDB;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            return res.json(err);
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_FILTRO", sql.VarChar, req.body.filtro);
        request.input("IN_USER", sql.VarChar, req.body.user);
        request.input("IN_PASSWORD", sql.VarChar, req.body.password);
        request.output('MSG', sql.VarChar(200));
        request.execute('POS.SSP_GET_INVENTARIO', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }

            res.json({
                data : recordsets,
                'MSG': request.parameters.MSG.value
            });
        });

    });
});



router.get('/get_envios_ecommerce', function (req, res, next) {

    produccion_dao.get_despachos_reparto_envia()
        .then(function (result) {
            res.json(result);
        })
        .catch(function (err) {
            return res.json(err);
        });
});





module.exports = router;