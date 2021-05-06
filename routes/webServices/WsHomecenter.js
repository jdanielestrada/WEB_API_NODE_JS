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
const pos_dao = require('../../dao/pos');
var multipartMiddleware = multipart();
var request = require('request');





router.post('/actualizar_inventario_homcenter', function (req, res, next) {

    console.log('....Proceso iniciado')

    pos_dao.getInventarioHomecenter()
        .then(function (result) {

            let arrayInventario =[]


            result.data[0].forEach(item => {
                arrayInventario.push({
                    proveedor        : 'RT@d3$ign',
                    ean              : item.ean,
                    inventarioDispo  : item.inventarioDispo,
                    stockMinimo      : 0,
                    canal            : 'Yumbo',
                    usuario          : 'RTADESIGN'
                });
            });


            console.log(arrayInventario);

            console.log('....Consulta de referencias terminado')

            console.log('....Iniciando Proceso de actualización inventario')

            // lab
            var options = {
                'method': 'POST',
                'url': 'https://apim-qa-proxy.sodhc.co/inventarioproveedor/api/Inventario/SetInventarioProductos',
                'headers': {
                  'Ocp-Apim-Subscription-Key': '442c55ae313642028c9eb69dc4220dad',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(arrayInventario)
              
              };

              // real
            //   var options = {
            //     'method': 'POST',
            //     'url': 'https://apim-prod-proxy.sodhc.co/inventarioproveedor/api/Inventario/SetInventarioProductos',
            //     'headers': {
            //       'Ocp-Apim-Subscription-Key': '209fa70e5b0c4b5c8bddaf0aa54b8e19 ',
            //       'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(arrayInventario)
              
            //   };
              request(options, function (error, response) {
                if (error) {
                    res.json(err);
                }
                console.log(response.body);
    
                console.log('....Proceso terminado')
                res.json({
                    'MSG': 'PROCESO EJECUTADO CORRECTAMENTE',
                    data: result
                   
                });

              });


        })
        .catch(function (err) {
            return res.json(err);
        });
});


router.post('/actualizar_inventario_homcenter_real', function (req, res, next) {

    console.log('....Proceso iniciado')

    pos_dao.getInventarioHomecenter()
        .then(function (result) {

            let arrayInventario =[]


            result.data[0].forEach(item => {
                arrayInventario.push({
                    proveedor        : 'RT@d3$ign',
                    ean              : item.ean,
                    inventarioDispo  : item.inventarioDispo,
                    stockMinimo      : 0,
                    canal            : 'Yumbo',
                    usuario          : 'RTADESIGN'
                });
            });


            console.log(arrayInventario);

            console.log('....Consulta de referencias terminado')

            console.log('....Iniciando Proceso de actualización inventario')

     

              // real
              var options = {
                'method': 'POST',
                'url': 'https://apim-prod-proxy.sodhc.co/inventarioproveedor/api/Inventario/SetInventarioProductos',
                'headers': {
                  'Ocp-Apim-Subscription-Key': '209fa70e5b0c4b5c8bddaf0aa54b8e19 ',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(arrayInventario)
              
              };
              request(options, function (error, response) {
                if (error) {
                    res.json(err);
                }
                console.log(response.body);
    
                console.log('....Proceso terminado')
                res.json({
                    'MSG': 'PROCESO EJECUTADO CORRECTAMENTE',
                    data: result
                   
                });

              });


        })
        .catch(function (err) {
            return res.json(err);
        });
});





module.exports = router;