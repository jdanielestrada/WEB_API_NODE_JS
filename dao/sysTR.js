var sql = require('mssql');
var CONSTANTES = require('../utils/constantes');
var config = require('../utils/config');
var utils = require('../utils/utils');
var Promise = require('bluebird');
var async = require('async');
var _ = require('underscore')._;
var nodemailer = require('nodemailer');

/**
 * implementación en los SP de la base de datos POS, usando la convención ASYNC
 * @type {Object}
 */
var sysTR_dao = {
    
    insert_productos_creacion_solicitud_tr: function (body) {
        return new Promise((resolve, reject) => {

            let conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            let connection = new sql.Connection(conexion);

            connection.connect(function (err) {

                if (err) {
                    reject({
                        error: err,
                        MSG: err.message
                    });
                }

                let transaction = new sql.Transaction(connection);

                transaction.begin(function (err) {
                    // ... error checks
                    if (err) {
                        reject({
                            error: err,
                            MSG: err.message
                        });
                    }

                    /*elimino la data de la temporal que se encuentre asociada a la ov*/
                    let request_delete = new sql.Request(transaction);
                    request_delete.verbose = true;

                    request_delete.input("IN_CS_ID_ORDEN", sql.BigInt, body.cs_id_orden);
                    request_delete.output('MSG', sql.VarChar);

                    request_delete.execute('POSMADECENTRO.SSP_DELETE_TW_PRODUCTOS_CREACION_SOLICITUD_TR', function (err, recordsets, returnValue) {
                        if (err) {
                            reject({
                                error: err,
                                MSG: err.message
                            });
                            transaction.rollback(function (err) {
                                // ... error checks
                                return;
                            });
                        } else {

                            if (request_delete.parameters.MSG.value !== "OK") {
                                reject({
                                    error: "err",
                                    MSG: request_delete.parameters.MSG.value
                                });
                                transaction.rollback(function (err2) {
                                });

                            } else {

                                /* actualizamos el orden de los items en la tbl DT_ORDEN_PRODUCCION*/
                                let cantRefsIncompletas = body.data_refs_incompletas.length;
                                async.each(body.data_refs_incompletas, function (item, callback) {

                                    var rq_insert_prod = new sql.Request(transaction);
                                    rq_insert_prod.verbose = true;
                                    rq_insert_prod.input('IN_CS_ID_ORDEN'       , sql.BigInt, item.cs_id_orden);
                                    rq_insert_prod.input("IN_C_BODEGA_ENTRADA"  , sql.VarChar, item.c_bodega_entrada);
                                    rq_insert_prod.input("IN_C_CENTRO_OPERACION", sql.VarChar, item.c_centro_operacion);
                                    rq_insert_prod.input("IN_C_REFERENCIA"      , sql.VarChar, item.c_referencia);
                                    rq_insert_prod.input("IN_C_GRUPO"           , sql.VarChar, item.c_grupo);
                                    rq_insert_prod.input("IN_C_LINEA"           , sql.VarChar, item.c_linea);
                                    rq_insert_prod.input("IN_ITEM"              , sql.Int, item.item);
                                    rq_insert_prod.input("IN_SUBITEM"           , sql.Int, item.subItem);
                                    rq_insert_prod.input("IN_CANT_OV"           , sql.Decimal(14, 4), item.cantidad_ov);
                                    rq_insert_prod.input("IN_SALDO"             , sql.Decimal(14, 4), item.saldo);
                                    rq_insert_prod.input("IN_CANT_REQUERIDA"    , sql.Decimal(14, 4), item.cant_solicitud);
                                    rq_insert_prod.input("IN_C_BODEGA_PRIORIDAD", sql.VarChar, (item.c_bodega_prioridad || null));

                                    rq_insert_prod.output("MSG", sql.VarChar);

                                    rq_insert_prod.execute('POSMADECENTRO.SSP_INSERT_PRODUCTOS_CREACION_SOLICITUD_TR', function (err, recordsets, returnValue) {
                                        if (err) {
                                            // ... error checks
                                            console.log(err)
                                            callback(err.message);

                                        } else if (rq_insert_prod.parameters.MSG.value !== "OK") {
                                            callback(rq_insert_prod.parameters.MSG.value);
                                        } else {
                                            cantRefsIncompletas--;
                                            callback();
                                        }

                                    });
                                },
                                    function (err) {

                                        if (err) {
                                            reject({
                                                error: err,
                                                MSG: err.message
                                            });
                                            transaction.rollback(function (err) {
                                                // ... error checks
                                                return;
                                            });

                                        } else {

                                            if (cantRefsIncompletas === 0) {
                                                //if (body.cs_id_orden !== undefined && body.cs_id_orden !== null && body.cs_id_orden.length > 0) {
                                                //} else {
                                                //}
                                                //transaction.commit(function () {
                                                //    resolve({
                                                //        data: [],
                                                //        MSG: "OK"
                                                //    });
                                                //    console.log("Transaction commited.");
                                                //});

                                                let request = new sql.Request(transaction);
                                                request.verbose = true;

                                                request.input("IN_CS_ID_ORDEN"                   , sql.BigInt, body.cs_id_orden);
                                                request.input("IN_C_CENTRO_OPERACION"            , sql.VarChar, body.c_centro_operacion);
                                                request.input("IN_C_ESTADO_SOLICITUD_TRASLADO"   , sql.VarChar, body.c_estado_solicitud_traslado);
                                                request.input("IN_C_BODEGA_ENTRADA_CONTRAPARTIDA", sql.VarChar, (body.c_bodega_contrapartida || null));
                                                request.input("IN_CS_SOLICITUD_TRASLADO_PADRE"   , sql.VarChar, (body.cs_solicitud_traslado_padre || null));
                                                request.input("IN_TIPO_SOLICITUD_TR"             , sql.VarChar, (body.c_tipo_solicitud_tr || null));
                                                request.input("IN_C_ESTADO_CONTRAPARTIDA"        , sql.VarChar, (body.c_estado_contrapartida || null));
                                                request.input('IN_LOG_USER'                      , sql.Int, body.idUsuario);

                                                request.output('MSG', sql.VarChar);

                                                request.execute('POSMADECENTRO.SSP_INSERT_SOLICITUD_TR', function (err, recordsets, returnValue) {
                                                    if (err) {
                                                        //reject({
                                                        //    error: err,
                                                        //    MSG: err.message
                                                        //});

                                                        const proxiedError = new Error();
                                                        proxiedError.MSG = err.message;
                                                        proxiedError.err = err;
                                                        reject(proxiedError);

                                                        transaction.rollback(function (err) {
                                                            // ... error checks
                                                            return;
                                                        });
                                                    } else {

                                                        if (request.parameters.MSG.value !== "OK") {
                                                            reject({
                                                                error: "err",
                                                                MSG: request.parameters.MSG.value
                                                            });
                                                            transaction.rollback(function (err2) {
                                                            });

                                                        } else {
                                                            transaction.commit(function () {
                                                                resolve({
                                                                    data: recordsets,
                                                                    MSG: "OK"
                                                                });
                                                                console.log("Transaction commited.");
                                                            });
                                                        }
                                                    }
                                                });

                                            }//fin if (cantRefsIncompletas === 0)
                                        }
                                    });
                            }
                        }
                    });
                });
            });
        });
    },

    validar_estado_item_solicitud_tr: function (body) {
        return new Promise((resolve, reject) => {

            let conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            let connection = new sql.Connection(conexion);

            connection.connect(function (err) {

                if (err) {
                    reject({
                        error: err,
                        MSG: err.message
                    });
                }

                let transaction = new sql.Transaction(connection);

                transaction.begin(function (err) {
                    // ... error checks
                    if (err) {
                        reject({
                            error: err,
                            MSG: err.message
                        });
                    }

                    /*elimino la data de la temporal que se encuentre asociada a la ov*/
                    let request = new sql.Request(transaction);
                    request.verbose = true;

                    request.input("IN_CS_ID_ORDEN", sql.BigInt, body.cs_id_orden);
                    request.input("IN_ITEM", sql.Int, body.numeroItem);
                    request.output('MSG', sql.VarChar);

                    request.execute('POSMADECENTRO.SSP_VALIDAR_ESTADO_ITEM_SOLICITUD_TR', function (err, recordsets, returnValue) {
                        if (err) {
                            reject({
                                error: err,
                                MSG: err.message
                            });
                            transaction.rollback(function (err) {
                                // ... error checks
                                return;
                            });
                        } else {

                            if (request.parameters.MSG.value !== "OK") {
                                reject({
                                    error: "err",
                                    MSG: request.parameters.MSG.value
                                });
                                transaction.rollback(function (err2) {
                                });

                            } else {

                                transaction.commit(function () {
                                    resolve({
                                        data: [],
                                        MSG: "OK"
                                    });
                                    console.log("Transaction commited.");
                                });
                            }
                        }
                    });
                });
            });
        });
    },

    get_solicitudes_traslado_a_aprobar_bodeguero: function (params) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_BODEGA_SALIDA", sql.VarChar, params.codigoBodega);

                request.execute('PRODUCCION.SSP_LOGISTICA_GET_SOLICITUDES_TRASLADO_A_APROBAR_BODEGUERO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }

                });

            });
        });
    },

    get_solicitud_traslado_for_aprobacion_tr: function (params) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_BODEGA_ORIGEN", sql.VarChar, params.codigoBodega);

                request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_FOR_APROBACION_TR', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }

                });

            });
        });
    },

    get_solicitudes_a_despachar: function (params) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_BODEGA_ORIGEN", sql.VarChar, params.codigoBodega);

                request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_A_DESPACHAR', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }

                });

            });
        });
    },
    
    get_solicitudes_a_despachar_cedi: function (params) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_BODEGA_ORIGEN", sql.VarChar, params.codigoBodega);

                request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_A_DESPACHAR_CEDI', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }

                });

            });
        });
    },

    get_cantidad_disponible_by_referencia_bodega: function (params) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_BODEGA_SALIDA", sql.VarChar, params.c_bodega_salida);
                request.input("IN_C_REFERENCIA", sql.VarChar, params.c_referencia);

                request.execute('POSMADECENTRO.SSP_GET_CANTIDAD_DISPONIBLE_BY_REFERENCIA_BODEGA', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }
                });
            });
        });
    },

    get_solicitudes_despachar_by_filtro: function (body) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_BODEGA_SALIDA", sql.VarChar, body.CodigoBodega);
                request.input("IN_C_ESTADO_SOLICITUD_TRASLADO", sql.VarChar, body.c_estado_solicitud_traslado);

                request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_A_DESPACHAR_BY_FILTRO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }
                });
            });
        });
    },
    
    get_solicitudes_despachar_cedi_by_filtro: function (body) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_BODEGA_SALIDA", sql.VarChar, body.CodigoBodega);
                request.input("IN_C_ESTADO_SOLICITUD_TRASLADO", sql.VarChar, body.c_estado_solicitud_traslado);

                request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_A_DESPACHAR_CEDI_BY_FILTRO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }
                });
            });
        });
    },

    get_solicitudes_tr_by_pv: function (params) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_BODEGA_ENTRADA", sql.VarChar, params.c_bodega_entrada);

                request.execute('POSMADECENTRO.SSP_GET_SOLICITUDES_TR_BY_PV', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }
                });
            });
        });
    },

    get_solicitud_traslado_for_aprobacion_tr_by_filtro: function (body) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_BODEGA_SALIDA"             , sql.VarChar, body.CodigoBodega);
                request.input("IN_C_ESTADO_SOLICITUD_TRASLADO" , sql.VarChar, body.c_estado_solicitud_traslado);

                request.input("IN_C_CENTRO_OPERACION_OV"       , sql.VarChar, body.c_centro_operacion_ov);
                request.input("IN_ID_ORDEN_CO"                 , sql.VarChar, body.id_orden_co);
                request.input("IN_C_CENTRO_OPERACION_SOLICITUD", sql.VarChar, body.c_centro_operacion_solicitante);

                request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_FOR_APROBACION_TR_BY_FILTRO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }
                });
            });
        });
    },

    recibir_solicitud_traslado: function (body) {
        return new Promise((resolve, reject) => {

            let conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            let connection = new sql.Connection(conexion);

            connection.connect(function (err) {

                if (err) {
                    reject({
                        error: err,
                        MSG: err.message
                    });
                }

                let transaction = new sql.Transaction(connection);

                transaction.begin(function (err) {
                    // ... error checks
                    if (err) {
                        reject({
                            error: err,
                            MSG: err.message
                        });
                    }

                    /* actualizamos el orden de los items en la tbl DT_ORDEN_PRODUCCION*/
                    let referencias_solicitud = body.referencias_solicitud.length;
                    async.each(body.referencias_solicitud, function (item, callback) {

                        var request = new sql.Request(transaction);
                        request.verbose = true;
                        request.input("IN_CS_SOLICITUD_TRASLADO", sql.BigInt, body.cs_id_solicitud_traslado);
                        request.input("IN_C_REFERENCIA", sql.VarChar, item.referencia);
                        request.input("IN_CANTIDAD_RECIBIDA", sql.Decimal(14, 4), item.cantidad_recibida_pv);
                        request.input("IN_SW_RECEPCION_PARCIAL", sql.Bit, item.sw_recepcion_parcial);
                        request.input("IN_LOG_UPDATE", sql.Int, body.idUsuario);

                        request.output("MSG", sql.VarChar);

                        request.execute('POSMADECENTRO.SSP_RECIBIR_SOLICITUD_TRASLADO', function (err, recordsets, returnValue) {
                            if (err) {
                                // ... error checks
                                console.log(err)
                                callback(err.message);

                            } else if (request.parameters.MSG.value !== "OK") {
                                callback(request.parameters.MSG.value);
                            } else {
                                referencias_solicitud--;
                                callback();
                            }
                        });
                    },
                        function (err) {

                            if (err) {
                                reject({
                                    error: err,
                                    MSG: err.message
                                });
                                transaction.rollback(function (err) {
                                    // ... error checks
                                    return;
                                });

                            } else {

                                if (referencias_solicitud === 0) {

                                    transaction.commit(function () {
                                        resolve({
                                            data: [],
                                            MSG: "OK"
                                        });
                                        console.log("Transaction commited.");
                                    });

                                }
                            }
                        });
                });
            });
        });
    },

    get_motivo_recepcion_incompleta_tr: function (body) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                //request.verbose = true;

                request.execute('POSMADECENTRO.SSP_GET_MOTIVO_RECEPCION_INCOMPLETA_TR', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }
                });
            });
        });
    },
    
    get_data_impresion_docto_TR_generado: function (body) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEE;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                //request.verbose = true;

                request.input("IN_C_CENTRO_OPERACION", sql.VarChar, body.c_centro_operacion);
                request.input("IN_CONSEC_DOCTO_GENERADO", sql.Int, body.consec_docto);

                request.execute('POSMADECENTRO.SSP_GET_DATA_IMPRESION_DOCTO_TR_GENERADO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }
                });
            });
        });
    },
    
    send_emails_despacho_tr: function (body) {
            return new Promise((resolve, reject) => {
                config.configBD2.database = CONSTANTES.POSDB;
                var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {

                    let d_bodega_salida = body.CodigoSucursal + " - " + body.NombreSucursal;

                    body.list_centros_operacion_solicitud_traslado = JSON.parse(body.list_centros_operacion_solicitud_traslado);
                    let cant_centros_operacion_solicitud_traslado = body.list_centros_operacion_solicitud_traslado.length;

                    let list_dt_envio_email = [];
                    async.each(body.list_centros_operacion_solicitud_traslado, function(item, callback) {
                            //cant_centros_operacion_solicitud_traslado--;
                            //si el pv tiene referencia confirmadas, se realiza el envio del email.
                            if (item.referencias_confirmadas_pv.length > 0) {

                                var request = new sql.Request(connection);
                                request.verbose = true;

                                var rows_table_dt_solicitud = "";
                                for (var i = 0; i < item.referencias_confirmadas_pv.length; i++) {
                                    let itemRef = item.referencias_confirmadas_pv[i];

                                    rows_table_dt_solicitud = rows_table_dt_solicitud
                                        + '<tr><td>' + itemRef.referencia + '</td>'
                                        + '<td>' + itemRef.descripcion_referencia + '</td>'
                                        + '<td>' + itemRef.cantidad_enviada_pv_format + '</td>'
                                        + '</tr>';
                                }

                                request.input("IN_D_BODEGA_SALIDA", sql.VarChar, d_bodega_salida);
                                request.input("IN_C_CENTRO_OPERACION_ENTRADA", sql.VarChar, item.c_centro_operacion);
                                request.input("IN_HTML_BODY_TABLE", sql.VarChar, rows_table_dt_solicitud);

                                request.output("OUT_PLANTILLA", sql.VarChar);
                                request.output("OUT_DESTINATARIOS", sql.VarChar);
                                request.output("OUT_ASUNTO_CORREO", sql.VarChar);
                                request.output("MSG", sql.VarChar);

                                request.execute('POSMADECENTRO.SSP_SEND_EMAIL_DESPACHO_PRODUCTOS_TR', function(err, recordsets, returnValue) {
                                    if (err) {
                                        // ... error checks
                                        console.log(err)
                                        callback(err.message);

                                    } else if (request.parameters.MSG.value !== "OK") {
                                        callback(request.parameters.MSG.value);
                                    } else {
                                        list_dt_envio_email.push({
                                            plantilla: request.parameters.OUT_PLANTILLA.value,
                                            destinatarios: request.parameters.OUT_DESTINATARIOS.value,
                                            asunto_correo: request.parameters.OUT_ASUNTO_CORREO.value
                                        });

                                        cant_centros_operacion_solicitud_traslado--;
                                        callback();
                                    }
                                });
                            }
                        },
                        function(err) {

                            if (err) {
                                reject(err);
                            } else {

                                if (cant_centros_operacion_solicitud_traslado === 0) {

                                    let cant_emails_pendientes_envio = list_dt_envio_email.length;

                                    let transporter = nodemailer.createTransport({
                                        host  : config.nodemailer_config.host,
                                        port  : config.nodemailer_config.port,
                                        secure: config.nodemailer_config.secure,
                                        auth: {
                                            user: config.nodemailer_config.account.user, // account.user, // generated ethereal user
                                            pass: config.nodemailer_config.account.pass //account.pass // generated ethereal password
                                        },
                                        tls: {
                                            // do not fail on invalid certs
                                            rejectUnauthorized: false
                                        }
                                    });
                                    
                                    /*verificar conexión de servidor email*/
                                    transporter.verify(function (error, success) {
                                        if (error) {
                                            console.log(error);

                                            resolve({
                                                data: JSON.stringify(error),
                                                'MSG': "Server isn't ready to take our messages"
                                            });

                                        } else {

                                            //console.log('Server is ready to take our messages');
                                            //resolve({
                                            //    data: JSON.stringify(success),
                                            //    'MSG': "OK",
                                            //    msg2: "Server is ready to take our messages"
                                            //});

                                            if (list_dt_envio_email.length > 0) {

                                                let mailOptions = {
                                                    from: config.nodemailer_config.from, // sender address
                                                    to: '', // list of receivers
                                                    subject: '', // Subject line
                                                    text: '', // plain text body
                                                    html: '' // html body
                                                };

                                                for (var i = 0; i < list_dt_envio_email.length; i++) {

                                                    let item = list_dt_envio_email[i];

                                                    cant_emails_pendientes_envio--;

                                                    mailOptions.to = item.destinatarios;
                                                    mailOptions.subject = item.asunto_correo;
                                                    mailOptions.html = item.plantilla;

                                                    mailOptions.to = "jose.estrada@madecentro.co";

                                                    // send mail with defined transport object
                                                    transporter.sendMail(mailOptions);

                                                    if (cant_emails_pendientes_envio === 0) {
                                                        resolve({
                                                            data: [],
                                                            'MSG': "OK",
                                                            success: 'Server is ready to take our messages'
                                                        });
                                                    }
                                                }
                                            } else {
                                                resolve({
                                                    data: [],
                                                    'MSG': "OK"
                                                });
                                            }
                                        }
                                    });
                                }
                            }
                        });
                });
            });
    },

    get_solicitud_traslado_for_aprobacion_tr_contrapartida: function (params) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_BODEGA_CONTRAPARTIDA", sql.VarChar, params.codigoBodega);

                request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_FOR_APROBACION_TR_CONTRAPARTIDA', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }

                });

            });
        });
    },
    
    get_solicitud_traslado_for_aprobacion_tr_by_filtro_contrapartida: function (body) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_BODEGA_CONTRAPARTIDA"      , sql.VarChar, body.CodigoBodega);
                request.input("IN_C_ESTADO_CONTRAPARTIDA_TR", sql.VarChar, body.c_estado_contrapartida_tr);
                request.input("IN_C_CENTRO_OPERACION_OV"       , sql.VarChar, body.c_centro_operacion_ov);
                request.input("IN_ID_ORDEN_CO"                 , sql.VarChar, body.id_orden_co);
                request.input("IN_C_CENTRO_OPERACION_SOLICITUD", sql.VarChar, body.c_centro_operacion_solicitante);

                request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_FOR_APROBACION_TR_BY_FILTRO_CONTRAPARTIDA', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }
                });
            });
        });
    },
};

module.exports = sysTR_dao;
