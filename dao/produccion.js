var sql        = require('mssql');
var CONSTANTES = require('../utils/constantes');
var config     = require('../utils/config');
var utils      = require('../utils/utils');
var Promise    = require('bluebird');
var async      = require('async');
var moment = require('moment');
var https = require('https');


var produccion_dao = {


    get_despachos_reparto_envia: function(id_orden) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;

                request.execute('POS.SSP_GET_DESPACHOS_EN_REPARTO_ENVIA', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } 
                    else {
                        resolve({
                            error: "",
                            data: recordsets[0],
                            'MSG': "OK",

                            cambiar_estado_despacho_pedido_envia(data)
                        });
                    }
                });
            });
        });
    },

    cambiar_estado_despacho_pedido_envia: function (data) {
        return new Promise((resolve, reject) => {

            var listaPedidos = data;
            let conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            let connection = new sql.Connection(conexion);

            connection.connect(function(err) {

                if (err) {
                    reject({
                        error: err,
                        MSG: err.message
                    });
                }

                let transaction = new sql.Transaction(connection);

                transaction.begin(function(err) {
                    // ... error checks
                    if (err) {
                        reject({
                            error: err,
                            MSG: err.message
                        });
                    }
                    let cantPedidosPendientes = listaPedidos.length;
                    async.each(listaPedidos, function(item, callback) {

                            var request = new sql.Request(transaction);
                            request.verbose = false;
                            request.input('IN_CS_ID_ORDEN_PRODUCCION', sql.BigInt, body.cs_id_orden_produccion);
                            request.input("IN_ORDEN_ETAPA"           , sql.Int, item.indice);
                            request.input("IN_C_GRUPO_SERVICIO"      , sql.Int, item.c_grupo_servicio);
                            request.input("IN_C_DEPENDENCIA"         , sql.VarChar, item.c_dependencia);
                            request.input('IN_LOG_UPDATE'            , sql.Int, body.log_user);

                            request.output("MSG", sql.VarChar);

                            request.execute('PRODUCCION.SSP_UPDATE_ORDEN_ETAPAS_ORDEN_PRODUCCION', function(err, recordsets, returnValue) {
                                if (err) {
                                    // ... error checks
                                    callback(err.message);

                                } else if (request.parameters.MSG.value !== "GUARDADO") {
                                    callback(request.parameters.MSG.value);
                                } else {
                                    cantEtapasOp--;
                                    callback();
                                }

                            });
                        },
                        function(err) {

                            if (err) {  
                                reject({
                                    error: err,
                                    MSG: err.message
                                });
                                console.log(reject.error);

                                // transaction.rollback(function(err) {
                                //     // ... error checks
                                //     return;
                                // });


                            } else {

                                if (cantPedidosPendientes === 0) {

                                    let request = new sql.Request(transaction);
                                    request.verbose = true;

                                    request.input("IN_CS_ID_ORDEN_PRODUCCION"     , sql.BigInt, body.cs_id_orden_produccion);
                                    request.input("IN_FECHA_SUGERIDA_PROGRAMACION", sql.Date, new Date(body.fecha_sugerida_programacion));
                                    request.input('IN_LOG_INSERT'                 , sql.Int, body.log_user);

                                    request.output('MSG', sql.VarChar);

                                    request.execute('PRODUCCION.SSP_INSERT_CANTIDAD_PRODUCCION_ETAPAS_BY_FECHA', function(err, recordsets, returnValue) {
                                        if (err) {
                                            reject({
                                                error: err,
                                                MSG: err.message
                                            });
                                            transaction.rollback(function(err) {
                                                // ... error checks
                                                return;
                                            });
                                        } else {

                                            if (request.parameters.MSG.value !== "GUARDADO") {
                                                reject({
                                                    error: "err",
                                                    MSG: request.parameters.MSG.value
                                                });
                                                transaction.rollback(function(err2) {
                                                });

                                            } else {

                                                /*modifico el sw {sw_programacion_op_f_entrega_cliente = true} de la programacion de las cantidades de producción de la OP*/
                                                let requestQuery = new sql.Request(transaction);
                                                requestQuery.verbose = true;

                                                requestQuery.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, body.cs_id_orden_produccion);
                                                requestQuery.input('IN_LOG_USER'              , sql.Int, body.log_user);
                                                
                                                requestQuery.query('UPDATE PRODUCCION.DT_PROGRAMACION_ETAPAS_OP_DIA SET [sw_programacion_op_f_entrega_cliente] = 1 ,[log_update] = @IN_LOG_USER ,[fh_update] = GETDATE() WHERE [cs_id_orden_produccion] = @IN_CS_ID_ORDEN_PRODUCCION',
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
                                                        }

                                                        transaction.commit(function () {
                                                            console.log("Transaction commited.");
                                                        });

                                                        produccion_dao.get_dt_planeacion_etapas_dia_by_op(body.cs_id_orden_produccion)
                                                            .then(function(result) {
                                                                resolve({
                                                                    data: result.data,
                                                                    MSG: request.parameters.MSG.value
                                                                });
                                                            })
                                                            .catch(function(err) {
                                                                reject({
                                                                    error: err,
                                                                    data: [],
                                                                    MSG: request.parameters.MSG.value
                                                                });
                                                            });
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
    },
    
   
    get_solicitudes_traslados_by_id_orden: function(id_orden) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var requestOp = new sql.Request(connection);
                requestOp.verbose = false;
                requestOp.input("IN_CS_ID_ORDEN", sql.Int, id_orden);

                requestOp.execute('POSMADECENTRO.SSP_LOGISTICA_GET_SOLICITUD_TRASLADO_BY_ID_ORDEN', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        //separamos los estados de la solicitud que están aprobados y enviados
                        let array_estado_aprobado = [];
                        let array_estado_enviado = [];
                        if (recordsets[0].length > 0) {
                            recordsets[0].forEach(solicitud => {
                                if (solicitud.c.estado_solicitud_traslado == "A") {
                                    array_estado_aprobado.push(solicitud);
                                }
                                if (solicitud.c.estado_solicitud_traslado == "E") {
                                    array_estado_enviado.push(solicitud);
                                }

                            });
                        }


                        resolve({
                            error: "",
                            data: recordsets,
                            'MSG': "OK",
                            "aprobados": array_estado_aprobado,
                            "enviados": array_estado_enviado

                        });
                    }
                });
            });
        });
    },
    get_disponibilidad_espacios_tiempos_maquina: function(body) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_FECHA_INICIO_ETAPA", sql.VarChar, body.fecha_inicio_etapa);
                request.input("IN_FECHA_FIN_ETAPA", sql.VarChar, body.fecha_fin_etapa);
                request.input("IN_ROW_ID_MAQUINA", sql.Int, body.row_id_maquina);
                request.input("IN_C_GRUPO_SERVICIO", sql.Int, body.c_grupo_servicio);

                request.output("IS_AVAILABLE_TIME", sql.Bit);

                request.execute('PRODUCCION.SSP_GET_DISPONIBILIDAD_ESPACIOS_TIEMPOS_MAQUINA', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets,
                            IS_AVAILABLE_TIME: request.parameters.IS_AVAILABLE_TIME.value
                        });
                    }
                });
            });
        });
    },

    get_datos_for_servicios_incluidos_op: function(c_centro_operacion, cs_id_orden_produccion, c_grupo_servicio, cs_id_orden, item_orden) {
        return new Promise((resolve, reject) => {
            let configuracion = utils.clone(config.configBD2);
            configuracion.database = CONSTANTES.POSDB;
            let connection = new sql.Connection(configuracion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                let requestOp = new sql.Request(connection);
                requestOp.verbose = false;
                requestOp.input("IN_C_CENTRO_OPERACION", sql.Char(3), c_centro_operacion);
                requestOp.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, cs_id_orden_produccion);
                requestOp.input("IN_C_GRUPO_SERVICIO", sql.Int, c_grupo_servicio);
                requestOp.input("IN_CS_ID_ORDEN", sql.Int, cs_id_orden);
                requestOp.input("IN_ITEM_ORDEN", sql.Int, item_orden);

                requestOp.execute('PRODUCCION.SSP_GET_DATOS_FOR_SERVICIOS_INCLUIDOS_OP', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            data: recordsets,
                            'MSG': "OK"
                        });
                    }
                });
            });
        });
    },

    get_ordenes_produccion: function(c_centro_operacion) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var requestOp = new sql.Request(connection);
                requestOp.verbose = false;
                requestOp.input("IN_C_CENTRO_OPERACION", sql.Char(3), c_centro_operacion);
                requestOp.execute('PRODUCCION.SSP_GET_ORDENES_PRODUCCION', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            data: recordsets,
                            'MSG': "OK"
                        });
                    }
                });
            });
        });
    },

    get_fecha_fin_etapa: function(c_centro_operacion, fecha_inicial, tiempo_minuto) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var requestOp = new sql.Request(connection);
                requestOp.verbose = false;
                requestOp.input("IN_C_CENTRO_OPERACION", sql.Char(3), c_centro_operacion);
                requestOp.input("FH_INICIO_EVALUAR", sql.VarChar, fecha_inicial);
                requestOp.input("MINUTOS_SERVICIO", sql.Int, tiempo_minuto);
                requestOp.output("DATETIME_SUGERIDO", sql.DateTime);
                requestOp.execute('PRODUCCION.SSP_GET_FECHA_FIN_ETAPA', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            data: recordsets,
                            'MSG': "OK",
                            "DATETIME_SUGERIDO": requestOp.parameters.DATETIME_SUGERIDO.value
                        });
                    }
                });
            });
        });
    },
    get_operarios_maquinas_by_row_id: function(rowid) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.MANTENIMIENTOBD;
            var connection = new sql.Connection(utils.clone(config.configBD2), function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var requestOp = new sql.Request(connection);
                requestOp.verbose = false;
                requestOp.input("IN_ROW_ID", sql.Int, rowid);
                requestOp.execute('MANTENIMIENTO.SSP_GET_OPERARIOS_MAQUINA_BY_ROW_ID', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            data: recordsets,
                            'MSG': "OK"
                        });
                    }
                });
            });
        });
    },
    get_dt_tipo_servicios_etapa: function(cs_id_orden_produccion, c_grupo_servicio) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, cs_id_orden_produccion);
                request.input("IN_C_GRUPO_SERVICIO", sql.Int, c_grupo_servicio);

                request.execute('PRODUCCION.SSP_GET_DT_TIPO_SERVICIOS_ETAPA', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_productos_ordenes_produccion: function(cs_id_orden_produccion) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, cs_id_orden_produccion);

                request.execute('PRODUCCION.SSP_GET_PRODUCTOS_ORDENES_PRODUCCION', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_horas_valle_etapa_op: function(body) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_FH_INICIO", sql.VarChar, body.fh_inicio);
                request.input("IN_FH_FIN", sql.VarChar, body.fh_fin);
                request.input("IN_ROW_ID_MAQUINA", sql.Int, body.row_id_maquina);
                request.input("IN_C_CENTRO_OPERACION", sql.Char(3), body.c_centro_operacion);

                request.execute('PRODUCCION.SSP_GET_HORA_VALLE_ETAPA_OP', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_reporte_servicios_especiales: function(body) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_FH_INICIO", sql.VarChar, body.f_inicio);
                request.input("IN_C_CENTRO_OPERACION", sql.VarChar, body.c_centro_operacion);

                request.execute('PRODUCCION.SSP_GET_REPORTE_SERVICIOS_ESPECIALES', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_etapa_previa_pendiente_by_barcode: function(barcode_etapa) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_BARCODE_ETAPA", sql.VarChar, barcode_etapa);

                request.execute('PRODUCCION.SSP_GET_ETAPA_PREVIA_PENDIENTE_BY_BARCODE', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_permisos_programacion_op_express_by_co: function(c_centro_operacion) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_C_CENTRO_OPERACION", sql.VarChar, c_centro_operacion);

                request.execute('PRODUCCION.SSP_GET_PERMISOS_PROGRAMACION_OP_EXPRESS_BY_CO', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_operarios_maquina_co: function(c_centro_operacion) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            //conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.GHUMANA;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_C_CENTRO_OPERACION", sql.VarChar, c_centro_operacion);

                request.execute('GHUMANA.SSP_GET_OPERARIOS_MAQUINA_CO', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_maquinas_centro_operacion_for_gestion_etapa: function(c_centro_operacion) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_C_CENTRO_OPERACION", sql.VarChar, c_centro_operacion);

                request.execute('PRODUCCION.SSP_GET_MAQUINAS_CENTRO_OPERACION_FOR_GESTION_ETAPA', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_op_pendientes_gestion_by_maquina: function(body) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }
                console.log("body", body)
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_ROW_ID_MAQUINA", sql.Int, body.row_id_maquina);
                request.input("IN_C_GRUPO_SERVICIO", sql.Int, body.c_grupo_servicio);
                request.input("IN_IS_SRV_ESPECIAL", sql.Bit, body.is_srv_especial);
                request.input("IN_CEDULA_OPERARIO", sql.BigInt, body.cedula_operario);

                request.execute('PRODUCCION.SSP_GET_OP_PENDIENTES_GESTION_BY_MAQUINA', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    }, 

    get_ordenes_entrega_cliente: function(c_centro_operacion) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_C_CENTRO_OPERACION_ORDEN_PRODUCCION", sql.VarChar, c_centro_operacion);

                request.execute('PRODUCCION.SSP_GET_ORDENES_ENTREGA_CLIENTE', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_saldo_cantidad_piezas_cortadas_entregadas_cliente: function(cs_id_orden_produccion) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, cs_id_orden_produccion);

                request.execute('PRODUCCION.SSP_GET_SALDO_CANTIDAD_PIEZAS_CORTADAS_ENTREGADAS_CLIENTE', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_informacion_entrega_op_cliente: function (cs_id_orden_produccion) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, cs_id_orden_produccion);

                request.execute('PRODUCCION.SSP_GET_INFORMACION_ENTREGA_OP_CLIENTE', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },
    
    get_dias_laborales_co_with_config_op_express: function (params) {
            return new Promise((resolve, reject) => {

                var conexion = utils.clone(config.configBD2);

                //Utilizar driver para controlar errores de conversión 
                conexion.driver = "msnodesqlv8";
                conexion.database = CONSTANTES.POSDB;

                var connection = new sql.Connection(conexion, function(err) {
                    // ... error checks
                    if (err) {
                        console.error(err);
                        reject(err);
                    }

                    var request = new sql.Request(connection);
                    request.verbose = false;
                    request.input("IN_C_CENTRO_OPERACION", sql.Char(3), params.c_centro_operacion);
                    request.input("IN_C_GRUPO_SERVICIO"  , sql.Int, params.c_grupo_servicio);

                    request.execute('PRODUCCION.SSP_GET_DIAS_LABORALES_CO_WITH_CONFIG_OP_EXPRESS', function (err, recordsets, returnValue) {
                        if (err) {
                            reject({
                                error: "err",
                                MSG: err.message
                            });
                        } else {
                            resolve({
                                error: "",
                                data: recordsets
                            });
                        }
                    });
                });
            });
    },
    
    get_ops_for_gestion_operario: function (body) { 
            return new Promise((resolve, reject) => {

                var conexion = utils.clone(config.configBD2);

                //Utilizar driver para controlar errores de conversión 
                conexion.driver = "msnodesqlv8";
                conexion.database = CONSTANTES.POSDB;

                var connection = new sql.Connection(conexion, function(err) {
                    // ... error checks
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    
                    var request = new sql.Request(connection);
                    request.verbose = true;
                    request.input("IN_C_CENTRO_OPERACION", sql.Char(3), body.c_centro_operacion);
                    request.input("IN_CEDULA_OPERARIO"   , sql.BigInt, body.cedula_operario);
                    request.input("IN_C_GRUPO_SERVICIO"  , sql.Int, body.c_grupo_servicio);
                    request.input("IN_IS_SRV_ESPECIAL"   , sql.Bit, body.is_srv_especial);
                    
                    request.execute('PRODUCCION.SSP_GET_OPS_FOR_GESTION_OPERARIO', function (err, recordsets, returnValue) {
                        if (err) {
                            reject({
                                error: "err",
                                MSG: err.message
                            });
                        } else {

                            resolve({
                                error: "",
                                data: recordsets
                            });
                        }
                    });
                });
            });
    },
    
    get_ops_serv_especiales_for_inicio_gestion_operario: function (body) {
            return new Promise((resolve, reject) => {

                var conexion = utils.clone(config.configBD2);

                //Utilizar driver para controlar errores de conversión 
                conexion.driver = "msnodesqlv8";
                conexion.database = CONSTANTES.POSDB;

                var connection = new sql.Connection(conexion, function(err) {
                    // ... error checks
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    
                    var request = new sql.Request(connection);
                    request.verbose = true;
                    request.input("IN_C_CENTRO_OPERACION", sql.Char(3), body.c_centro_operacion);
                    request.input("IN_CEDULA_OPERARIO"   , sql.BigInt, body.cedula_operario);
                    request.input("IN_C_GRUPO_SERVICIO"  , sql.Int, body.c_grupo_servicio);
                    request.input("IN_IS_SRV_ESPECIAL"   , sql.Bit, body.is_srv_especial);
                    
                    request.execute('PRODUCCION.SSP_GET_OPS_SERV_ESPECIALES_FOR_INICIO_GESTION_OPERARIO', function (err, recordsets, returnValue) {
                        if (err) {
                            reject({
                                error: "err",
                                MSG: err.message
                            });
                        } else {

                            resolve({
                                error: "",
                                data: recordsets
                            });
                        }
                    });
                });
            });
        },

    get_data_etapa_for_gestion_operario: function (body) {
            return new Promise((resolve, reject) => {

                var conexion = utils.clone(config.configBD2);

                //Utilizar driver para controlar errores de conversión 
                conexion.driver = "msnodesqlv8";
                conexion.database = CONSTANTES.POSDB;

                var connection = new sql.Connection(conexion, function(err) {
                    // ... error checks
                    if (err) {
                        console.error(err);
                        reject(err);
                    }

                    var request = new sql.Request(connection);
                    request.verbose = true;
                    
                    request.input("IN_CS_ID_ORDEN_PRODUCCION"  , sql.BigInt, body.cs_id_orden_produccion);
                    request.input("IN_C_GRUPO_SERVICIO"        , sql.Int, body.c_grupo_servicio);
                    request.input("IN_CEDULA_OPERARIO"         , sql.BigInt, body.cedula_operario);
                    request.input("IN_IS_GESTION_EXTRA_LABORAL", sql.Bit, body.sw_extra_laboral);
                    
                    request.output('MSG', sql.VarChar(200));
  
                    request.execute('PRODUCCION.SSP_GET_DATA_ETAPA_FOR_GESTION_OPERARIO', function (err, recordsets, returnValue) {
                        if (err) {
                            reject({
                                error: "err",
                                MSG: err.message
                            });
                        } else {
                            resolve({
                                error: "",
                                data: recordsets,
                                MSG: request.parameters.MSG.value
                            });
                        }
                    });
                });
            });
    },
    

    get_dt_planeacion_etapas_dia_by_op: function (cs_id_orden_produccion) {
            return new Promise((resolve, reject) => {

                var conexion = utils.clone(config.configBD2);

                //Utilizar driver para controlar errores de conversión 
                conexion.driver = "msnodesqlv8";
                conexion.database = CONSTANTES.POSDB;

                var connection = new sql.Connection(conexion, function(err) {
                    // ... error checks
                    if (err) {
                        console.error(err);
                        reject(err);
                    }

                    var request = new sql.Request(connection);
                    request.verbose = false;
                    
                    request.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, cs_id_orden_produccion);
                    
                    request.execute('PRODUCCION.SSP_GET_DT_PLANEACION_ETAPAS_DIA_BY_OP', function (err, recordsets, returnValue) {
                        if (err) {
                            reject({
                                error: "err",
                                MSG: err.message
                            });
                        } else {
                            resolve({
                                error: "",
                                data: recordsets
                            });
                        }
                    });
                });
            });
    },
    
    get_data_etapa_for_anulacion_gestion_operario: function (body) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }
                var request = new sql.Request(connection);
                console.log("body", body)
                request.verbose = true;
                request.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, body.cs_id_orden_produccion);
                request.input("IN_C_GRUPO_SERVICIO"      , sql.Int, body.c_grupo_servicio);
                request.input("IN_CEDULA_OPERARIO"       , sql.Decimal(16, 0), body.cedula_operario);

                request.output('MSG', sql.VarChar);

                request.execute('PRODUCCION.SSP_GET_DATA_ETAPA_FOR_ANULACION_GESTION_OPERARIO', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            data: recordsets,
                            MSG: request.parameters.MSG.value
                        });
                    }
                });
            });
        });
    },

    anular_gestion_etapa: function (body) {
            return new Promise((resolve, reject) => {

                let conexion = utils.clone(config.configBD2);

                //Utilizar driver para controlar errores de conversión 
                conexion.driver = "msnodesqlv8";
                conexion.database = CONSTANTES.POSDB;

                let connection = new sql.Connection(conexion);

                connection.connect(function(err) {

                    if (err) {
                        reject({
                            error: err,
                            MSG: err.message
                        });
                    }

                    let transaction = new sql.Transaction(connection);

                    transaction.begin(function(err) {
                        // ... error checks
                        if (err) {
                            reject({
                                error: err,
                                MSG: err.message
                            });
                        }

                        let request = new sql.Request(transaction);
                        request.verbose = true;

                        request.input("IN_SW_ETAPA_INICIADA"     , sql.Bit, body.sw_etapa_iniciada_operario);
                        request.input("IN_SW_ETAPA_FINALIZADA"   , sql.Bit, body.sw_etapa_finalizada_operario);
                        request.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, body.cs_id_orden_produccion);
                        request.input("IN_C_GRUPO_SERVICIO"      , sql.Int, body.c_grupo_servicio);
                        request.input("IN_CEDULA_OPERARIO"       , sql.Decimal(16, 0), body.cedula_operario);
                        request.input("IN_LOG_UPDATE"            , sql.Int, body.log_update);

                        request.output('MSG', sql.VarChar);

                        request.execute('PRODUCCION.SSP_ANULAR_GESTION_ETAPA', function (err, recordsets, returnValue) {
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

                                if (request.parameters.MSG.value !== "GUARDADO") {
                                    reject({
                                        error: "err",
                                        MSG: request.parameters.MSG.value
                                    });
                                    transaction.rollback(function (err2) {
                                    });
                                } else {

                                    transaction.commit(function (err, recordset) {
                                        resolve({
                                            data: recordsets,
                                            MSG: request.parameters.MSG.value
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

    get_ops_for_anulacion_gestion_operario: function (body) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_C_CENTRO_OPERACION", sql.Char(3), body.c_centro_operacion);
                request.input("IN_CEDULA_OPERARIO", sql.BigInt, body.cedula_operario);
                request.input("IN_C_GRUPO_SERVICIO", sql.Int, body.c_grupo_servicio);
                request.input("IN_IS_SRV_ESPECIAL", sql.Bit, body.is_srv_especial);

                request.execute('PRODUCCION.SSP_GET_OPS_FOR_ANULACION_GESTION_OPERARIO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },
    
    update_ausencia_operario_maquina: function (body) {
        return new Promise((resolve, reject) => {

            let conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.MANTENIMIENTOBD;

            let connection = new sql.Connection(conexion);

            connection.connect(function(err) {

                if (err) {
                    reject({
                        error: err,
                        MSG: err.message
                    });
                }

                let transaction = new sql.Transaction(connection);

                transaction.begin(function(err) {
                    // ... error checks
                    if (err) {
                        reject({
                            error: err,
                            MSG: err.message
                        });
                    }

                    let request = new sql.Request(transaction);
                    request.verbose = true;

                    request.input("IN_ROW_ID_MAQUINA"      , sql.Int, body.row_id_maquina);
                    request.input("IN_SW_AUSENCIA_OPERARIO", sql.Bit, body.is_maquina_operario_ausente);
                    request.input("IN_LOG_ID_USUARIO"      , sql.Int, body.log_user);

                    request.output('MSG', sql.VarChar);

                    request.execute('MANTENIMIENTO.SSP_UPDATE_AUSENCIA_OPERARIO_MAQUINA', function(err, recordsets, returnValue) {
                        if (err) {
                            reject({
                                error: err,
                                MSG: err.message
                            });
                            transaction.rollback(function(err) {
                                // ... error checks
                                return;
                            });
                        } else {

                            if (request.parameters.MSG.value !== "GUARDADO") {
                                reject({
                                    error: "err",
                                    MSG: request.parameters.MSG.value
                                });
                                transaction.rollback(function(err2) {
                                });
                            } else {

                                transaction.commit(function(err, recordset) {
                                    resolve({
                                        //data: recordsets,
                                        MSG: request.parameters.MSG.value
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
    
    get_motivos_suspension_etapa: function (params) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.input("IN_C_GRUPO_SERVICIO", sql.Int, params.c_grupo_servicio);
                request.input("IN_C_CENTRO_OPERACION", sql.VarChar, params.c_centro_operacion);
                
                request.execute('PRODUCCION.SSP_GET_MOTIVOS_SUSPENSION_ETAPA', function (err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            data: recordsets
                        });
                    }
                });
            });
        });
    },
    
    insert_motivo_suspension_etapa: function (body) {
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

                    /*realizo el registro de la etapa suspendida con un motivo previamente seleccionado*/
                    let request = new sql.Request(transaction);
                    request.verbose = true;

                    request.input("IN_CS_ID_ORDEN_PRODUCCION"   , sql.BigInt, body.cs_id_orden_produccion);
                    request.input("IN_C_GRUPO_SERVICIO"         , sql.Int, body.c_grupo_servicio);
                    request.input("IN_CEDULA_OPERARIO"          , sql.Decimal(16, 0), body.cedula_operario);
                    request.input("IN_C_MOTIVO_SUSPENSION_ETAPA", sql.SmallInt, body.c_motivo_suspension_etapa);
                    request.input("IN_ID_LOG_USER"              , sql.Int, body.log_user);

                    request.output('MSG', sql.VarChar);

                    request.execute('PRODUCCION.SSP_INSERT_MOTIVO_SUSPENSION_ETAPA', function (err, recordsets, returnValue) {
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

                            if (request.parameters.MSG.value !== "GUARDADO") {
                                reject({
                                    error: "err",
                                    MSG: request.parameters.MSG.value
                                });
                                transaction.rollback(function (err2) {
                                });
                            } else {

                                /*actualizo el sw ubicado en la tabla de gestión etapa operario*/
                                produccion_dao.update_sw_suspension_gestion_etapa_operario(body, transaction)
                                    .then(result => {
                                        resolve({
                                            MSG: result.MSG
                                        });
                                    })
                                    .catch(error => {
                                        reject({
                                            error: error,
                                            MSG: error.MSG
                                        });
                                    });
                            }
                        }
                    });
                });
            });
        });
    },

    update_motivo_suspension_etapa: function (body) {
        return new Promise((resolve, reject) => {

            let conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            let connection = new sql.Connection(conexion);

            connection.connect(function(err) {

                if (err) {
                    reject({
                        error: err,
                        MSG: err.message
                    });
                }

                let transaction = new sql.Transaction(connection);

                transaction.begin(function(err) {
                    // ... error checks
                    if (err) {
                        reject({
                            error: err,
                            MSG: err.message
                        });
                    }

                    /*realizo el registro de la etapa suspendida con un motivo previamente seleccionado*/
                    let request = new sql.Request(transaction);
                    request.verbose = true;

                    request.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, body.cs_id_orden_produccion);
                    request.input("IN_C_GRUPO_SERVICIO"      , sql.Int, body.c_grupo_servicio);
                    request.input("IN_CEDULA_OPERARIO"       , sql.Decimal(16, 0), body.cedula_operario);
                    request.input("IN_ID_LOG_USER"           , sql.Int, body.log_user);

                    request.output('MSG', sql.VarChar);

                    request.execute('PRODUCCION.SSP_UPDATE_MOTIVO_SUSPENSION_ETAPA', function(err, recordsets, returnValue) {
                        if (err) {
                            reject({
                                error: err,
                                MSG: err.message
                            });
                            transaction.rollback(function(err) {
                                // ... error checks
                                return;
                            });
                        } else {

                            if (request.parameters.MSG.value !== "GUARDADO") {
                                reject({
                                    error: "err",
                                    MSG: request.parameters.MSG.value
                                });
                                transaction.rollback(function(err2) {
                                });
                            } else {
                                /*actualizo el sw ubicado en la tabla de gestión etapa operario*/
                                produccion_dao.update_sw_suspension_gestion_etapa_operario(body, transaction)
                                    .then(result => {
                                        resolve({
                                            MSG: result.MSG
                                        });
                                    })
                                    .catch(error => {
                                        reject({
                                            error: error,
                                            MSG: error.MSG
                                        });
                                    });
                            }
                        }
                    });
                });
            });
        });
    },

    update_sw_suspension_gestion_etapa_operario: (body, transaction) => {
        return new Promise((resolve, reject) => {
            
            let request_gestion = new sql.Request(transaction);
            request_gestion.verbose = true;

            request_gestion.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, body.cs_id_orden_produccion);
            request_gestion.input("IN_C_GRUPO_SERVICIO", sql.Int, body.c_grupo_servicio);
            request_gestion.input("IN_SW_OP_SUSPENDIDA", sql.Bit, body.is_sw_op_suspendida);
            request_gestion.input("IN_CEDULA_OPERARIO", sql.Decimal(16, 0), body.cedula_operario);
            request_gestion.input("IN_ID_LOG_USER", sql.Int, body.log_user);

            request_gestion.output('MSG', sql.VarChar);

            request_gestion.execute('PRODUCCION.SSP_UPDATE_SW_SUSPENSION_GESTION_ETAPA_OPERARIO', function(err, recordsets, returnValue) {
                if (err) {
                    reject({
                        error: err,
                        MSG: err.message
                    });
                    transaction.rollback(function(err) {
                        // ... error checks
                        return;
                    });
                } else {

                    if (request_gestion.parameters.MSG.value !== "GUARDADO") {
                        reject({
                            error: "err",
                            MSG: request_gestion.parameters.MSG.value
                        });
                        transaction.rollback(function(err2) {
                        });
                    } else {

                        transaction.commit(function(err, recordset) {
                            resolve({
                                //data: recordsets,
                                MSG: request_gestion.parameters.MSG.value
                            });
                            console.log("Transaction commited.");
                        });

                    }
                }
            });
        });
    },

    get_fecha_disponibilidad_produccion: function (c_centro_operacion) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_C_CENTRO_OPERACION", sql.Char(3), c_centro_operacion);
                request.input("IN_CS_ID_ORDEN", sql.BigInt, null);

                request.output('OUT_F_TIEMPO_DISPONIBLE_INICIO_OP', sql.DateTime);

                request.execute('PRODUCCION.SSP_GET_FECHA_DISPONIBILIDAD_PRODUCCION_BY_CO', function(err, recordsets) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_tiempo_produccion_by_item_ov: function (params) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_CS_ID_ORDEN", sql.BigInt, params.cs_id_orden);
                request.input("IN_ITEM_OV", sql.Int, params.item_ov);

                request.output('OUT_MINUTOS_PRODUCCION_ITEM', sql.VarChar);

                request.execute('PRODUCCION.SSP_GET_TIEMPO_PRODUCCION_BY_ITEM_OV', function(err, recordsets) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            data: recordsets,
                            OUT_MINUTOS_PRODUCCION_ITEM: request.parameters.OUT_MINUTOS_PRODUCCION_ITEM.value
                        });
                    }
                });
            });
        });
    },

    get_data_produccion_by_ov: function (body) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_CS_ID_ORDEN", sql.BigInt, body.cs_id_orden);
                request.input("IN_FH_INICIO_EVALUAR", sql.VarChar, body.fh_inicio_evaluar);
                
                request.execute('PRODUCCION.SSP_GET_DATA_PRODUCCION_BY_OV', function (err, recordsets) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            data: recordsets
                        });
                    }
                });
            });
        });
    },

    get_ops_for_gestion_operario_extra_laboral: function (body) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_C_CENTRO_OPERACION"  , sql.Char(3), body.c_centro_operacion);
                request.input("IN_CEDULA_OPERARIO"     , sql.BigInt, body.cedula_operario);
                request.input("IN_C_GRUPO_SERVICIO"    , sql.Int, body.c_grupo_servicio);
                request.input("IN_IS_SRV_ESPECIAL"     , sql.Bit, body.is_srv_especial);
                request.input("IN_CS_ID_ORDEN_VENTA_CO", sql.Decimal(10, 0), body.cs_id_orden_venta_co);
                
                request.output('MSG', sql.VarChar);

                request.execute('PRODUCCION.SSP_GET_OPS_FOR_GESTION_OPERARIO_EXTRA_LABORAL', function (err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            data: recordsets,
                            MSG: request.parameters.MSG.value
                        });
                    }
                });
            });
        });
    },
    
    get_suspensiones_etapa_operario: function (params) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }
                
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, params.cs_id_orden_produccion);
                request.input("IN_CEDULA_OPERARIO"       , sql.Decimal(16, 0), params.cedula_operario);
                request.input("IN_C_GRUPO_SERVICIO"      , sql.Int, params.c_grupo_servicio);

                request.execute('PRODUCCION.SSP_GET_SUSPENSIONES_ETAPA_OPERARIO', function(err, recordsets) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            data: recordsets
                        });
                    }
                });
            });
        });
    },
    
    get_dt_gestion_etapas_op: function (params) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            //conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_CS_ID_ORDEN_PRODUCCION", sql.BigInt, params.cs_id_orden_produccion);

                request.execute('PRODUCCION.SSP_GET_DT_GESTION_ETAPAS_OP', function(err, recordsets) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {
                        resolve({
                            data: recordsets
                        });
                    }
                });
            });
        });
    },
    
    get_ops_for_inicio_gestion_operario: function (body) {
        return new Promise((resolve, reject) => {

            var conexion = utils.clone(config.configBD2);

            //Utilizar driver para controlar errores de conversión 
            conexion.driver = "msnodesqlv8";
            conexion.database = CONSTANTES.POSDB;

            var connection = new sql.Connection(conexion, function(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_C_CENTRO_OPERACION", sql.Char(3), body.c_centro_operacion);
                request.input("IN_C_GRUPO_SERVICIO", sql.Int, body.c_grupo_servicio);

                request.execute('PRODUCCION.SSP_GET_OPS_FOR_INICIO_GESTION_OPERARIO', function(err, recordsets, returnValue) {
                    if (err) {
                        reject({
                            error: "err",
                            MSG: err.message
                        });
                    } else {

                        resolve({
                            error: "",
                            data: recordsets
                        });
                    }
                });
            });
        });
    },
    
    get_list_ops_for_gestion_operario_by_grupo_servicio: function (body) {
            return new Promise((resolve, reject) => {

                var conexion = utils.clone(config.configBD2);

                //Utilizar driver para controlar errores de conversión 
                conexion.driver = "msnodesqlv8";
                conexion.database = CONSTANTES.POSDB;

                var connection = new sql.Connection(conexion, function(err) {
                    // ... error checks
                    if (err) {
                        console.error(err);
                        reject(err);
                    }

                    var request = new sql.Request(connection);
                    request.verbose = true;
                    request.input("IN_C_CENTRO_OPERACION", sql.Char(3), body.c_centro_operacion);
                    request.input("IN_C_GRUPO_SERVICIO", sql.Int, body.c_grupo_servicio);

                    request.execute('PRODUCCION.SSP_GET_LIST_OPS_FOR_GESTION_OPERARIO_BY_GRUPO_SERVICIO', function (err, recordsets, returnValue) {
                        if (err) {
                            reject({
                                error: "err",
                                MSG: err.message
                            });
                        } else {

                            resolve({
                                error: "",
                                data: recordsets
                            });
                        }
                    });
                });
            });
        },
};

module.exports = produccion_dao;