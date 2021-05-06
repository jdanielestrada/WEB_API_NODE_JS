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
var AWS = require('aws-sdk');
var multiparty = require("multiparty");
let uuid = require("uuid"); //genera seriales unicos
var pos_dao        = require('../../dao/pos');

const regexExtension = /(?:\.([^.]+))?$/; 




//AUTENTICAR USUARIO
router.post('/get_autenticar_ususario', function (req, res, next) {
    console.log(req.body);

    var usuario = req.body.usuario;
    var contrasena = req.body.password;

    config.configBD2.database = CONSTANTES.CORPORATIVADB;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;
        request.input("INUSER", sql.VarChar(30),usuario);
        request.input("INPW", sql.VarChar(30), crypto.createHash('md5').update(contrasena).digest('hex'));
        console.log('la contrasena a validar => ' + crypto.createHash('md5').update(contrasena).digest('hex'));

        request.output('MSG', sql.VarChar);

        request.execute('CORPORATIVA.SSP_AUTENTICARUSUARIO_RTA', function (err, recordsets, returnValue) {
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

//AUTENTICAR NUBE
router.post('/get_autenticar_ususario_nube', function (req, res, next) {
    console.log(req.body);

    var usuario = req.body.usuario;
    var contrasena = req.body.password;

    config.configBD2.database = CONSTANTES.CORPORATIVADB;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;
        request.input("INUSER", sql.VarChar(30),usuario);
        request.input("INPW", sql.VarChar(30), crypto.createHash('md5').update(contrasena).digest('hex'));
        console.log('la contrasena a validar => ' + crypto.createHash('md5').update(contrasena).digest('hex'));

        request.output('MSG', sql.VarChar);

        request.execute('CORPORATIVA.SSP_AUTENTICARUSUARIO_RTA_NUBE', function (err, recordsets, returnValue) {
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




//INSERTAR DISENO
router.post('/insert_h_diseno', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        // request.input("IN_D_DISENO", sql.VarChar, req.body.nombreMueble || null);
        // request.input("IN_REFERENCIA", sql.VarChar, req.body.referenciaMueble ||null);
        request.input("IN_NOMBRE_SOLICITUD", sql.VarChar, req.body.nombreSolicitud);
        request.input("IN_DESCRIPCION", sql.VarChar, req.body.descripcion);
        request.input("IN_TIPO_SOLICITUD", sql.Int, req.body.tipoSolicitud);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);

        request.output("OUT_CS_H_DISENO", sql.Int);
        request.output("MSG", sql.VarChar);

        request.execute('DISENO.INSERT_H_DISENO', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value,
                            'OUT_CS_H_DISENO': request.parameters.OUT_CS_H_DISENO.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});



router.post('/insert_solicitud_comercial', function (req, res, next) {
    var conexion = utils.clone(config.configBD2);

    //Utilizar driver para controlar errores de conversión 
    // conexion.driver = "msnodesqlv8";
    conexion.database = CONSTANTES.DISENOBD;

    var connection = new sql.Connection(conexion);

    connection.connect(function (err) {

        var transaction = new sql.Transaction(connection);

        transaction.begin(function (err) {
            // ... error checks
            if (err) {
                return res.json({
                    error: err,
                    MSG: err.message
                });
            }

            var request = new sql.Request(transaction);

           // Stored Procedure
           request.input("IN_NOMBRE_SOLICITUD", sql.VarChar, req.body.solicitud.nombreSolicitud);
           request.input("IN_DESCRIPCION", sql.VarChar, req.body.solicitud.descripcion);
           request.input("IN_TIPO_SOLICITUD", sql.Int, req.body.solicitud.tipoSolicitud);
           request.input("IN_ID_USUARIO", sql.Int, req.body.solicitud.csIdUsuario);
           request.input("IN_C_CATEGORIA", sql.Int, req.body.solicitud.categoria);
           request.input("IN_CLIENTE", sql.VarChar, req.body.solicitud.cliente);
           request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, req.body.solicitud.documentoCliente);
           request.input("IN_LINEA", sql.VarChar, req.body.solicitud.linea);
   
           request.output("OUT_CS_H_SOLICITUD", sql.Int);
           request.output("MSG", sql.VarChar);
   
           request.execute('DISENO.INSERT_H_SOLICITUDES_COMERCIAL', function (err, recordsets, returnValue) {
               if (err) {
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
                return  res.json({
                       error: err,
                       MSG: err.message
                   });
          
               } else {
   
                   if (request.parameters.MSG.value != "OK") {
                       //res.status(500);
                       transaction.rollback(function (err2) {
                        // ... error checks

                    });
                       return res.json({
                           error: "err",
                           MSG: request.parameters.MSG.value
   
                       });
                     
                   } else {
   
                       var cant = req.body.detalle.length;
 
                       async.each(req.body.detalle, function (item, callback) {
   
                           var requestDt = new sql.Request(transaction);
                           requestDt.verbose = true;
                           requestDt.input("IN_ID_H_SOLICITUD", sql.BigInt, request.parameters.OUT_CS_H_SOLICITUD.value);
                           requestDt.input("IN_DESCRIPCION", sql.VarChar, item.DESCRIPCION);
                           requestDt.input("IN_ALTO", sql.Int, item.ALTO);
                           requestDt.input("IN_ANCHO", sql.Int, item.ANCHO);
                           requestDt.input("IN_FONDO", sql.Int, item.FONDO);
                           requestDt.input("IN_COLORES", sql.VarChar, item.COLORES);
                           requestDt.input("IN_HERRAJES", sql.VarChar, item.HERRAJES);
                           requestDt.input("IN_TIPO_TABLERO", sql.VarChar, item.TIPO_TABLERO);
                           requestDt.input("IN_ESPESOR", sql.VarChar, item.ESPESOR);
                           requestDt.input("IN_CANTO", sql.VarChar, item.CANTO);
                           requestDt.input("IN_FUNCION", sql.VarChar, item.FUNCION);
                           requestDt.input("IN_REQUERIMIENTOS", sql.VarChar, item.REQUERIMIENTOS);
                           requestDt.input("IN_NOMBRE_ACTUAL", sql.VarChar, item.NOMBRE_ACTUAL);
                           requestDt.input("IN_REFERENCIA", sql.VarChar, item.REFERENCIA);
                           requestDt.input("IN_LOTE", sql.Int, item.LOTE);
                           requestDt.input("IN_MARCA", sql.VarChar, item.MARCA);
                           requestDt.input("IN_EMPAQUE", sql.VarChar, item.EMPAQUE);
                           requestDt.input("IN_MODIFICACION", sql.VarChar, item.MODIFICACION);

                           requestDt.input("IN_ID_USUARIO", sql.Int, req.body.solicitud.csIdUsuario);
   
                           requestDt.output("MSG", sql.VarChar);
   
                           requestDt.execute('DISENO.INSERT_H_DISENO', function (err, recordsets, returnValue) {
                               if (err) {
                                   // ... error checks
                                   callback(err.message);
   
                               } else if (requestDt.parameters.MSG.value !== "OK") {
                                   callback(requestDt.parameters.MSG.value);
                               } else {
                                   cant--;
                                   callback();
                               }
   
                           });
                       },
                           function (err) {
   
                               if (err) {
                                   transaction.rollback(function (err2) {
                                   });
                                   return res.json({
                                       error: "err",
                                       MSG: err
                                   });
   
                               } else {
   
                                   if (cant === 0) {
   
                                       /*hacemos commit*/
                                       transaction.commit(function (err, recordset) {
                                           // ... error checks
                                           res.json({
                                               data: [],
                                               'MSG': request.parameters.MSG.value,
                                               "CS_ID_SOLICITUD":request.parameters.OUT_CS_H_SOLICITUD.value
                                           });
   
                                           console.log("Transaction commited.");
                                       });
                                   }
                               }
                           });
                   }
               }
           });
       });
    });
   });
   

//UPDATE DISENO SOLICTUD
router.post('/update_h_diseno_asignacion_disenador', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO", sql.BigInt, req.body.csIdDiseno);
        request.input("IN_FECHA_ESTIMADA", sql.VarChar, req.body.fecha);
        request.input("IN_C_DISENADOR", sql.Int, req.body.c_disenador);
        // request.input("IN_MARCA", sql.Int, req.body.marca_mueble);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.input("IN_SW_SOLICITUD", sql.Bit, req.body.sw_solicitud);
        request.input("IN_OBSERVACION", sql.VarChar, req.body.observacion_asignacion);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.UPDATE_H_DISENO_ASIGNACION', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});



router.post('/update_h_diseno_solicitud_comercial', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_SOLICITUD", sql.BigInt, req.body.csIdSolicitud);
        request.input("IN_NOMBRE_SOLICITUD", sql.VarChar, req.body.nombreSolicitud);
        request.input("IN_DESCRIPCION", sql.VarChar, req.body.descripcion);
        request.input("IN_TIPO_SOLICITUD", sql.Int, req.body.tipoSolicitud);
        request.input("IN_CATEGORIA", sql.Int, req.body.categoria);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.input("IN_CLIENTE", sql.VarChar, req.body.cliente);
        request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, req.body.documentoCliente);
        request.input("IN_LINEA", sql.VarChar, req.body.linea);
        request.output("MSG", sql.VarChar);

        request.execute('DISENO.UPDATE_H_DISENO_SOLICITUD_COMERCIAL', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});




router.post('/update_solicitud_terminar_diseno', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_SOLICITUD", sql.BigInt, req.body.csIdSolicitud);
        request.input("IN_OBSERVACION", sql.VarChar, req.body.observacion);
        request.input("IN_ESTADO", sql.Int, req.body.c_estado);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.output("MSG", sql.VarChar);

        request.execute('DISENO.UPDATE_H_SOLICITUD_TERMINAR_DISENO', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});





//UPDATE DISENO SOLICTUD
router.post('/insert_costo_mueble', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO", sql.BigInt, req.body.csIdDiseno);
        request.input("IN_COSTO", sql.Decimal(16,0), req.body.costo);
        request.input("IN_COSTO_UNITARIO", sql.Decimal(16,0), req.body.costoUnitario);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.INSERT_COSTO_MUEBLE', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});




router.post('/insert_dimensiones', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO", sql.BigInt, req.body.csIdDiseno);
        request.input("IN_DIMENSION_ALTO", sql.Int, req.body.dimensionAlto);
        request.input("IN_DIMENSION_ANCHO", sql.Int, req.body.dimensionAncho);
        request.input("IN_DIMENSION_FONDO", sql.Int, req.body.dimensionFondo);
        request.input("IN_PESO_NETO", sql.Decimal(7,1), req.body.pesoNeto);
        request.input("IN_PESO_BRUTO", sql.Decimal(7,1), req.body.pesoBruto);
        request.input("IN_PAGINAS_INSTRUCTIVO", sql.Int, req.body.paginasinstructivo);
        request.input("IN_OBSERVACION_GENERAL", sql.VarChar, req.body.observacionGeneral);
        request.input("IN_SW_ARMADO", sql.Bit, req.body.swArmado);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.input("IN_SW_MUEBLE_CORONA", sql.Bit, req.body.swMuebleCorona);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.INSERT_DIMENSIONES', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});




router.post('/insert_descripcion_diseno', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO", sql.BigInt, req.body.csIdDiseno);
        request.input("IN_DESCRIPCION_DISENO", sql.VarChar, req.body.descripcionDisenoProyecto);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.INSERT_DESCRIPCION_DISENO', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});









router.post('/update_estado_diseno', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO", sql.BigInt, req.body.csIdDiseno);
        request.input("IN_OBSERVACION", sql.VarChar, req.body.observacion);
        request.input("IN_REFERENCIA", sql.VarChar, req.body.referencia);
        request.input("IN_EAN", sql.VarChar, req.body.ean);
        request.input("IN_ESTADO", sql.Int, req.body.estado);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.input("IN_COSTO_VENTA", sql.Decimal(16,2), req.body.valorCostoVenta);
        request.input("IN_SW_PROTOTIPO", sql.Bit, req.body.sw_prototipo);
        request.input("IN_SW_CREACION_REF", sql.Bit, req.body.sw_creacion_ref);
        request.input("IN_FECHA_ENTREGA_PLANOS", sql.VarChar, req.body.fecha_entrega_planos);
        request.input("IN_FECHA_COMPRA_INSUMOS", sql.VarChar, req.body.fecha_compra_insumos);
        request.input("IN_FECHA_COMPRA_INSUMOS_ESPECIALES", sql.VarChar, req.body.fecha_compra_insumos_especiales);
        request.input("IN_FECHA_ENTREGA_INSUMOS", sql.VarChar, req.body.fecha_entrega_insumos_produccion);
        request.input("IN_FECHA_ENVIO_CORRECCIONES", sql.VarChar, req.body.fecha_envio_correcciones);
        request.input("IN_FECHA_CONFIRMACION_PROTOTIPO", sql.VarChar, req.body.fecha_confimacion_prototipo);
        request.input("IN_SW_MODIFICAR_ESTADO", sql.Bit, req.body.sw_modificar_estado);
        request.input("IN_NOMBRE_FINAL", sql.VarChar, req.body.d_diseno);
        request.input("IN_MARCA", sql.VarChar, req.body.marca);
   
        request.output("MSG", sql.VarChar);

        request.execute('DISENO.UPDATE_ESTADO_DISENO', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});







router.post('/update_estado_diseno_asignar_fecha', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO", sql.BigInt, req.body.csIdDiseno);
        request.input("IN_OBSERVACION", sql.VarChar, req.body.observacion);
        request.input("IN_REFERENCIA", sql.VarChar, req.body.referencia);
        request.input("IN_EAN", sql.VarChar, req.body.ean);
        request.input("IN_ESTADO", sql.Int, req.body.estado);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.input("IN_COSTO_VENTA", sql.Decimal(16,2), req.body.valorCostoVenta);
        request.input("IN_SW_PROTOTIPO", sql.Bit, req.body.sw_prototipo);
        request.input("IN_SW_CREACION_REF", sql.Bit, req.body.sw_creacion_ref);
        request.input("IN_FECHA_ENTREGA_PLANOS", sql.VarChar, req.body.fecha_entrega_planos);
        request.input("IN_FECHA_COMPRA_INSUMOS", sql.VarChar, req.body.fecha_compra_insumos);
        request.input("IN_FECHA_COMPRA_INSUMOS_ESPECIALES", sql.VarChar, req.body.fecha_compra_insumos_especiales);
        request.input("IN_FECHA_ENTREGA_INSUMOS", sql.VarChar, req.body.fecha_entrega_insumos_produccion);
        request.input("IN_FECHA_ENVIO_CORRECCIONES", sql.VarChar, req.body.fecha_envio_correcciones);
        request.input("IN_FECHA_CONFIRMACION_PROTOTIPO", sql.VarChar, req.body.fecha_confimacion_prototipo);
        request.input("IN_SW_MODIFICAR_ESTADO", sql.Bit, req.body.sw_modificar_estado);
        request.output("MSG", sql.VarChar);

        request.execute('DISENO.UPDATE_ESTADO_DISENO_ASIGNAR_FECHA', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});




router.get('/get_referencia_cantos/:filtro', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_FILTRO", sql.VarChar, req.params.filtro);
        //request.verbose = true;

        request.execute('DISENO.SSP_GET_REFERENCIAS_CANTOS', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});



router.get('/get_referencia/:filtro', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_FILTRO", sql.VarChar, req.params.filtro);
        //request.verbose = true;

        request.execute('DISENO.SSP_GET_REFERENCIAS', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});


router.get('/get_referencia_material_empaque/:filtro', function (req, res, next) {
console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_FILTRO", sql.VarChar, req.params.filtro);
        //request.verbose = true;

        request.execute('DISENO.SSP_GET_REFERENCIAS_MATERIAL_EMPAQUE', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});



router.get('/get_referencia_componentes/:filtro', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_FILTRO", sql.VarChar, req.params.filtro);
        //request.verbose = true;

        request.execute('DISENO.SSP_GET_REFERENCIAS_COMPONENTES', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});


router.post('/insert_pieza', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO", sql.BigInt, req.body.csIdDiseno);
        request.input("IN_LETRA", sql.VarChar, req.body.letra);
        request.input("IN_DESCRIPCION", sql.VarChar, req.body.descripcion);
        request.input("IN_CANTIDAD", sql.Int, req.body.cantidad);
        request.input("IN_BASE", sql.Decimal(7,1), req.body.base);
        request.input("IN_ALTURA", sql.Decimal(7,1), req.body.altura);
        request.input("IN_CANTO_ARRIBA", sql.VarChar, req.body.cantoArriba);
        request.input("IN_CANTO_ABAJO", sql.VarChar, req.body.cantoAbajo);
        request.input("IN_CANTO_IZQUIERDA", sql.VarChar, req.body.cantoIzquierda);
        request.input("IN_CANTO_DERECHA", sql.VarChar, req.body.cantoDerecha);
        request.input("IN_SW_PREPROCESO", sql.Bit, req.body.swPreproceso);
        request.input("IN_ID_PREPROCESO", sql.VarChar, req.body.idPreproceso);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.input("IN_REFERENCIA", sql.VarChar, req.body.referenciaProducto);
        request.input("IN_SW_ROTA", sql.Bit, req.body.swRota);
        request.input("IN_SW_PUERTA", sql.Bit, req.body.swPuerta);
        request.input("IN_SW_CAJON", sql.Bit, req.body.swCajon);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.INSERT_DT_DISENO', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});


router.get('/get_piezas_diseno/:csIdDiseno', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_ID_DISENO", sql.Int, req.params.csIdDiseno);
        //request.verbose = true;

        request.execute('DISENO.SSP_GET_PIEZAS_DISENO', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});



// router.get('/get_costos_mueble/:csIdDiseno', function (req, res, next) {
//     console.log(req.params);
//     //return;
//     config.configBD2.database = CONSTANTES.DISENOBD;
//     console.log(config.configBD2.database);
//     var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
//         // ... error checks
//         if (err) {
//             console.error(err);
//             res.json(err);
//         }

//         // Stored Procedure
//         var request = new sql.Request(connection);
//         request.input("IN_ID_DISENO", sql.Int, req.params.csIdDiseno);
//         //request.verbose = true;

//         request.execute('DISENO.SSP_GET_COSTOS_MUEBLE', function (err, recordsets, returnValue) {
//             if (err) {
//                 res.json(err);
//             }

//             res.json({
//                 data: recordsets
//             });
//         });

//     });
// });





router.post('/get_costos_mueble', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        request.input("IN_ID_DISENO", sql.Int, req.body.csIdDiseno);
        request.output("MSG", sql.VarChar);

        request.execute('DISENO.SSP_GET_COSTOS_MUEBLE', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            data: recordsets,
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});





router.post('/update_pieza', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO", sql.BigInt, req.body.csIdDiseno);
        request.input("IN_LETRA", sql.VarChar, req.body.letra);
        request.input("IN_DESCRIPCION", sql.VarChar, req.body.descripcion);
        request.input("IN_CANTIDAD", sql.Int, req.body.cantidad);
        request.input("IN_BASE", sql.Decimal(7,1), req.body.base);
        request.input("IN_ALTURA", sql.Decimal(7,1), req.body.altura);
        request.input("IN_CANTO_ARRIBA", sql.VarChar, req.body.cantoArriba);
        request.input("IN_CANTO_ABAJO", sql.VarChar, req.body.cantoAbajo);
        request.input("IN_CANTO_IZQUIERDA", sql.VarChar, req.body.cantoIzquierda);
        request.input("IN_CANTO_DERECHA", sql.VarChar, req.body.cantoDerecha);
        request.input("IN_SW_PREPROCESO", sql.VarChar, req.body.swPreproceso);
        request.input("IN_ID_PREPROCESO", sql.VarChar, req.body.idPreproceso || null);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.input("IN_CS_ID_DT_DISENO", sql.Int, req.body.csIdDtDiseno);
        request.input("IN_REFERENCIA", sql.VarChar, req.body.referenciaProducto);
        request.input("IN_SW_ROTA", sql.Bit, req.body.swRota);
        request.input("IN_SW_PUERTA", sql.Bit, req.body.swPuerta);
        request.input("IN_SW_CAJON", sql.Bit, req.body.swCajon);
 
        request.output("MSG", sql.VarChar);

        request.execute('DISENO.UPDATE_DT_DISENO', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});


router.post('/delete_pieza', function (req, res, next) {

    console.log(req.body)

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);


    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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
        //request.verbose = true;
        request.input("IN_CS_ID_DT_DISENO", sql.Int, req.body.cs_id_dt_diseno);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.DELETE_DT_DISENO', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});


router.post('/anular_solicitud_comercial', function (req, res, next) {
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);


    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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
        //request.verbose = true;
        request.input("IN_CS_ID_SOLICITUD", sql.Int, req.body.cs_id_h_solicitud_comercial);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.ANULAR_SOLICITUD_COMERCIAL', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});



router.post('/insert_componente', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_CS_ID_DT_DISENO", sql.BigInt, req.body.csIdDiseno);
        request.input("IN_REFERENCIA", sql.VarChar, req.body.referencia);
        request.input("IN_CANTIDAD", sql.Decimal(7,1), req.body.cantidad);
        request.input("IN_MEDIDA", sql.VarChar, req.body.medida);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.input("IN_SW_REF_NUEVA", sql.Bit, req.body.sw_referencia_nueva || null);
        request.input("IN_D_REFERNCIA_NUEVA", sql.VarChar, req.body.d_referencia_nueva || null);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.INSERT_DT_COMPONENTE', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});


router.post('/insert_materialemp', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO", sql.BigInt, req.body.csIdDiseno);
        request.input("IN_REFERENCIA", sql.VarChar, req.body.referencia);
        request.input("IN_CANTIDAD", sql.Decimal(16,2), req.body.cantidad);
        request.input("IN_ALTO", sql.Int, req.body.alto || null);
        request.input("IN_ANCHO", sql.Int, req.body.ancho || null);
        request.input("IN_LARGO", sql.Int, req.body.largo || null);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.input("IN_SW_ISTA", sql.Bit, req.body.sw_empaque_ista || null);
        request.input("IN_SW_REF_NUEVA", sql.Bit, req.body.sw_referencia_nueva || null);
        request.input("IN_D_REFERNCIA_NUEVA", sql.VarChar, req.body.d_referencia_nueva || null);
        request.input("IN_SW_ISTA_SENCILLO", sql.Bit, req.body.sw_empaque_ista_sencillo || null);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.INSERT_DT_MATERIAL_EMPAQUE', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});



router.get('/get_solicitud_comercial/:csIdUsuario', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_CS_ID_USUARIO", sql.Int, req.params.csIdUsuario);
        //request.verbose = true;

        request.execute('DISENO.SSP_GET_TIPOS_SOLICITUD', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});


router.post('/enviar_correo_solicitud_comercial', function (req, res, next) {
    console.log(req.body);
    // return;
    config.configBD2.database = CONSTANTES.DISENOBD;

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        request.input("IN_CS_ID_DISENO", sql.BigInt, req.body.csIdDiseno);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.SSP_ENVIAR_CORREO_SOLCITUD_DISENO_COMERCIAL', function (err, recordsets, returnValue) {
            if (err) {
                //res.status(err.status || 500);
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





router.post('/enviar_correo_update_fecha', function (req, res, next) {
    console.log(req.body);
    // return;
    config.configBD2.database = CONSTANTES.DISENOBD;

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        request.input("IN_CS_ID_DISENO", sql.BigInt, req.body.csIdDiseno);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.SSP_ENVIAR_CORREO_SOLCITUD_DISENO_COMERCIAL', function (err, recordsets, returnValue) {
            if (err) {
                //res.status(err.status || 500);
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





router.get('/get_disenos_nuevos/:csIdUsuario', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_CS_ID_USUARIO", sql.Int, req.params.csIdUsuario);
        //request.verbose = true;

        request.execute('DISENO.SSP_GET_LISTA_DISENOS_NUEVOS', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});



router.get('/get_detalle_solicitud_comercial/:csIdSolicitud', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_CS_ID_SOLICITUD", sql.BigInt, req.params.csIdSolicitud);
        //request.verbose = true;

        request.execute('DISENO.GET_DETALLE_SOLICITUD_COMERCIAL', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});




router.get('/get_detalle_solicitud_comercial_diseno/:csIdSolicitud/:csIdUsuario', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_CS_ID_SOLICITUD", sql.BigInt, req.params.csIdSolicitud);
        request.input("IN_CS_ID_USUARIO", sql.Int, req.params.csIdUsuario);
        //request.verbose = true;

        request.execute('DISENO.GET_DETALLE_SOLICITUD_COMERCIAL_DISENO', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});


router.get('/get_imagenes_solicitud/:csIdSolicitud', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_CS_ID_SOLICITUD", sql.BigInt, req.params.csIdSolicitud);
        //request.verbose = true;

        request.execute('DISENO.GET_IMAGENES_SOLICITUD', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});




router.get('/get_servicios_by_pieza/:csDtDiseno', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_CS_ID_DT_DISENO", sql.BigInt, req.params.csDtDiseno);
        //request.verbose = true;

        request.execute('DISENO.GET_SERVICIOS_BY_PIEZA', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});




router.get('/get_componentes_by_pieza/:csDtDiseno', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_CS_ID_DT_DISENO", sql.BigInt, req.params.csDtDiseno);
        //request.verbose = true;

        request.execute('DISENO.GET_COMPONENTES_BY_PIEZA', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});




router.post('/insert_servicios_pieza', function (req, res, next) {
    var conexion = utils.clone(config.configBD2);

    //Utilizar driver para controlar errores de conversión 
    // conexion.driver = "msnodesqlv8";
    conexion.database = CONSTANTES.DISENOBD;

    var connection = new sql.Connection(conexion);

    connection.connect(function (err) {

        var transaction = new sql.Transaction(connection);

        transaction.begin(function (err) {
            // ... error checks
            if (err) {
                return res.json({
                    error: err,
                    MSG: err.message
                });
            }

            var request = new sql.Request(transaction);

           // Stored Procedure
           request.input("IN_CS_ID_DT_DISENO", sql.BigInt, req.body.pieza.csIdDtDiseno);

           request.output("MSG", sql.VarChar);
   
           request.execute('DISENO.DELETE_DT_SERVICIOS_PIEZA', function (err, recordsets, returnValue) {
               if (err) {
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
                return  res.json({
                       error: err,
                       MSG: err.message
                   });
          
               } else {
   
                   if (request.parameters.MSG.value != "OK") {
                       //res.status(500);
                       transaction.rollback(function (err2) {
                        // ... error checks

                    });
                       return res.json({
                           error: "err",
                           MSG: request.parameters.MSG.value
   
                       });
                     
                   } else {
   
                       var cant = req.body.servicios.length;
 
                       async.each(req.body.servicios, function (item, callback) {
   
                           var requestDt = new sql.Request(transaction);
                           requestDt.verbose = true;
                           requestDt.input("IN_CS_ID_DT_DISENO", sql.BigInt, req.body.pieza.csIdDtDiseno);
                           requestDt.input("IN_C_SERVICIO", sql.VarChar, item.c_servicio);
                           requestDt.input("IN_ORDEN", sql.Int, item.orden);
                           requestDt.input("IN_VALOR", sql.Int, item.valor || null);
                           
                           requestDt.input("IN_ID_USUARIO", sql.Int, req.body.pieza.csIdUsuario);
   
                           requestDt.output("MSG", sql.VarChar);
   
                           requestDt.execute('DISENO.INSERT_DT_SERVICIOS_PIEZA', function (err, recordsets, returnValue) {
                               if (err) {
                                   // ... error checks
                                   callback(err.message);
   
                               } else if (requestDt.parameters.MSG.value !== "OK") {
                                   callback(requestDt.parameters.MSG.value);
                               } else {
                                   cant--;
                                   callback();
                               }
   
                           });
                       },
                           function (err) {
   
                               if (err) {
                                   transaction.rollback(function (err2) {
                                   });
                                   return res.json({
                                       error: "err",
                                       MSG: err
                                   });
   
                               } else {
   
                                   if (cant === 0) {
   
                                       /*hacemos commit*/
                                       transaction.commit(function (err, recordset) {
                                           // ... error checks
                                           res.json({
                                               data: [],
                                               'MSG': request.parameters.MSG.value
                                           });
   
                                           console.log("Transaction commited.");
                                       });
                                   }
                               }
                           });
                   }
               }

           });

       });

    });

   });
   

   router.get('/get_disenos_by_estado/:csIdUsuario/:estado', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_CS_ID_USUARIO", sql.Int, req.params.csIdUsuario);
        request.input("IN_ESTADO", sql.Int, req.params.estado);
        //request.verbose = true;

        request.execute('DISENO.GET_DISENOS_BY_ESTADO', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });


    });
});



router.get('/getDisenosHistorico/:csIdUsuario/:year/:month', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_CS_ID_USUARIO", sql.Int, req.params.csIdUsuario);
        request.input("IN_ANIO", sql.Int, req.params.year);
        request.input("IN_MES", sql.Int, req.params.month);
        //request.verbose = true;

        request.execute('DISENO.GET_DISENOS_HISTORICO', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });


    });
});


router.post('/PostFormDataComercial/:in_id_estructura_gdocumental/:csIdSolicitud/:cs_id_usuario/:extension/:sw_solicitud',

    multipartMiddleware, function (req, res) {

        console.log(req.params);
        console.log('Entra');
        
        config.configBD2.database = CONSTANTES.DISENOBD;

        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        });
        var transaction = new sql.Transaction(connection);

        transaction.begin(function (err) {
            // ... error checks
            if (err) {
                console.error(err);
                //res.status(err.status || 500);
                console.log('entroo aca 0');
                res.json({
                    error: err,
                    MSG: err.message
                });
            }

            if (req.params.observacion == 'null')
                req.params.observacion = null;


            var request = new sql.Request(transaction);


            request.verbose = true;
            request.input('IN_ID_ESTRUCTURA_GDOCUMENTAL',sql.VarChar, req.params.in_id_estructura_gdocumental);
            request.input('IN_SOLICITUD_COMERCIAL', sql.BigInt, req.params.csIdSolicitud);
            request.input('IN_LOG_INSERT', sql.Int, req.params.cs_id_usuario);
            request.input('IN_EXTENSION', sql.VarChar, req.params.extension);
            request.input('IN_SW_SOLICITUD', sql.VarChar, req.params.sw_solicitud);

                     //parámetros de salidas
            request.output('OUT_NOMBRE_ARCHIVO', sql.VarChar); //nombre del archivo
            request.output('OUT_RUTA_ARCHIVO', sql.VarChar); //este es la ruta que necesitamos
            request.output('MSG', sql.VarChar);

            request.execute('DISENO.SSP_INSERT_MV_GD_SOLICITUD_COMERCIAL', function (err, recordsets, returnValue) {
                if (err) {
                    console.log('entroo aca 1');
                    //res.status(err.status || 500);
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
                        console.log('entroo aca 2');
                        res.json({
                            error: "err",
                            MSG: request.parameters.MSG.value
                        });
                        transaction.rollback(function (err2) {   // ... error checks
                        });
                    } else {
                        var nombre_archivo = request.parameters.OUT_NOMBRE_ARCHIVO.value;
                        var rutaFisicaServidor = request.parameters.OUT_RUTA_ARCHIVO.value;
                        var newPath = rutaFisicaServidor + "/" + nombre_archivo + "." + req.params.extension;
                        console.log(nombre_archivo);
                        console.log(rutaFisicaServidor);
                        //return;


                        fs.exists(rutaFisicaServidor, function (exists) {
                            if (exists) {
                                fs.readFile(req.files.file.path, function (err, data) {
                                    var imageName = req.files.file.name;
                                    /// If there's an error
                                    if (!imageName) {
                                        console.log("There was an error");
                                        //res.redirect("/");
                                        res.end();
                                    } else {
                                        console.log(rutaFisicaServidor);
                                        console.log(newPath);
                                        /// write file to uploads/fullsize folder
                                        fs.writeFile(newPath, data, function (err) {
                                            if (err) {
                                                console.error(err);
                                                //res.status(err.status || 500);
                                                res.json({
                                                    error: err,
                                                    MSG: err.message
                                                });
                                                transaction.rollback(function (err2) {
                                                });
                                            } else {
                                                
                                                transaction.commit(function (err, recordset) {
                                                    // ... error checks 
                                                    //res.json({
                                                    //    'MSG': "GUARDADO"
                                                    //});
                                                    console.log("Transaction commited.");
                                                });
                                                res.json({
                                                    data: recordsets,
                                                    'MSG': request.parameters.MSG.value
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                res.json({
                                    data: recordsets,
                                    'MSG': "No se encontró la ruta " + rutaFisicaServidor
                                });
                                transaction.rollback(function (err2) {
                                });
                            }
                        });
                    }
                }
            });
        });
    });



    router.post('/PostFormDataDiseno/:in_id_estructura_gdocumental/:csIdDiseno/:cs_id_usuario/:extension',

    multipartMiddleware, function (req, res) {

        console.log(req.params);
        console.log('Entra');
        
        config.configBD2.database = CONSTANTES.DISENOBD;

        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        });
        var transaction = new sql.Transaction(connection);

        transaction.begin(function (err) {
            // ... error checks
            if (err) {
                console.error(err);
                //res.status(err.status || 500);
                console.log('entroo aca 0');
                res.json({
                    error: err,
                    MSG: err.message
                });
            }

            if (req.params.observacion == 'null')
                req.params.observacion = null;


            var request = new sql.Request(transaction);


            request.verbose = true;
            request.input('IN_ID_ESTRUCTURA_GDOCUMENTAL',sql.VarChar, req.params.in_id_estructura_gdocumental);
            request.input('IN_ID_DISENO', sql.BigInt, req.params.csIdDiseno);
            request.input('IN_LOG_INSERT', sql.Int, req.params.cs_id_usuario);
            request.input('IN_EXTENSION', sql.VarChar, req.params.extension);

                     //parámetros de salidas
            request.output('OUT_NOMBRE_ARCHIVO', sql.VarChar); //nombre del archivo
            request.output('OUT_RUTA_ARCHIVO', sql.VarChar); //este es la ruta que necesitamos
            request.output('MSG', sql.VarChar);

            request.execute('DISENO.SSP_INSERT_MV_GD_DISENO', function (err, recordsets, returnValue) {
                if (err) {
                    console.log('entroo aca 1');
                    //res.status(err.status || 500);
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
                        console.log('entroo aca 2');
                        res.json({
                            error: "err",
                            MSG: request.parameters.MSG.value
                        });
                        transaction.rollback(function (err2) {   // ... error checks
                        });
                    } else {
                        var nombre_archivo = request.parameters.OUT_NOMBRE_ARCHIVO.value;
                        var rutaFisicaServidor = request.parameters.OUT_RUTA_ARCHIVO.value;
                        var newPath = rutaFisicaServidor + "/" + nombre_archivo + "." + req.params.extension;
                        console.log(nombre_archivo);
                        console.log(rutaFisicaServidor);
                        //return;


                        fs.exists(rutaFisicaServidor, function (exists) {
                            if (exists) {
                                fs.readFile(req.files.file.path, function (err, data) {
                                    var imageName = req.files.file.name;
                                    /// If there's an error
                                    if (!imageName) {
                                        console.log("There was an error");
                                        //res.redirect("/");
                                        res.end();
                                    } else {
                                        console.log(rutaFisicaServidor);
                                        console.log(newPath);
                                        /// write file to uploads/fullsize folder
                                        fs.writeFile(newPath, data, function (err) {
                                            if (err) {
                                                console.error(err);
                                                //res.status(err.status || 500);
                                                res.json({
                                                    error: err,
                                                    MSG: err.message
                                                });
                                                transaction.rollback(function (err2) {
                                                });
                                            } else {
                                                
                                                transaction.commit(function (err, recordset) {
                                                    // ... error checks 
                                                    //res.json({
                                                    //    'MSG': "GUARDADO"
                                                    //});
                                                    console.log("Transaction commited.");
                                                });
                                                res.json({
                                                    data: recordsets,
                                                    'MSG': request.parameters.MSG.value
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                res.json({
                                    data: recordsets,
                                    'MSG': "No se encontró la ruta " + rutaFisicaServidor
                                });
                                transaction.rollback(function (err2) {
                                });
                            }
                        });
                    }
                }
            });
        });
    });






    
router.post('/getparametrosmulti', function (req, res, next) {

    config.configBD2.database = CONSTANTES.DISENOBD;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            return res.json(err);
        }
        // Stored Procedure
        var request     = new sql.Request(connection);

        request.verbose = false;
        request.input("IN_LIST_PARAMETROS", sql.VarChar, req.body.parametros);

        request.execute('DISENO.SSP_CORPORATIVA_PARAMETRO_MULTI', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }
            res.json({
                data: recordsets
            });
        });

    });

});



router.post('/insert_caja', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO", sql.BigInt, req.body.csIdDiseno);
        request.input("IN_CANTIDAD", sql.Int, req.body.cantidad);
        request.input("IN_ALTO", sql.Int, req.body.alto );
        request.input("IN_ANCHO", sql.Int, req.body.ancho );
        request.input("IN_LARGO", sql.Int, req.body.largo );
        request.input("IN_POLIETILENO", sql.Decimal(7,3), req.body.consumo_polietileno);
        request.input("IN_PLASTICO", sql.Int, req.body.ancho_plastico );
        request.input("IN_OBSERVACION", sql.VarChar, req.body.observacion);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.input("IN_SW_ISTA", sql.Bit, req.body.sw_empaque_ista);
        request.input("IN_SW_ISTA_SENCILLO", sql.Bit, req.body.sw_empaque_ista_sencillo);
        

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.INSERT_DT_CAJA_DISENO', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});



//elminar componente
router.post('/delete_componente', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_COMPONENTE", sql.BigInt, req.body.csIdComponenteDelete);
     

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.DELETE_COMPONENTE', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});






//elminar caja
router.post('/deleteCaja', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_CAJA", sql.BigInt, req.body.cs_id_caja_diseno);
     

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.DELETE_CAJA', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});







//elminar MATERIAL DE EMPAQUE
router.post('/deleteMaterialEmpaque', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_MATERIAL_EMPAQUE", sql.BigInt, req.body.cs_id_material_empaque);
     

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.DELETE_MATERIAL_EMPAQUE', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});



//elminar IMAGEN
router.post('/deleteImagen', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_IMAGEN", sql.BigInt, req.body.cs_id_mv_gd_diseno);
     

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.DELETE_IMAGEN_DISENO', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});





router.get('/getClientes/:filtro', function (req, res, next) {

    config.configBD2.database = CONSTANTES.CRMBD;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            return res.json(err);
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_FILTRO", sql.VarChar, req.params.filtro);
        request.output('MSG', sql.VarChar(200));
        request.execute('CRM.SSP_CRM_GET_CLIENTE_UNOEE_BY_FILTRO', function (err, recordsets, returnValue) {
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





router.post('/guardarOptimizacion', function (req, res, next) {

console.log(req.body);


    config.configBD2.database = CONSTANTES.DISENOBD;
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
    });
    var transaction = new sql.Transaction(connection);



    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        var contador = Object.keys(req.body.detalle).length;

        async.each(req.body.detalle, function (item, callback) {

            var request = new sql.Request(transaction);


            const tableDatos = new sql.Table();

            let planos_corte = item.planos_corte || []

            tableDatos.columns.add("altura", sql.Decimal(16, 0));
            tableDatos.columns.add("base", sql.Decimal(16, 0));
            tableDatos.columns.add("cant_tableros", sql.Decimal(16, 0));
            tableDatos.columns.add("cant_piezas", sql.Decimal(16, 0));
            tableDatos.columns.add("ml_sierra", sql.Decimal(16, 0));

            if(planos_corte.length >0){

                
 
       
    
    
            planos_corte.forEach(plano => {
                if(!item.sw_canto){

                    tableDatos.rows.add(
                        plano.altura,
                        plano.base,
                        plano.cant,
                        plano.cant_piezas,
                        plano.ml_sierra
                  
                    );

                }
               
      
            });

            console.log(planos_corte)

            }
    


            /*eliminar la ref de la tabla*/
            request.verbose = true;
            request.input("IN_ID_DISENO", sql.BigInt, req.body.csIdDiseno);
            request.input("IN_REFERENCIA", sql.VarChar, item.referencia);
            request.input("IN_CANTIDAD", sql.Decimal(16,2), item.cantidad);
            request.input("IN_ESPESOR", sql.Decimal(7,2), item.espesor);
            request.input("IN_PJ_DESPERDICIO", sql.Decimal(16,2), item.pj_desperdicio);
            request.input("IN_SW_CANTO", sql.Bit, item.sw_canto);
            request.input("IN_PDF", sql.VarChar, item.pdf);
            request.input("IN_ID_USUARIO", sql.Int,  req.body.csIdUsuario);
            request.input("IN_M2_UTILIZADOS", sql.Decimal(7,2), item.m2_utilizados);
            request.input("IN_ML_CORTE", sql.Decimal(16,2), item.ml_corte || null);
            request.input("IN_ML_DESPL_SIERRA", sql.Decimal(16,2), item.ml_desp_sierra ||  null);
            request.input("IN_PLANOS_CORTE", tableDatos)

            request.output('MSG', sql.VarChar(200));

            request.execute('DISENO.SSP_INSERT_OPTIMIZACION', function (err, recordsets, returnValue) {
                if (err) {
                    res.status(err.status || 500);
                    res.json({
                        error: err,
                        MSG: err.message
                    });
                    transaction.rollback(function (err) {
                        // ... error checks
                    });
                } else {

                    if (request.parameters.MSG.value != "OK") {
                        //res.status(500);
                        res.json({
                            error: "err",
                            MSG: request.parameters.MSG.value
                        });
                        transaction.rollback(function (err2) {
                            // ... error checks

                        });
                    } else {

                        contador--;
                        if (contador == 0) {
                            transaction.commit(function (err, recordset) {
                                // ... error checks
                                res.json({
                                    data: [],
                                    'MSG': "OK"
                                });
                                console.log("Transaction commited.");
                            });
                        }
                    }
                }
            });
        });
        //});

    });
});







router.post('/update_estado_diseno_devolver', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO", sql.BigInt, req.body.cs_id_h_diseno);
        request.input("IN_OBSERVACION", sql.VarChar, req.body.observacion);
        request.input("IN_ESTADO", sql.Int, req.body.c_estado_diseno);
        request.input("IN_ID_USUARIO", sql.Int, req.body.cs_id_usuario);
      
        request.output("MSG", sql.VarChar);

        request.execute('DISENO.UPDATE_ESTADO_DISENO_DEVOLVER', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});






router.get('/getDisenosDuplicar', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;

        request.execute('DISENO.SSP_GET_DISENOS_DUPLICAR', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});











router.post('/duplicarDiseno', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_ID_DISENO_DUPLICAR", sql.BigInt, req.body.cs_id_h_diseno_duplicar);
          request.input("IN_ID_DISENO", sql.BigInt, req.body.cs_id_h_diseno);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.SSP_INSERT_DUPLICAR_DISENO', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});




//update item ov
router.post('/update_item_costo', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_CS_ID", sql.BigInt, req.body.csId);
        request.input("IN_COSTO", sql.Decimal(16,2), req.body.costo);
        request.input("IN_CS_ID_USUARIO", sql.Int, req.body.cs_IdUsuario);
        request.input("IN_TIPO", sql.VarChar, req.body.tipo);
        request.input("IN_REF", sql.VarChar, req.body.ref);
        request.input("IN_CS_ID_DISENO", sql.BigInt, req.body.csIdDiseno);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.SSP_UPDATE_ITEM_COSTOS', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});




router.get('/getResumenCostoMueble/:csIdDiseno', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_ID_DISENO", sql.BigInt, req.params.csIdDiseno);
        //request.verbose = true;

        request.execute('DISENO.SSP_GET_RUSUMEN_COSTOS_MUEBLE', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});




router.get('/get_productos/:filtro', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_FILTRO", sql.VarChar, req.params.filtro);

        request.execute('DISENO.SSP_GET_PRODUCTOS', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});





router.get('/getCostoActualMueble/:referencia', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_REFERENCIA", sql.VarChar, req.params.referencia);

        request.execute('DISENO.SSP_GET_COSTO_ACTUAL_MUEBLE', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});



router.get('/getInformacionNubeMueble/:referencia', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_REFERENCIA", sql.VarChar, req.params.referencia);

        request.execute('DISENO.SSP_GET_INFORMACION_NUBE_MUEBLE', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});




router.get('/getArchivosNube/:referencia/:id_estructura', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_REFERENCIA", sql.VarChar, req.params.referencia);
        request.input("IN_IDESTRUCTURA", sql.VarChar, req.params.id_estructura);

        request.execute('DISENO.SSP_GET_ARCHIVOS_NUBE_MUEBLE', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});





router.get('/getReferenciasbydiseno/:csIdDiseno', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_ID_DISENO", sql.VarChar, req.params.csIdDiseno);

        request.execute('DISENO.SSP_GET_REFERENCIAS_COMPRAS', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});






//update item ov
router.post('/updateRefUnoee', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_CS_ID", sql.BigInt, req.body.csId);
        request.input("IN_REFERENCIA", sql.VarChar, req.body.referencia);
        request.input("IN_TIPO", sql.VarChar, req.body.tipo);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.SSP_UPDATE_REFERENCIA_UNOEE', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});




router.get('/getDisenosHistoricoRef/:referencia/:cs_id', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_REFERENCIA", sql.VarChar, req.params.referencia);
        request.input("IN_CS_ID", sql.BigInt, req.params.cs_id);
        //request.verbose = true;

        request.execute('DISENO.GET_DISENOS_HISTORICO_BY_REF', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });


    });
});



router.post('/PostForm/:id_log_insert/:extension',

multipartMiddleware, function (req, res) {

    console.log(req.params);
    console.log(req.body);
    console.log(req.files)

    let nombre_archivo =""
    nombre_archivo =req.files.file.name

    var filenameWithExtension = nombre_archivo.split('.').pop(); 

    filenameWithExtension = '.' +filenameWithExtension
    console.log(filenameWithExtension);
    
    nombre_archivo = nombre_archivo.replace(filenameWithExtension ,'')

    console.log(nombre_archivo);

    config.configBD2.database = CONSTANTES.DISENOBD;

    var connection = new sql.connect(utils.clone(config.configBD2), function (err) {

        const transaction = new sql.Transaction(connection);

        transaction.begin(function (err) {
            // ... error checks
            if (err) {
                console.error(err);
                //res.status(err.status || 500);
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                });
                sql.close();
                return;
            }

            // Stored Procedure 
            var request = new sql.Request(transaction);

            request.verbose = true;
            request.input('IN_REFERENCIA', sql.VarChar, req.body.referencia);
            request.input('IN_LOG_INSERT', sql.Int, req.params.id_log_insert);
            request.input('IN_EXTENSION', sql.VarChar, req.params.extension);
            request.input('IN_OBSERVACION', sql.VarChar, req.body.observacion || null);
            request.input('IN_VERSION', sql.Int, req.body.version || 1);
            request.input('IN_ID_ESTRUCTURA', sql.VarChar, req.body.id_estructura || null);
            request.input('IN_NOMBRE_ARCHIVO', sql.VarChar, nombre_archivo || null);
            request.input('IN_SW_VERSION_NUEVA', sql.Bit, req.body.sw_nueva_version || null);
            request.input('IN_NOMBRE_ARCHIVO_VERSION', sql.VarChar, req.body.archivo_nueva_version  || null);
            request.input('IN_CS_ID_ARCHIVO_VERSION', sql.BigInt, req.body.cs_id_archivo_nueva_version  || null);
         
            //parámetros de salidas
            request.output('OUT_NOMBRE_ARCHIVO', sql.VarChar);
            request.output('OUT_RUTA_AMAZON_GESTION_DOCUMENTAL', sql.VarChar);
            request.output('MSG', sql.VarChar);

            request.execute('DISENO.SSP_INSERT_DOCUMENTOS', function (err, recordsets, returnValue) {
                if (err) {
                    
                    res.json({
                        error: err,
                        MSG: err.message
                    });
                    transaction.rollback(err => {
                        // ... error checks
                    })
                    sql.close();
                } else {

                    if (request.parameters.MSG.value!= "GUARDADO") {
                        //res.status(500);
                        console.log('entroo aca 2');
                        res.json({
                            error: "err",
                            MSG: request.parameters.MSG.value
                        });
                        transaction.rollback(err => {
                            // ... error checks
                        });
                        sql.close();
                    } else {
                        var nombre_archivo = request.parameters.OUT_NOMBRE_ARCHIVO.value.trim() + '.' + req.params.extension;
                        var rutaFisicaServidor = request.parameters.OUT_RUTA_AMAZON_GESTION_DOCUMENTAL.value;
                        var file = req.files.file;
                        
                        
                        nombre_archivo =nombre_archivo.trim();


                        console.log(nombre_archivo);

                        console.log(rutaFisicaServidor);
                        console.log(file)


                        AWS.config.update({
                            accessKeyId: 'AKIA564SKHXJDNQRHCPW',
                            secretAccessKey: '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'
                        });


                        fs.readFile(file.path, function (err, data) {

                            var dataArchivo = data

                            if (err) throw err; // Something went wrong!
                            var s3bucket = new AWS.S3(); //({ params: { Bucket: 'mdcpruebaupload' } });
                            s3bucket.createBucket(function () {
                                var params = {
                                    //Key: file.originalFilename, //file.name doesn't exist as a property
                                    //Body: data,
                                    Bucket: rutaFisicaServidor,
                                    Key: nombre_archivo,
                                    Body: data,
                                    ACL: 'public-read',
                                    ContentType: "application/pdf"
                                };
                                s3bucket.upload(params, function (err, data) {
                                    let savePath = rutaFisicaServidor + "/" + nombre_archivo;

                                    // Whether there is an error or not, delete the temp file
                                    fs.unlink(file.path, function (err) {
                                        if (err) {
                                            console.error(err);
                                            res.json({
                                                error: err,
                                                MSG: err.message
                                            });
                                            transaction.rollback(err => {
                                                // ... error checks
                                            });
                                            sql.close();
                                        }
                                        console.log('Temp File Delete');
                                    });

                                    console.log("PRINT FILE:", nombre_archivo);
                                    if (err) {
                                        console.log('ERROR MSG: ', err);
                                        // reject(err);
                                    } else {
                                        console.log('Successfully uploaded data');
                                

                                        transaction.commit(function (err) {
                                     
                                            console.log("Transaction commited.");
                                        });
                                        res.json({
                                            'MSG': request.parameters.MSG.value
                                        });
                                        sql.close();


                              
                                    }
                                });
                            });
                        });

                    }
                }
            });
        });



    });

});



router.post('/insert_relacion_archivo_ref', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_CS_ID", sql.BigInt, req.body.cs_id);
        request.input("IN_LISTA_REF", sql.VarChar, req.body.listaRef);
        request.input('IN_LOG_INSERT', sql.Int, req.body.cs_id_usuario);
        request.output("MSG", sql.VarChar);

        request.execute('DISENO.SSP_INSERT_RELACION_ARCHIVO_NUBE', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});



router.post('/insertarGdocumentalAmazon_basico', function (req, res) {

    var form = new multiparty.Form();

    form.parse(req, function (err, fields, files) {
        if (err) {
          //return error
          console.error(err);
           //   res.status(err.status || 500);
              res.json({
                  error: err,
                  MSG: err.message
              });
        }
    
    console.log(files.archivos)

    // Object.keys(files).forEach(file => {
    //     const fileName = uuid.v4().toUpperCase() + "." + (regexExtension.exec(files[file][0].originalFilename)[1] || files[file][0].originalFilename);
    //     const extencion =  (regexExtension.exec(files[file][0].originalFilename)[1] || files[file][0].originalFilename);
    //     console.log(fileName)
    //      console.log(extencion)
    //   });

      let objDocumental = [];

      for (const field in fields) {
        if (fields.hasOwnProperty(field)) {
          const fieldData = fields[field];
  
          switch (field) {
            case "objDocumental":
                objDocumental = JSON.parse(fieldData[0]);
              break;
        
          }
        }
      }

      console.log(objDocumental);


      let detalle = files.archivos;

      config.configBD2.database = CONSTANTES.DISENOBD;
      var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
      });
      var transaction = new sql.Transaction(connection);
  
  
  
      transaction.begin(function (err) {
          // ... error checks
          if (err) {
              console.error(err);
           //   res.status(err.status || 500);
              res.json({
                  error: err,
                  MSG: err.message
              });
          }
  
          var contador = Object.keys(detalle).length;
          console.log(contador);
  
          async.each(detalle, function (item, callback) {


              //extension del archivo a almacenar 
              item.extencion =  (regexExtension.exec(item.originalFilename)[1] || item.originalFilename);
          
              console.log(item);
              console.log(objDocumental);

              //Nombre archivo 
              let nombre_archivo =""
              nombre_archivo =item.originalFilename
          
              var filenameWithExtension = nombre_archivo.split('.').pop(); 
          
              filenameWithExtension = '.' +filenameWithExtension
              console.log(filenameWithExtension);
              
              nombre_archivo = nombre_archivo.replace(filenameWithExtension ,'')
          
              console.log(nombre_archivo);
          

  
              var request = new sql.Request(transaction);
  
              /*eliminar la ref de la tabla*/
              request.verbose = true;
              request.input('IN_REFERENCIA', sql.VarChar, objDocumental.referencia);
              request.input('IN_LOG_INSERT', sql.Int, objDocumental.cs_id_usuario);
              request.input('IN_EXTENSION', sql.VarChar, item.extencion);
              request.input('IN_OBSERVACION', sql.VarChar, objDocumental.observacion || null);
              request.input('IN_VERSION', sql.Int, objDocumental.version || 1);
              request.input('IN_ID_ESTRUCTURA', sql.VarChar, objDocumental.id_estructura || null);
              request.input('IN_NOMBRE_ARCHIVO', sql.VarChar, nombre_archivo || null);
              request.input('IN_SW_VERSION_NUEVA', sql.Bit, objDocumental.sw_nueva_version || null);
              request.input('IN_NOMBRE_ARCHIVO_VERSION', sql.VarChar, objDocumental.archivo_nueva_version  || null);
              request.input('IN_CS_ID_ARCHIVO_VERSION', sql.BigInt, objDocumental.cs_id_archivo_nueva_version  || null);
           
              //parámetros de salidas
              request.output('OUT_NOMBRE_ARCHIVO', sql.VarChar);
              request.output('OUT_RUTA_AMAZON_GESTION_DOCUMENTAL', sql.VarChar);
              request.output('MSG', sql.VarChar);
  
              request.execute('DISENO.SSP_INSERT_DOCUMENTOS', function (err, recordsets, returnValue) {
                  if (err) {
                      res.status(err.status || 500);
                      res.json({
                          error: err,
                          MSG: err.message
                      });
                      transaction.rollback(function (err) {
                          // ... error checks
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

                            var nombre_archivo = request.parameters.OUT_NOMBRE_ARCHIVO.value.trim() + '.' + item.extencion;
                            var rutaFisicaServidor = request.parameters.OUT_RUTA_AMAZON_GESTION_DOCUMENTAL.value;
                            var file = item

                            console.log(nombre_archivo)
                            console.log(rutaFisicaServidor)
                            console.log(file)

                            nombre_archivo =nombre_archivo.trim();
                            

                            fs.readFile(file.path, function (err, data) {

                                var dataArchivo = data
    
                                if (err) throw err; // Something went wrong!
                                var s3bucket = new AWS.S3(); //({ params: { Bucket: 'mdcpruebaupload' } });
                                s3bucket.createBucket(function () {
                                    var params = {
                                        //Key: file.originalFilename, //file.name doesn't exist as a property
                                        //Body: data,
                                        Bucket: rutaFisicaServidor,
                                        Key: nombre_archivo,
                                        Body: data,
                                        ACL: 'public-read',
                                        ContentType: "application/pdf"
                                    };
                                    s3bucket.upload(params, function (err, data) {
                                        let savePath = rutaFisicaServidor + "/" + nombre_archivo;
    
                                        // Whether there is an error or not, delete the temp file
                                        fs.unlink(file.path, function (err) {
                                            if (err) {
                                                console.error(err);
                                                res.json({
                                                    error: err,
                                                    MSG: err.message
                                                });
                                                transaction.rollback(err => {
                                                    // ... error checks
                                                });
                                                sql.close();
                                            }
                                            console.log('Temp File Delete');
                                        });
    
                                        console.log("PRINT FILE:", nombre_archivo);
                                        if (err) {
                                            console.log('ERROR MSG: ', err);
                                            // reject(err);
                                        } else {
                                            console.log('Successfully uploaded data');

                                            contador--;
                                            if (contador == 0) {
                                                transaction.commit(function (err, recordset) {
                                                    // ... error checks
                                                    res.json({
                                                        data: [],
                                                        'MSG': "GUARDADO"
                                                    });
                                                    console.log("Transaction commited.");
                                                    sql.close();
                                                });
                                            }

    
                                  
                                        }
                                    });
                                });
                            });
    

                      
  
                    
                      }
                  }
              });
          });
          //});
  
      });

    });

  
});


router.post('/insertarGdocumentalAmazon', function (req, res) {

    var form = new multiparty.Form();

    form.parse(req, function (err, fields, files) {
        if (err) {
          //return error
          console.error(err);
           //   res.status(err.status || 500);
              res.json({
                  error: err,
                  MSG: err.message
              });
        }
    
    console.log(files.archivos)


      let objDocumental = [];

      for (const field in fields) {
        if (fields.hasOwnProperty(field)) {
          const fieldData = fields[field];
  
          switch (field) {
            case "objDocumental":
                objDocumental = JSON.parse(fieldData[0]);
              break;
        
          }
        }
      }

      console.log(objDocumental);


      let detalle = files.archivos;

      config.configBD2.database = CONSTANTES.DISENOBD;
      var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
      });
      var transaction = new sql.Transaction(connection);
  
  
  
      transaction.begin(function (err) {
          // ... error checks
          if (err) {
              console.error(err);
           //   res.status(err.status || 500);
              res.json({
                  error: err,
                  MSG: err.message
              });
          }
  
          var contador = Object.keys(detalle).length;
          console.log(contador);
  
          async.each(detalle, function (item, callback) {


              //extension del archivo a almacenar 
              item.extencion =  (regexExtension.exec(item.originalFilename)[1] || item.originalFilename);
          
              console.log(item);
              console.log(objDocumental);

              //Nombre archivo 
              let nombre_archivo =""
              nombre_archivo =item.originalFilename
          
              var filenameWithExtension = nombre_archivo.split('.').pop(); 
          
              filenameWithExtension = '.' +filenameWithExtension
              console.log(filenameWithExtension);
              
              nombre_archivo = nombre_archivo.replace(filenameWithExtension ,'')
          
              console.log(nombre_archivo);
          

  
              var request = new sql.Request(transaction);
  
              /*eliminar la ref de la tabla*/
              request.verbose = true;
              request.input('IN_REFERENCIA', sql.VarChar, objDocumental.referencia);
              request.input('IN_LOG_INSERT', sql.Int, objDocumental.cs_id_usuario);
              request.input('IN_EXTENSION', sql.VarChar, item.extencion);
              request.input('IN_OBSERVACION', sql.VarChar, objDocumental.observacion || null);
              request.input('IN_VERSION', sql.Int, objDocumental.version);
              request.input('IN_ID_ESTRUCTURA', sql.VarChar, objDocumental.id_estructura || null);
              request.input('IN_NOMBRE_ARCHIVO', sql.VarChar, nombre_archivo || null);
              request.input('IN_SW_VERSION_NUEVA', sql.Bit, objDocumental.sw_nueva_version || null);
              request.input('IN_NOMBRE_ARCHIVO_VERSION', sql.VarChar, objDocumental.archivo_nueva_version  || null);
              request.input('IN_CS_ID_ARCHIVO_VERSION', sql.BigInt, objDocumental.cs_id_archivo_nueva_version  || null);
              request.input('IN_SW_TEMPORAL', sql.Bit, objDocumental.sw_archivo_temporal || null);
           
              //parámetros de salidas
              request.output('OUT_NOMBRE_ARCHIVO', sql.VarChar);
              request.output('OUT_RUTA_AMAZON_GESTION_DOCUMENTAL', sql.VarChar);
              request.output('MSG', sql.VarChar);
  
              request.execute('DISENO.SSP_INSERT_DOCUMENTOS', function (err, recordsets, returnValue) {
                  if (err) {
                      res.status(err.status || 500);
                      res.json({
                          error: err,
                          MSG: err.message
                      });
                      transaction.rollback(function (err) {
                          // ... error checks
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

                            var nombre_archivo = request.parameters.OUT_NOMBRE_ARCHIVO.value.trim() + '.' + item.extencion;
                            var rutaFisicaServidor = request.parameters.OUT_RUTA_AMAZON_GESTION_DOCUMENTAL.value;
                            var file = item
                           
                            // contador--;

                            // if (contador == 0) {
                            //     transaction.commit(function (err, recordset) {
                            //         // ... error checks
                            //         res.json({
                            //          //   data: result,
                            //             'MSG': "GUARDADO",
                            //             'archivo' : file
                            //         });
                            //         console.log("Transaction commited.");
                            //         sql.close();
                            //     });
                            // }

                            console.log(nombre_archivo)
                            console.log(rutaFisicaServidor)
                            console.log(file)

                            pos_dao.saveAmazon(nombre_archivo,rutaFisicaServidor,file,item.extencion)
                            .then(result => {
                                contador--;
                                if (contador == 0) {
                                    transaction.commit(function (err, recordset) {
                                        // ... error checks
                                        res.json({
                                            data: result,
                                            'MSG': "GUARDADO"
                                        });
                                        console.log("Transaction commited.");
                                        sql.close();
                                    });
                                }

                            })
                            .catch(err => {
                                console.error(err);
                                res.json({
                                    error: "err",
                                    MSG: request.parameters.MSG.value
                                });
                            });

                            return;

                    
                    
                      }
                  }
              });
          });
          //});
  
      });

    });

  
});


router.post('/insert_documentos', function (req, res, next) {

    config.configBD2.database = CONSTANTES.PROLEGODB;
    var form = new multiparty.Form();

    form.parse(req, function (err, fields, files) {

        //var tiene_modelo = fields.TIENE_MODELO_APROBACION[0]
        var num_archivos = parseInt(fields.NUM_ARCHIVOS)

        config.configBD2.database = CONSTANTES.DISENOBD;

        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
            var transaction = new sql.Transaction(connection);
            transaction.begin(function (err) {
                if (err) {
                    console.error(err);
                    res.json({
                        error: err,
                        MSG: err.message
                    });
                    transaction.rollback(function (err) {
                    });
                    //sql.close();
                    return;
                }

                let objDocumental ={}

                console.log(fields.objDocumental[0]);
                objDocumental =JSON.parse(fields.objDocumental[0])
             

                //var documento_guardado = false;
                //var id_documentos_digital;
                async.eachSeries(files.file, function (file, callback) {

                    let nombre_archivo =""
                    nombre_archivo =file.originalFilename
                
                    var filenameWithExtension = nombre_archivo.split('.').pop(); 
                    var extencion = nombre_archivo.split('.').pop(); 
                
                    filenameWithExtension = '.' +filenameWithExtension
                    console.log(filenameWithExtension);
                    
                    nombre_archivo = nombre_archivo.replace(filenameWithExtension ,'')
                
                    console.log(nombre_archivo);
                    // Stored Procedure 
                    var request = new sql.Request(transaction);

                    request.verbose = true;
                    request.input('IN_REFERENCIA', sql.VarChar, objDocumental.referencia);
                    request.input('IN_LOG_INSERT', sql.Int, objDocumental.cs_id_usuario);
                    request.input('IN_EXTENSION', sql.VarChar, extencion);
                    request.input('IN_OBSERVACION', sql.VarChar, objDocumental.observacion || null);
                    request.input('IN_VERSION', sql.Int, objDocumental.version || 1);
                    request.input('IN_ID_ESTRUCTURA', sql.VarChar, objDocumental.id_estructura || null);
                    request.input('IN_NOMBRE_ARCHIVO', sql.VarChar, nombre_archivo || null);
                    request.input('IN_SW_VERSION_NUEVA', sql.Bit, objDocumental.sw_nueva_version || null);
                    request.input('IN_NOMBRE_ARCHIVO_VERSION', sql.VarChar, objDocumental.archivo_nueva_version  || null);
                    request.input('IN_CS_ID_ARCHIVO_VERSION', sql.BigInt, objDocumental.cs_id_archivo_nueva_version  || null);
                 
                    //parámetros de salidas
                    request.output('OUT_NOMBRE_ARCHIVO', sql.VarChar);
                    request.output('OUT_RUTA_AMAZON_GESTION_DOCUMENTAL', sql.VarChar);
                    request.output('MSG', sql.VarChar);

                    request.execute('DISENO.SSP_INSERT_DOCUMENTOS', function (err, recordsets, returnValue) {
                        if (err) {
                            console.log(err);

                            res.json({
                                error: err,
                                MSG: err.message
                            });
                            transaction.rollback(err => {
                                console.log('Error rollback:', err);
                            })
                            //sql.close();
                            return;
                        } else {
                            if (request.parameters.MSG.value != "GUARDADO") {
                                res.json({
                                    error: "err",
                                    MSG: request.parameters.MSG.value
                                });
                                transaction.rollback(err => {
                                    console.log('Error rollback:', err);
                                });
                                //sql.close();
                                return;
                            } else {

                                var nombre_archivo = request.parameters.OUT_NOMBRE_ARCHIVO.value.trim() + '.' + extencion;
                                var rutaFisicaServidor = request.parameters.OUT_RUTA_AMAZON_GESTION_DOCUMENTAL.value;
                                nombre_archivo = nombre_archivo.trim();
                                cargar_archivo_s3(file, nombre_archivo, rutaFisicaServidor).then(resolve => {
                                    console.log('Archivo cargado a S3');
                                    num_archivos--
                                    if (num_archivos === 0) {
                                        transaction.commit(function (err) {
                                            console.log("Transaction commited.");
                                        });
                                   
                                        res.json({
                                            'MSG': "GUARDADO"
                                        });
                                        //sql.close();
                                    } else {
                                        callback();
                                    }
                                }).catch(err => {
                                    console.log('Error almacenando archivos');
                                    res.json({
                                        error: err,
                                        MSG: err.message
                                    });
                                    transaction.rollback(err => {
                                        console.log(err);
                                    });
                                    //sql.close();
                                    return;
                                })

                            }
                        }
                    })
                }, function (err) {
                    if (err) {
                        console.log(err);
                    }
                })
            })
        })
    })
    
});


function cargar_archivo_s3(file, nombre_archivo, rutaFisicaServidor) {
    return new Promise(function (resolve, reject) {

        // RTA

        AWS.config.update({
            accessKeyId: 'AKIA564SKHXJDNQRHCPW',
            secretAccessKey: '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'
        });
        

        // MDC

        // AWS.config.update({
        //     accessKeyId: 'AKIAJ53CG32YCV4T4ZWA',
        //     secretAccessKey: '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'
        // });
        //console.log(file.path);
        fs.readFile(file.path, function (err, data) {

            if (err) throw err; // Something went wrong!
            var s3bucket = new AWS.S3(); //({ params: { Bucket: 'mdcpruebaupload' } });
            s3bucket.createBucket(function () {
                var params = {
                    Bucket: rutaFisicaServidor,
                    Key: nombre_archivo,
                    Body: data,
                    ACL: 'public-read',
                    ContentType: "application/pdf"
                };
                s3bucket.upload(params, function (err, data) {
                    // Whether there is an error or not, delete the temp file
                    fs.unlink(file.path, function (err) {
                        if (err) {
                            console.error(err);
                            return reject({ err })
                        }
                        console.log('Temp File Delete');
                        return resolve();
                    });
                    console.log("PRINT FILE:", nombre_archivo);

                    if (err) {
                        return reject({ err })
                    } else {
                        console.log('Successfully uploaded data amazon');
                    }
                });
            });
        });
    })

}





router.post('/insert_diseno_anterior', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);

    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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

        //request.verbose = true;
        request.input("IN_REFERENCIA", sql.VarChar, req.body.referencia);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
      
        request.output("MSG", sql.VarChar);

        request.execute('DISENO.INSERT_H_DISENO_REFERENCIA_ANTERIOR', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value,
                        data: recordsets
                        

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {
                    /*hacemos commit*/
                    transaction.commit(function (err, recordset) {
                        // ... error checks
                        res.json({
                            data: recordsets,
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});




router.post('/delete_archivo_nube', function (req, res, next) {

    console.log(req.body)

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);


    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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
        //request.verbose = true;
        request.input("IN_CS_ID", sql.Int, req.body.cs_mv_gd_nube);
        request.input("IN_CS_ID_USUARIO", sql.Int, req.body.cs_IdUsuario);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.DELETE_ARCHIVO_NUBE', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});



router.post('/insert_relacion_archivo_ref_ALL', function (req, res, next) {

    console.log(req.body);
    
        config.configBD2.database = CONSTANTES.DISENOBD;
        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        });
        var transaction = new sql.Transaction(connection);
    
    
    
        transaction.begin(function (err) {
            // ... error checks
            if (err) {
                console.error(err);
                // res.status(err.status || 500);
                res.json({
                    error: err,
                    MSG: err.message
                });
            }
    
            var contador = Object.keys(req.body.detalle).length;
    
            async.each(req.body.detalle, function (item, callback) {
    
                var request = new sql.Request(transaction);
    
                /*eliminar la ref de la tabla*/
                request.verbose = true;
                request.input("IN_CS_ID", sql.BigInt, item.cs_mv_gd_nube);
                request.input("IN_LISTA_REF", sql.VarChar, req.body.listaRef);
                request.input('IN_LOG_INSERT', sql.Int, req.body.cs_id_usuario);
                request.output("MSG", sql.VarChar);
        
                request.output('MSG', sql.VarChar(200));
    
                request.execute('DISENO.SSP_INSERT_RELACION_ARCHIVO_NUBE', function (err, recordsets, returnValue) {
                    if (err) {
                        res.status(err.status || 500);
                        res.json({
                            error: err,
                            MSG: err.message
                        });
                        transaction.rollback(function (err) {
                            // ... error checks
                        });
                    } else {
    
                        if (request.parameters.MSG.value != "OK") {
                            //res.status(500);
                            res.json({
                                error: "err",
                                MSG: request.parameters.MSG.value
                            });
                            transaction.rollback(function (err2) {
                                // ... error checks
    
                            });
                        } else {
    
                            contador--;
                            if (contador == 0) {
                                transaction.commit(function (err, recordset) {
                                    // ... error checks
                                    res.json({
                                        data: [],
                                        'MSG': "OK"
                                    });
                                    console.log("Transaction commited.");
                                });
                            }
                        }
                    }
                });
            });
            //});
    
        });
    });


    

router.post('/updateNombreArchivo', function (req, res, next) {

    console.log(req.body)

    config.configBD2.database = CONSTANTES.DISENOBD;
    console.log(config.configBD2.database);


    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
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
        //request.verbose = true;
        request.input("IN_CS_ID", sql.Int, req.body.cs_mv_gd_nube);
        request.input("IN_NOMBRE", sql.VarChar, req.body.nuevo_nombre_archivo);

        request.output("MSG", sql.VarChar);

        request.execute('DISENO.UPDATE_ARCHIVO_NUBE', function (err, recordsets, returnValue) {
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

                if (request.parameters.MSG.value != "OK") {
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
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});



module.exports = router;
