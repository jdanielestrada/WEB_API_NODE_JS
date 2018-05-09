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



//CONSULTA LOS PRODUCTOS DESARROLLADOS PARA LLENAR EL COMBO DE BUSQUEDA

router.get('/get_productos_desarrollados', function (req, res, next) {
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
 
         request.execute('RTA.GET_PRODUCTOS_DESARROLLADOS', function (err, recordsets, returnValue) {
             if (err) {
                 res.json(err);
             }
 
             res.json({
                 data: recordsets
             });
         });
 
     });
 });


//CONSULTA EL PRODUCTO DESARROLLADO CON SUSMATERIALES FILTRANDO POR EL PARAMETRO ID_ITEM

router.get('/get_materiales_productos_desarrollados/:idItemReferencia', function (req, res, next) {
      console.log(req.params);

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
         request.input("IN_ID_ITEM_REFERENCIA", sql.VarChar(6), req.params.idItemReferencia);
         request.execute('RTA.GET_MATERIALES_PRODUCTOS_DESARROLLADOS', function (err, recordsets, returnValue) {
             if (err) {
                 res.json(err);
             }
 
             res.json({
                 data: recordsets
             });
         });
 
     });
 });



//CONSULTA LAS COTIZACIONES REALIZADAS POR UN USUARIO

router.get('/get_cotizaciones_by_usuario/:idUsuario', function (req, res, next) {
    console.log(req.params);

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
       request.input("IN_ID_USUARIO", sql.Int, req.params.idUsuario);
       request.execute('RTA.GET_COTIZACIONES_BY_USUARIO', function (err, recordsets, returnValue) {
           if (err) {
               res.json(err);
           }

           res.json({
               data: recordsets
           });
       });

   });
});



//CONSULTA EL DETALLE DE CADA ITEM DE UNA COTIZACION 

router.get('/getDetalleCotizacion/:csIdCotizacion', function (req, res, next) {
    console.log(req.params);

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
        request.input("IN_CS_ID_COTIZACION", sql.BigInt, req.params.csIdCotizacion);
        request.execute('RTA.GET_DETALLE_COTIZACION', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});







//GET CONSECUTO COTIZACION 


router.post('/generar_consecutivo_cotizacion/:tipo_cotizacion/:idUsuario', function (req, res, next) {

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            return res.json(err);
        }
        // Stored Procedure
        var request = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_TIPO_COTIZACION", sql.VarChar, req.params.tipo_cotizacion);
        request.input("IN_ID_USUARIO", sql.Int, req.params.idUsuario);
        request.output("MSG", sql.VarChar);
        request.output("OUT_CS_COTIZACION", sql.Int);

        request.execute('RTA.GENERAR_CONSECUTIVO_COTIZACION', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
                return;
            }

            res.json({
                data: recordsets,
                'MSG': request.parameters.MSG.value,
                'OUT_CS_COTIZACION': request.parameters.OUT_CS_COTIZACION.value,
            });
        });

    });

});



//INSERTAR ENCABEZADO COTIZACION 




router.post('/insert_h_Cotizacion', function (req, res, next) {

    console.log(req.body);

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var request = new sql.Request(transaction);

        request.verbose = true;
        request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, req.body.documento_cliente);
        request.input("IN_NOMBRES_CLIENTE", sql.VarChar, req.body.nombres_cliente);
        request.input("IN_APELLIDOS_CLIENTE", sql.VarChar, req.body.apellidos_cliente);
        request.input("IN_TIPO_COTIZACION", sql.VarChar, req.body.tipo_cotizacion);
        request.input('IN_FECHA', sql.DateTime, new Date(req.body.fecha_cotizacion));
        request.input("IN_ID_USUARIO", sql.Int, req.body.cs_id_usuario);
        request.input("IN_CS_COTIZACION", sql.BigInt, req.body.cs_cotizacion);

        request.output("MSG", sql.VarChar);

        request.execute('RTA.INSERT_H_COTIZACION', function (err, recordsets, returnValue)
        {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "GUARDADO") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {
                    /*hacemos commit*/
                    transaction.commit(function (err, recordset) {
                        // ... error checks
                        res.json({
                            data: [],
                            'MSG': "GUARDADO"

                        });

                        console.log("Transaction commited.");

                    });

                }

            }

        });

    });

});













//AUTENTICAR USUARIO

router.post('/get_autenticar_ususario', function (req, res, next) {
    console.log(req.body);

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
        request.input("IN_USUARIO", sql.VarChar(30), req.body.usuario.toUpperCase());
        request.input("IN_PASSWORD", sql.VarChar(30), req.body.password);

        request.output('MSG', sql.VarChar);

        request.execute('RTA.GET_AUTENTICAR_USUSARIO', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets,
                'MSG': request.parameters.MSG.value
            });
        });

    });
});





module.exports = router;
