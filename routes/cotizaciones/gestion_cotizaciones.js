var express    = require('express');
var router     = express.Router();
var email      = require('emailjs');
var pdf        = require('html-pdf');
var _          = require('underscore')._;
var fs         = require('fs');
var CONSTANTES = require('../../utils/constantes');
var crypto     = require('crypto');
var config     = require('../../utils/config');
var utils      = require('../../utils/utils');
var sql        = require('mssql');
var async      = require('async');

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
        //request.verbose = true;

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
        //request.verbose = true;

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
        //request.verbose = true;

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
        //request.verbose = true;
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
        //request.verbose = true;
        request.input("IN_ID_USUARIO", sql.Int, req.params.idUsuario);
        request.execute('RTA.GET_COTIZACIONES_BY_USUARIO', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});

//CONSULTA EL DETALLE DE CADA ITEM DE UNA COTIZACION 
router.get('/get_detalle_cotizacion/:csIdCotizacion', function (req, res, next) {
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
        //request.verbose = true;
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

        //request.verbose = true;
        request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, req.body.documento_cliente);
        request.input("IN_NOMBRES_CLIENTE", sql.VarChar, req.body.nombres_cliente);
        request.input("IN_APELLIDOS_CLIENTE", sql.VarChar, req.body.apellidos_cliente);
        request.input("IN_TIPO_COTIZACION", sql.VarChar, req.body.tipo_cotizacion);
        request.input('IN_FECHA', sql.DateTime, new Date(req.body.fecha_cotizacion));
        request.input("IN_ID_USUARIO", sql.Int, req.body.cs_id_usuario);
        request.input("IN_CS_COTIZACION", sql.BigInt, req.body.cs_cotizacion);
        request.input("IN_EMAIL_CLIENTE", sql.VarChar, req.body.email);

        request.output("OUT_CS_H_COTIZACION", sql.VarChar);
        request.output("MSG", sql.VarChar);

        request.execute('RTA.INSERT_H_COTIZACION', function (err, recordsets, returnValue) {
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
                            'OUT_CS_H_COTIZACION': request.parameters.OUT_CS_H_COTIZACION.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});

router.post('/insert_productos_cotizacion', function (req, res, next) {
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
        //request.verbose = true;
        request.input("IN_CS_ID_COTIZACION", sql.BigInt, req.body.CS_H_COTIZACION);
        request.input("IN_C_CIDIS", sql.VarChar, req.body.C_CIDIS);
        request.input("IN_REFERENCIA_PT", sql.VarChar, req.body.ID_REFERENCIA);
        request.input("IN_D_REFERENCIA_PT", sql.VarChar, req.body.DESCRIPCION);
        request.input('IN_ID_ITEM', sql.VarChar, req.body.ID_ITEM);
        request.input("IN_ID_PROCEDENCIA", sql.VarChar, req.body.ID_PROCEDENCIA);
        request.input("IN_UNIDAD_MEDIDA", sql.VarChar, req.body.UNIDAD_MEDIDA);
        request.input("IN_EMPAQUE_H", sql.Decimal(12, 2), req.body.EMPAQUE_H);
        request.input("IN_EMPAQUE_W", sql.Decimal(12, 2), req.body.EMPAQUE_W);
        request.input("IN_EMPAQUE_D", sql.Decimal(12, 2), req.body.EMPAQUE_D);
        request.input("IN_CUBICAGE_C", sql.Decimal(12, 2), req.body.CUBICAGE_C);
        request.input("IN_CUBICAGE_K", sql.Decimal(12, 2), req.body.CUBICAGE_K);
        request.input("IN_MEDIDAS_PT", sql.VarChar, req.body.MEDIDAS_PT);
        request.input("IN_COLOR", sql.VarChar, req.body.COLOR);
        request.input("IN_CANTIDAD", sql.Decimal(24, 2), req.body.CANTIDAD);
        request.input("IN_ULTIMO_COSTO", sql.Decimal(24, 2), req.body.ULTIMO_COSTO || 0);
        request.input("IN_CANTIDAD_UC", sql.Decimal(24, 2), req.body.CANTIDAD_UC || 0);
        request.input("IN_VALOR_CLIENTE", sql.Decimal(24, 2), req.body.VALOR_CLIENTE || 0);
        request.input("IN_MARGEN", sql.Decimal(10, 2), req.body.MARGEN);
        request.input("IN_LOG_USER", sql.Int, req.body.ID_USUARIO);

        request.output("OUT_CS_ID_DT_COTIZACION", sql.VarChar);
        request.output("MSG", sql.VarChar);

        request.execute('RTA.SSP_INSERT_DT_COTIZACION', function (err, recordsets, returnValue) {
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

                    var cantInsumosProducto = req.body.data_insumo_producto.length;

                    /* almacenamos las asignaciones a los operarios del corte para la op seleccionada */
                    async.each(req.body.data_insumo_producto, function (item, callback) {
                        
                        var requestDt = new sql.Request(transaction);
                        requestDt.verbose = false;
                        requestDt.input("IN_CS_ID_DT_COTIZACION", sql.BigInt, request.parameters.OUT_CS_ID_DT_COTIZACION.value);
                        requestDt.input("IN_ID_COD_ITEM_INS", sql.VarChar, item.ID_COD_ITEM_C);
                        requestDt.input("IN_REFERENCIA_INS", sql.VarChar, item.ID_REFER_C);
                        requestDt.input("IN_D_REFERENCIA_INS", sql.VarChar, item.DESCRIPCION_C);
                        requestDt.input("IN_UNIDAD_MEDIDA_INS", sql.VarChar, item.ID_UNIMED_C);
                        requestDt.input("IN_CANTIDAD_BASE", sql.Decimal(20, 5), item.CANTIDAD_BASE);
                        requestDt.input("IN_CANTIDAD_REQUERIDA", sql.Decimal(20, 5), item.CANTIDAD_REQUERIDA);
                        requestDt.input("IN_CANTIDAD_SOLICITADA", sql.Decimal(20, 5), item.CANTIDAD_SOLICITADA);
                        requestDt.input("IN_BODEGA_CONSUMO", sql.VarChar, item.BODEGA_CONSUMO);
                        requestDt.input("IN_COSTO_PROM_FINAL", sql.Decimal(20, 5), item.COSTO_PROM_FINAL);
                        
                        requestDt.output("MSG", sql.VarChar);

                        requestDt.execute('RTA.SSP_INSERT_MV_INSUMOS_COTIZACIONES', function (err, recordsets, returnValue) {
                            if (err) {
                                // ... error checks
                                callback(err.message);

                            } else if (requestDt.parameters.MSG.value !== "OK") {
                                callback(requestDt.parameters.MSG.value);
                            } else {
                                cantInsumosProducto--;
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

                                if (cantInsumosProducto === 0) {

                                    /*hacemos commit*/
                                    transaction.commit(function (err, recordset) {
                                        // ... error checks
                                        res.json({
                                            data: [],
                                            'MSG': request.parameters.MSG.value,
                                            OUT_CS_ID_DT_COTIZACION: request.parameters.OUT_CS_ID_DT_COTIZACION.value
                                        });

                                        console.log("Transaction commited.");
                                    });
                                }
                            }
                        });
                }
            }
        });/**/
    });
});

//INSERTAR DATA COSTOS MDC 
router.post('/insert_data_costos_mdc', function (req, res, next) {
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
        //request.verbose = true;
        request.input("IN_DESCRIPCION_ARCHIVO", sql.VarChar, req.body.dataHeader.descripcionArchivo);
        request.input("IN_LOG_USER", sql.Int, req.body.dataHeader.csIdUsuario);

        request.output("OUT_CS_ID_COSTOS_MDC", sql.BigInt);
        request.output("MSG", sql.VarChar);

        request.execute('RTA.SSP_INSERT_H_COSTOS_PRODUCTOS_MDC', function (err, recordsets, returnValue) {
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

                    var cant = req.body.dataDetalle.length;

                    /* almacenamos las asignaciones a los operarios del corte para la op seleccionada */
                    async.each(req.body.dataDetalle, function (item, callback) {

                        var requestDt = new sql.Request(transaction);
                        requestDt.verbose = false;
                        requestDt.input("IN_CS_ID_COSTOS_MDC", sql.BigInt, request.parameters.OUT_CS_ID_COSTOS_MDC.value);
                        requestDt.input("IN_REFERENCIA", sql.VarChar, item.REFERENCIA);
                        requestDt.input("IN_D_REFERENCIA", sql.VarChar, item.DESCRIPCION);
                        requestDt.input("IN_UM", sql.VarChar, item.UNIMED);
                        requestDt.input("IN_LOG_USER", sql.Int, req.body.dataHeader.csIdUsuario); 
                 
                        requestDt.input("IN_COSTO_MDC", sql.Decimal(20, 5), item.COSTOMDC);

                        requestDt.output("MSG", sql.VarChar);

                        requestDt.execute('RTA.SSP_INSERT_MV_COSTOS_PRODUCTOS_MDC', function (err, recordsets, returnValue) {
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
                                             OUT_CS_ID_COSTOS_MDC: request.parameters.OUT_CS_ID_COSTOS_MDC.value
                                        });

                                        console.log("Transaction commited.");
                                    });
                                }
                            }
                        });

                    ///*hacemos commit*/
                    //transaction.commit(function (err, recordset) {
                    //    // ... error checks
                    //    res.json({
                    //        data: [],
                    //        'MSG': request.parameters.MSG.value,
                    //        OUT_CS_ID_DT_COTIZACION: request.parameters.OUT_CS_ID_DT_COTIZACION.value
                    //    });

                    //    console.log("Transaction commited.");
                    //});
                }
            }
        });
    });
});

router.post('/delete_producto_dt_cotizacion', function (req, res, next) {
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
        //request.verbose = true;
        request.input("IN_CS_ID_DT_COTIZACION", sql.BigInt, req.body.CS_ID_DT_COTIZACION);

        request.output("MSG", sql.VarChar);

        request.execute('RTA.SSP_DELETE_PRODUCTO_DT_COTIZACION', function (err, recordsets, returnValue) {
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

router.post('/update_estado_h_cotizaciones', function (req, res, next) {
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
        //request.verbose = true;
        request.input("IN_CS_ID_COTIZACION", sql.BigInt, req.body.CS_H_COTIZACION);
        request.input("IN_ESTADO_COTIZACION", sql.Int, req.body.ESTADO_COTIZACION);
        request.input("IN_USUARIO_UPDATE", sql.Int, req.body.ID_USUARIO);

        request.output("MSG", sql.VarChar);

        request.execute('RTA.SSP_UPDATE_ESTADO_H_COTIZACIONES', function (err, recordsets, returnValue) {
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



router.get('/get_costos_productos_insumos_rta_mdc', function (req, res, next) {
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
        //request.verbose = true;

        request.execute('RTA.GET_COSTOS_INSUMOS_RTA_MDC', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
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
        //request.verbose = true;
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

router.get('/get_insumos_by_producto_cotizacion/:cs_id_dt_cotizacion', function (req, res, next) {
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
        //request.verbose = true;
        request.input("IN_CS_ID_DT_COTIZACION", sql.BigInt, req.params.cs_id_dt_cotizacion);
        
        request.execute('RTA.SSP_GET_INSUMOS_BY_PRODUCTO_COTIZACION', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});

router.post('/editar_producto_dt_cotizacion', function (req, res, next) {
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
        var requestD = new sql.Request(transaction);
        //request.verbose = true;
        requestD.input("IN_CS_ID_DT_COTIZACION", sql.BigInt, req.body.CS_ID_DT_COTIZACION);

        requestD.output("MSG", sql.VarChar);

        requestD.execute('RTA.SSP_DELETE_PRODUCTO_DT_COTIZACION', function (err, recordsets, returnValue) {
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

                if (requestD.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: requestD.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {

                    var request = new sql.Request(transaction);
                    //request.verbose = true;
                    request.input("IN_CS_ID_COTIZACION", sql.BigInt, req.body.CS_H_COTIZACION);
                    request.input("IN_C_CIDIS", sql.VarChar, req.body.C_CIDIS);
                    request.input("IN_REFERENCIA_PT", sql.VarChar, req.body.ID_REFERENCIA);
                    request.input("IN_D_REFERENCIA_PT", sql.VarChar, req.body.DESCRIPCION);
                    request.input('IN_ID_ITEM', sql.VarChar, req.body.ID_ITEM);
                    request.input("IN_ID_PROCEDENCIA", sql.VarChar, req.body.ID_PROCEDENCIA);
                    request.input("IN_UNIDAD_MEDIDA", sql.VarChar, req.body.UNIDAD_MEDIDA);
                    request.input("IN_EMPAQUE_H", sql.Decimal(12, 2), req.body.EMPAQUE_H);
                    request.input("IN_EMPAQUE_W", sql.Decimal(12, 2), req.body.EMPAQUE_W);
                    request.input("IN_EMPAQUE_D", sql.Decimal(12, 2), req.body.EMPAQUE_D);
                    request.input("IN_CUBICAGE_C", sql.Decimal(12, 2), req.body.CUBICAGE_C);
                    request.input("IN_CUBICAGE_K", sql.Decimal(12, 2), req.body.CUBICAGE_K);
                    request.input("IN_MEDIDAS_PT", sql.VarChar, req.body.MEDIDAS_PT);
                    request.input("IN_COLOR", sql.VarChar, req.body.COLOR);
                    request.input("IN_CANTIDAD", sql.Decimal(24, 2), req.body.CANTIDAD);
                    request.input("IN_ULTIMO_COSTO", sql.Decimal(24, 2), req.body.ULTIMO_COSTO || 0);
                    request.input("IN_CANTIDAD_UC", sql.Decimal(24, 2), req.body.CANTIDAD_UC || 0);
                    request.input("IN_VALOR_CLIENTE", sql.Decimal(24, 2), req.body.VALOR_CLIENTE || 0);
                    request.input("IN_MARGEN", sql.Decimal(10, 2), req.body.MARGEN);
                    request.input("IN_LOG_USER", sql.Int, req.body.ID_USUARIO);

                    request.output("OUT_CS_ID_DT_COTIZACION", sql.VarChar);
                    request.output("MSG", sql.VarChar);

                    request.execute('RTA.SSP_INSERT_DT_COTIZACION', function (err, recordsets, returnValue) {
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

                                var cantInsumosProducto = req.body.data_insumo_producto.length;

                                /* almacenamos las asignaciones a los operarios del corte para la op seleccionada */
                                async.each(req.body.data_insumo_producto, function (item, callback) {

                                    var requestDt = new sql.Request(transaction);
                                    requestDt.verbose = false;
                                    requestDt.input("IN_CS_ID_DT_COTIZACION", sql.BigInt, request.parameters.OUT_CS_ID_DT_COTIZACION.value);
                                    requestDt.input("IN_ID_COD_ITEM_INS", sql.VarChar, item.ID_COD_ITEM_C);
                                    requestDt.input("IN_REFERENCIA_INS", sql.VarChar, item.ID_REFER_C);
                                    requestDt.input("IN_D_REFERENCIA_INS", sql.VarChar, item.DESCRIPCION_C);
                                    requestDt.input("IN_UNIDAD_MEDIDA_INS", sql.VarChar, item.ID_UNIMED_C);
                                    requestDt.input("IN_CANTIDAD_BASE", sql.Decimal(20, 5), item.CANTIDAD_BASE);
                                    requestDt.input("IN_CANTIDAD_REQUERIDA", sql.Decimal(20, 5), item.CANTIDAD_REQUERIDA);
                                    requestDt.input("IN_CANTIDAD_SOLICITADA", sql.Decimal(20, 5), item.CANTIDAD_SOLICITADA);
                                    requestDt.input("IN_BODEGA_CONSUMO", sql.VarChar, item.BODEGA_CONSUMO);
                                    requestDt.input("IN_COSTO_PROM_FINAL", sql.Decimal(20, 5), item.COSTO_PROM_FINAL);

                                    requestDt.output("MSG", sql.VarChar);

                                    requestDt.execute('RTA.SSP_INSERT_MV_INSUMOS_COTIZACIONES', function (err, recordsets, returnValue) {
                                        if (err) {
                                            // ... error checks
                                            callback(err.message);

                                        } else if (requestDt.parameters.MSG.value !== "OK") {
                                            callback(requestDt.parameters.MSG.value);
                                        } else {
                                            cantInsumosProducto--;
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

                                            if (cantInsumosProducto === 0) {

                                                /*hacemos commit*/
                                                transaction.commit(function (err, recordset) {
                                                    // ... error checks
                                                    res.json({
                                                        data: [],
                                                        'MSG': request.parameters.MSG.value,
                                                        OUT_CS_ID_DT_COTIZACION: request.parameters.OUT_CS_ID_DT_COTIZACION.value
                                                    });

                                                    console.log("Transaction commited.");
                                                });
                                            }
                                        }
                                    });
                            }
                        }
                    });/**/

                    ///*hacemos commit*/
                    //transaction.commit(function (err, recordset) {
                    //    // ... error checks
                    //    res.json({
                    //        data: [],
                    //        'MSG': request.parameters.MSG.value
                    //    });

                    //    console.log("Transaction commited.");
                    //});
                }
            }
        });
    });
});







router.post('/update_costo_mdc', function (req, res, next) {
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
        //request.verbose = true;
        request.input("IN_CS_ID", sql.BigInt, req.body.cdIdCosto);
        request.input("IN_COSTO_MDC", sql.Decimal(24,4), req.body.ESTADO_COTIZACION);
        request.input("IN_UNIDAD_MEDIDA", sql.VarChar, req.body.unidadMededida);

        request.output("MSG", sql.VarChar);

        request.execute('RTA.SSP_UPDATE_COSTO_MDC', function (err, recordsets, returnValue) {
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


//CONSULTA LOS COSTOS MDC GUARDADOS 
router.get('/get_historico_costos_mdc', function (req, res, next) {
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
        //request.verbose = true;

        request.execute('RTA.GET_HISTORICO_COSTOS_MDC', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});



router.post('/anular_costos_mdc', function (req, res, next) {
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
        request.input("IN_CS_ID_COSTO", sql.BigInt, req.body.cdIdCostos);
        request.input("IN_USUARIO_UPDATE", sql.Int, req.body.csIdUsuario);

        request.output("MSG", sql.VarChar);

        request.execute('RTA.ANULAR_COSTOS_MDC', function (err, recordsets, returnValue) {
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

router.get('/get_detalle_archivo_costos_mdc/:cs_id_costos', function (req, res, next) {
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
        //request.verbose = true;
        request.input("IN_CS_COSTOS", sql.BigInt, req.params.cs_id_costos);

        request.execute('RTA.GET_DETALLE_ARCHIVO_COSTOS_MDC', function (err, recordsets, returnValue) {
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
