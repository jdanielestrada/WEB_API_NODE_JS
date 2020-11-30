var sql = require('mssql');
var CONSTANTES = require('../utils/constantes');
var config = require('../utils/config');
var utils = require('../utils/utils');
var Promise = require('bluebird');
var async = require('async');
var _ = require('underscore')._;

/**
 * implementación en los SP de la base de datos POS, usando la convención ASYNC
 * @type {Object}
 */
var pos_dao = {

    RESULTS_POS_DAO: {},

    getParametros: function (parametro, callback) {
        var self = this;
        config.configBD2.database = CONSTANTES.POSDB;
        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
            // ... error checks
            if (err) {
                return callback(err);
                console.error(err);
            }
            // Stored Procedure
            var request = new sql.Request(connection);
            request.verbose = false;
            request.input("IN_C_PARAMETRO", sql.VarChar, parametro);

            request.execute('POS.SSP_PARAMETRO', function (err, recordsets, returnValue) {
                if (err) {
                    return callback(err);
                } else {
                    self.RESULTS_POS_DAO = recordsets;
                    //console.log("RESULTS_POS_DAO", self.RESULTS_POS_DAO);

                    return callback(null, {
                        data: recordsets
                    });
                }

            });

        });
    },

    get_m_parametros: function (parametro) {
        return new Promise((resolve, reject) => {

            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_C_PARAMETRO", sql.VarChar, parametro);

                request.execute('POSMADECENTRO.SSP_PARAMETRO', function (err, recordsets, returnValue) {
                    if (err) {
                        return reject(err);
                    } else {

                        return resolve({
                            data: recordsets
                        });
                    }

                });

            });
        });
    },

    getPlantilla: function (parametro, callback) {
        var self = this;
        config.configBD2.database = CONSTANTES.POSDB;
        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
            // ... error checks
            if (err) {
                callback(err);
                console.error(err);
            }
            // Stored Procedure
            var request = new sql.Request(connection);
            request.verbose = false;
            request.input("IN_ID_PLANTILLA_EMAIL", sql.VarChar, parametro);

            request.execute('POS.SSP_CORPORATIVA_PLANTILLAS_EMAIL', function (err, recordsets, returnValue) {
                if (err) {
                    callback(err);
                } else {
                    self.RESULTS_POS_DAO = recordsets;
                    //console.log("RESULTS_POS_DAO", self.RESULTS_POS_DAO);

                    callback(null, {
                        data: recordsets
                    });
                }

            });

        });
    },

    getPedidosPorDespachar: function () {
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
                request.verbose = false;
                // request.input("IN_FECHA_CREACION", sql.VarChar(20), fecha_analizar);

                request.execute('POS.SSP_GET_ORDENES_PENDIENTE_EMVIO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }

                });

            });
        });
    },

    insertGestionDocumental: function (req, callback) {
        var self = this;
        config.configBD2.database = CONSTANTES.POSDB;
        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
            // ... error checks
            if (err) {
                console.error(err);
                return callback(err);
            }
            // Stored Procedure
            var request = new sql.Request(connection);
            request.verbose = false;
            request.input("IN_ID_ESTRUCTURA_GDOCUMENTAL", sql.VarChar, req.body.in_id_estructura_gdocumental);
            request.input("IN_C_TIPO_DOCUMENTO", sql.Int, req.body.in_c_tipo_documento);
            request.input("IN_CS_ID_APLICACION", sql.Int, req.body.in_cs_id_aplicacion);
            request.input("IN_RADICADO_APLICACION", sql.Decimal, req.body.in_radicado_aplicacion);
            request.input("IN_NRO_VERSION", sql.Int, req.body.in_nro_version);
            request.input("IN_ID_GDOCUMENTAL_FUENTE", sql.VarChar, req.body.in_id_gdocumental_fuente);
            request.input("IN_ID_HOMOLOGO", sql.VarChar, req.body.in_id_homologo);
            request.input("INT_LOG_INSERT", sql.Int, req.body.int_log_insert);
            request.input("IN_EXTENSION", sql.VarChar, req.body.extension);

            request.output("OUT_CS_ID_GDOCUMENTAL", sql.VarChar);
            request.output("OUT_RUTA_ARCHIVO", sql.VarChar);
            request.output("MSG", sql.VarChar);

            request.execute('POSMADECENTRO.SSP_INSERT_MV_GESTION_DTAL', function (err, recordsets, returnValue) {
                if (err) {
                    return callback(err);
                } else {
                    self.RESULTS_POS_DAO = recordsets;
                    //console.log("RESULTS_POS_DAO", self.RESULTS_POS_DAO);

                    callback(null, {
                        data: recordsets,
                        'OUT_CS_ID_GDOCUMENTAL': request.parameters.OUT_CS_ID_GDOCUMENTAL.value,
                        'OUT_RUTA_ARCHIVO': request.parameters.OUT_RUTA_ARCHIVO.value,
                        'MSG': request.parameters.MSG.value
                    });
                }

            });

        });
    },

    getAprobadoresZona: function (zonaSucursal, grupo, linea, callback) {

        var self = this;
        config.configBD2.database = CONSTANTES.POSDB;
        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
            // ... error checks
            if (err) {
                callback(err);
                console.error(err);
            }
            // Stored Procedure
            var request = new sql.Request(connection);
            request.verbose = true;
            request.input("IN_ZONA_SUCURSAL", sql.VarChar(3), zonaSucursal);
            request.input("IN_GRUPO", sql.VarChar(10), grupo);
            request.input("IN_LINEA", sql.VarChar(10), linea);

            request.execute('POSMADECENTRO.SSP_GET_APROBADORES_BY_ZONA_GRUPOS_LINEAS', function (err, recordsets, returnValue) {
                if (err) {
                    callback(err);
                } else {
                    if (Array.isArray(recordsets[0]) && recordsets[0].length > 0) {
                        self.RESULTS_POS_DAO = recordsets;
                        //console.log("RESULTS_POS_DAO", self.RESULTS_POS_DAO);

                        callback(null, {
                            data: recordsets
                        });
                    }
                    else {
                        // Stored Procedure
                        var request2 = new sql.Request(connection);
                        request2.verbose = false;
                        request2.input("IN_ZONA_SUCURSAL", sql.VarChar(3), zonaSucursal);
                        request2.input("IN_GRUPO", sql.VarChar(10), grupo);


                        request2.execute('POSMADECENTRO.SSP_GET_APROBADORES_BY_ZONA_GRUPOS', function (err, recordsets, returnValue) {
                            if (err) {
                                callback(err);
                            } else {
                                self.RESULTS_POS_DAO = recordsets;
                                //console.log("RESULTS_POS_DAO", self.RESULTS_POS_DAO);

                                callback(null, {
                                    data: recordsets
                                });
                            }

                        });
                    }
                }
            });

        });

    },

    verificarSolicitudAprobacion: function (cs_id_orden, item, subitem, referencia_producto, pj_descuento, callback) {
        var self = this;
        config.configBD2.database = CONSTANTES.POSDB;
        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
            // ... error checks
            if (err) {
                callback(err);
                console.error(err);
            }
            // Stored Procedure
            var request = new sql.Request(connection);
            request.verbose = true;
            request.input("IN_CS_ID_ORDEN", sql.BigInt, cs_id_orden);
            request.input("IN_REFERENCIA", sql.VarChar(20), referencia_producto);
            request.input("IN_ITEM", sql.SmallInt, item);
            request.input("IN_SUBITEM", sql.SmallInt, subitem);
            request.input("IN_PJ_DESCUENTO", sql.Decimal(16, 2), pj_descuento);

            request.execute('POSMADECENTRO.SSP_GET_EXISTENTE_M_CUPONES_DESCUENTOS', function (err, recordsets, returnValue) {
                if (err) {
                    callback(err);
                } else {
                    self.RESULTS_POS_DAO = recordsets;
                    console.log("RESULTS_POS_DAO", self.RESULTS_POS_DAO);

                    callback(null, {
                        data: recordsets
                    });
                }

            });

        });
    },


    /**
     * consulta las bodegas por centro de operación
     * usa el formato de PROMISE
     * @param centroOperacion
     * @returns {Promise}
     */
    getBodegasByCentroOperacion: function (centroOperacion) {

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
                request.verbose = false;
                request.input("IN_CENTRO_OPERACION", sql.VarChar, centroOperacion);

                request.execute('POSMADECENTRO.SSP_GET_BODEGAS_BY_CENTRO_OPERACION',
                    function (err, recordsets, returnValue) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(recordsets[0]);
                        }

                    });

            });
        });
    },


    insertSolicitudTraslado: function (in_bodega_origen, in_bodega_destino, in_referencia_producto, in_descripcion_producto, in_cantidad, in_item, in_cs_id_orden, in_cs_id_usuario, bodega) {

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
                request.verbose = false;
                request.input("IN_C_BODEGA_ORIGEN", sql.VarChar, in_bodega_origen);
                request.input("IN_C_BODEGA_DESTINO", sql.VarChar, in_bodega_destino);
                request.input("IN_REFERENCIA_PRODUCTO", sql.VarChar, in_referencia_producto);
                request.input("IN_DESCRIPCION_PRODUCTO", sql.VarChar, in_descripcion_producto);
                request.input("IN_ITEM", sql.Int, in_item);
                request.input("IN_CANTIDAD", sql.Real, in_cantidad);
                request.input("IN_CS_ID_ORDEN", sql.Int, in_cs_id_orden);
                request.input("IN_CS_ID_USUARIO", sql.Int, in_cs_id_usuario);

                request.output("MSG", sql.VarChar);
                request.output("OUT_CS_ID_SOLICITUD_TRASLADO", sql.Int);

                request.execute('POSMADECENTRO.SSP_LOGISTICA_INSERT_SOLICITUD_TRASLADO',
                    function (err, recordsets, returnValue) {
                        if (err) {
                            reject(err);
                        } else {
                            bodega.id = request.parameters.OUT_CS_ID_SOLICITUD_TRASLADO.value;
                            resolve({ data: recordsets[0], MSG: request.parameters.MSG.value, OUT_CS_ID_SOLICITUD_TRASLADO: bodega.id });
                        }

                    });

            });
        });
    },


    /**
     * obtiene los detalles del productos en base a los parámetros ingresados
     * usa el formato de PROMISE
     * @param referencia
     * @param codigoBodega
     * @param centroOperacion
     * @param idCia
     * @returns {Promise}
     */
    getProductoByReferencia: function (referencia, codigoBodega, centroOperacion, idCia, cs_id_orden) {

        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.log(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("INZONACENTROOPERACION", sql.Int, idCia);
                request.input("INIDCENTROOPERACION", sql.VarChar, centroOperacion);
                request.input("IN_ID_BODEGA", sql.VarChar, codigoBodega);
                request.input("INREFERENCIA", sql.VarChar, referencia);
                request.input('IN_CS_ID_ORDEN', sql.VarChar, cs_id_orden);
                
                request.execute('POSMADECENTRO.SSP_SELECTEXISTENCIABYREF', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets[0]);
                    }
                });

            });
        });

    },

    getserviciospersonalizados: function () {

        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.log(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = false;

                request.execute('POSMADECENTRO.SSP_GET_SERVICIOSPERSONALIZADO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets);
                    }
                });

            });
        });

    },
    getServiciosAllPermitidos: function (idCia, centroOperacion) {

        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.log(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.input('IN_ID_COMPANIA', sql.Int, idCia);
                request.input('IN_ID_CO', sql.VarChar, centroOperacion);
                request.verbose = false;

                request.execute('POSMADECENTRO.SSP_SELECTALLSERVICIOS', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {

                        var listaServicios = recordsets[0];
                        //llamamos a las restricciones, servicio NO permitidos y los removemos de la lista, devolvemos el resultado
                        config.configBD2.database = CONSTANTES.POSDB;
                        var connection2 = new sql.Connection(utils.clone(config.configBD2), function (err) {
                            // ... error checks
                            if (err) {
                                console.error(err);
                                return reject(err);
                            }
                            // Stored Procedure
                            var request2 = new sql.Request(connection2);
                            request2.verbose = false;
                            request2.input('IN_CENTRO_OPERACION', sql.VarChar, centroOperacion);

                            request2.execute('POSMADECENTRO.SSP_GET_SERVICIOS_NO_PERMITIDOS', function (err, recordsets, returnValue) {
                                if (err) {
                                    return reject(err);

                                } else {

                                    recordsets[0].forEach(function (servicio_nopermitido) {
                                        var i = _.findIndex(listaServicios, function (servicio) {
                                            return servicio.Referencia == servicio_nopermitido.referencia_servicio;
                                        });
                                        if (i !== -1) {
                                            listaServicios.splice(i, 1);
                                        }
                                    });

                                    resolve(listaServicios);
                                }
                            });

                        });
                    }
                });

            });
        });

    },


    //Consultar servicios generales 
    getServiciosAllPermitidosGenerales: function (idCia, centroOperacion) {

        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.log(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.input('IN_ID_COMPANIA', sql.Int, idCia);
                request.input('IN_ID_CO', sql.VarChar, centroOperacion);
                request.verbose = false;

                request.execute('POSMADECENTRO.SSP_SELECTALLSERVICIOSGENERALES', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {

                        var listaServicios = recordsets[0];
                        //llamamos a las restricciones, servicio NO permitidos y los removemos de la lista, devolvemos el resultado
                        config.configBD2.database = CONSTANTES.POSDB;
                        var connection2 = new sql.Connection(utils.clone(config.configBD2), function (err) {
                            // ... error checks
                            if (err) {
                                console.error(err);
                                return reject(err);
                            }
                            // Stored Procedure
                            var request2 = new sql.Request(connection2);
                            request2.verbose = false;
                            request2.input('IN_CENTRO_OPERACION', sql.VarChar, centroOperacion);

                            request2.execute('POSMADECENTRO.SSP_GET_SERVICIOS_NO_PERMITIDOS', function (err, recordsets, returnValue) {
                                if (err) {
                                    return reject(err);

                                } else {

                                    recordsets[0].forEach(function (servicio_nopermitido) {
                                        var i = _.findIndex(listaServicios, function (servicio) {
                                            return servicio.Referencia == servicio_nopermitido.referencia_servicio;
                                        });
                                        if (i !== -1) {
                                            listaServicios.splice(i, 1);
                                        }
                                    });

                                    resolve(listaServicios);
                                }
                            });

                        });
                    }
                });

            });
        });

    },


    //Servicios cotizador puertas
    getServiciosAllPermitidosPuertas: function (idCia, centroOperacion, referenciaPuerta) {

        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.log(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.input('IN_ID_COMPANIA', sql.Int, idCia);
                request.input('IN_ID_CO', sql.VarChar, centroOperacion);
                request.input('IN_REFERENCIA', sql.VarChar, referenciaPuerta)
                request.verbose = false;

                request.execute('POSMADECENTRO.SSP_SELECTALLSERVICIOSCOTIZADORPUERTAS', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {

                        var listaServicios = recordsets[0];
                        //llamamos a las restricciones, servicio NO permitidos y los removemos de la lista, devolvemos el resultado
                        config.configBD2.database = CONSTANTES.POSDB;
                        var connection2 = new sql.Connection(utils.clone(config.configBD2), function (err) {
                            // ... error checks
                            if (err) {
                                console.error(err);
                                return reject(err);
                            }
                            // Stored Procedure
                            var request2 = new sql.Request(connection2);
                            request2.verbose = false;
                            request2.input('IN_CENTRO_OPERACION', sql.VarChar, centroOperacion);

                            request2.execute('POSMADECENTRO.SSP_GET_SERVICIOS_NO_PERMITIDOS', function (err, recordsets, returnValue) {
                                if (err) {
                                    return reject(err);

                                } else {

                                    recordsets[0].forEach(function (servicio_nopermitido) {
                                        var i = _.findIndex(listaServicios, function (servicio) {
                                            return servicio.Referencia == servicio_nopermitido.referencia_servicio;
                                        });
                                        if (i !== -1) {
                                            listaServicios.splice(i, 1);
                                        }
                                    });

                                    resolve(listaServicios);
                                }
                            });

                        });
                    }
                });

            });
        });

    },


    getPagosRealizados: function (idOrden) {
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
                request.verbose = false;
                request.input("IN_CS_ID_ORDEN", sql.BigInt, idOrden);


                request.execute('POSMADECENTRO.SSP_GET_MV_ORDEN_PAGOS', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets);
                    }

                });

            });
        });
    },

    getFacturaImpresion: function (
        prefijo_factura,
        nro_factura,
        nro_pedido,
        centroOperacion,
        idCia,
        id_impresion,
        cs_id_orden
    ) {

        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.log(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("p_cia", sql.Int, idCia);
                request.input("p_id_co", sql.VarChar, centroOperacion);
                request.input("p_id_tipo_docto", sql.VarChar, prefijo_factura);
                request.input("p_consec_inicial", sql.Int, nro_pedido);
                request.input("p_consec_final", sql.Int, nro_factura);
                request.input("p_id_dispositivo", sql.VarChar, id_impresion);
                request.input("p_cs_id_orden", sql.Int, cs_id_orden);

                request.execute('POSMADECENTRO.SSP_IMPRIMIR_FACTURA_CONTADO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets[0]);
                    }
                });

            });
        });

    },

    getDataFacturaCredito: function (idCia, centro_operacion, prefijo_factura, nro_factura) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.log(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_ID_CIA", sql.Int, idCia);
                request.input("IN_C_CENTRO_OPERACION", sql.VarChar, centro_operacion);
                request.input("IN_PREFIJO_FACTURA", sql.VarChar, prefijo_factura);
                request.input("IN_NRO_FACTURA", sql.Int, nro_factura);

                request.execute('POSMADECENTRO.SSP_IMPRIMIR_FACTURA_CREDITO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets);
                    }
                });

            });
        });
    },


    updateIndicadorImpresion: function (prefijo_factura,
        nro_factura,
        centroOperacion,
        idCia) {

        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.log(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("p_cia", sql.Int, idCia);
                request.input("p_id_co", sql.VarChar, centroOperacion);
                request.input("p_id_tipo_docto", sql.VarChar, prefijo_factura);
                request.input("p_consec_final", sql.Int, nro_factura);

                request.execute('POSMADECENTRO.SSP_UPDATE_INDICADOR_IMPRIMIR_FACTURA_CONTADO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets[0]);
                    }
                });

            });
        });

    }
    ,

    getPlantillaByConectorSiesa: function (conectorsiesa) {
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
                request.verbose = false;
                request.input("IN_M_CONECTORES_SIESA_ID", sql.Int, conectorsiesa);
                request.execute('POS.SSP_GET_M_CONECTORES_SIESA_BY_CONECTOR',
                    function (err, recordsets, returnValue) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(recordsets);
                        }

                    });

            });
        });
    },

    getEstadosAnticipos(centroOperacion, tipoDocumento, listaConsecutivo) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_CENTRO_OPERACION", sql.VarChar, centroOperacion);
                request.input("IN_TIPO_DOCUMENTO", sql.VarChar, tipoDocumento);
                request.input("IN_LISTA_CONSECUTIVO", sql.VarChar, listaConsecutivo);
                request.execute('POSMADECENTRO.SSP_GET_ESTADOS_ANTICIPOS', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    }
                    resolve(recordsets[0]);
                });

            });
        });
    },

    insertFormaPago(idOrden, forma_pago, forma_pago_grupo, idUsuario, modoAnticipo, valor, consecutivo) {
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
                request.verbose = false;
                request.input("IN_CS_ID_ORDEN", sql.Int, idOrden);
                request.input("IN_CS_ID_MV_ORDEN_PAGO", sql.Int, forma_pago);
                request.input("IN_CS_ID_M_FORMAS_PAGOS_CONTADOS", sql.Int, forma_pago_grupo);
                request.input("IN_ID_USUARIO", sql.Int, idUsuario);
                request.input("IN_SW_ANTICIPO", sql.Bit, modoAnticipo == 1);
                request.input("IN_NUMERO_ANTICIPO", sql.Int, consecutivo);
                request.input("IN_VALOR", sql.VarChar(50), valor);

                request.output('MSG', sql.VarChar(200));
                request.output('CS_MV_ORDEN_PAGO', sql.Int);

                request.execute('POSMADECENTRO.SSP_INSERT_MV_ORDEN_PAGOS', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    }
                    resolve({ data: recordsets[0], MSG: request.parameters.MSG.value });
                });

            });

        });


    },

    getNumeroPedido: function (idCompania, idSucursal, idTipoDocumento, documentoCliente, fecha, nro_orden_venta) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_ID_COMPANIA", sql.Int, idCompania);
                request.input("IN_ID_CO", sql.VarChar, idSucursal);
                request.input("IN_ID_TIPO_DOCTO", sql.VarChar, idTipoDocumento);
                request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, documentoCliente);
                request.input("IN_FECHA", sql.VarChar, fecha); //new Date(moment(fecha, 'YYYYMMDD')) );
                request.input("IN_NRO_ORDEN_VENTA", sql.BigInt, nro_orden_venta);
                request.execute('POSMADECENTRO.SSP_SELECT_ULTIMO_NUMERO_PEDIDO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    }
                    resolve(recordsets[0]);
                });

            });
        });
    },

    getClienteSucursal: function (idCompania, idSucursal, documentoCliente) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_ID_CIA", sql.Int, idCompania);
                request.input("IN_SUCURSAL", sql.VarChar, idSucursal);
                request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, documentoCliente);
                request.execute('POSMADECENTRO.SSP_GET_CLIENTE_SUCURSAL', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    }
                    resolve(recordsets[0]);
                });

            });
        });
    },

    afectarPagoPOS: function (numeroPedido,
        esContado,
        nroItems,
        nroSubitems,
        nroCantidades,
        nroServicios,
        ObjNuevaOrden) {

        return new Promise((resolve, reject) => {
            //solo si es exitosa procedemos a mandar la orden a pendiente por facturar
            //consultamos también el último numero de pedido creado
            //se cambia la orden a pendiente por facturar
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_CS_ID_VENTA", sql.Int, ObjNuevaOrden.ConsecutivoVentas);
                request.input("IN_CS_ID_ORDEN", sql.Int, ObjNuevaOrden.ConsecutivoOrdenInterno);
                request.input("IN_CS_ID_USUARIO", sql.Int, ObjNuevaOrden.IdUsuario);
                request.input("IN_SUBTOTAL_ORDEN_VENTA", sql.Decimal(16, 2),
                    parseFloat(ObjNuevaOrden.TotalesAcumulados.AcumuladosSubTotal).toFixed(2));
                request.input("IN_TOT_IMPUESTO", sql.Decimal(16, 2),
                    parseFloat(ObjNuevaOrden.TotalesAcumulados.AcumuladoImpuestos).toFixed(2));
                request.input("IN_TOT_DESCUENTO", sql.Decimal(16, 2),
                    parseFloat(ObjNuevaOrden.TotalesAcumulados.AcumuladosDescuento).toFixed(2));
                request.input("IN_TOTAL_ORDEN_VENTA", sql.Decimal(16, 2),
                    parseFloat(ObjNuevaOrden.TotalesAcumulados.AcumuladosTotal).toFixed(2));
                request.input("IN_TOT_NRO_ITEM", sql.Int, nroItems);
                request.input("IN_TOT_NRO_SUBITEM", sql.Int, nroSubitems);
                request.input("IN_TOT_CANTIDAD", sql.Decimal(14, 4), nroCantidades);
                request.input("IN_TOT_NRO_SERVICIO", sql.Decimal(7, 2), nroServicios);
                request.input("IN_NUM_PEDIDO", sql.Int, numeroPedido);
                request.input("IN_TIPO_PAGO", sql.VarChar, esContado ? "PC" : "PD");
                request.output("MSG", sql.VarChar);

                request.execute('POSMADECENTRO.SSP_INSERT_PEDIDO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            data: recordsets[0],
                            MSG: request.parameters.MSG.value
                        });
                    }
                });
            });
        });
    }
    ,


    updatecuponesusados: function (listaCupones) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);
                }

                async.each(listaCupones, function (item, callback) {
                    // Stored Procedure
                    var request = new sql.Request(connection);
                    request.verbose = false;
                    request.input("IN_CS_ID_ORDEN", sql.BigInt, item.cs_id_orden);
                    request.input("IN_ITEM", sql.SmallInt, item.item);
                    request.input("IN_SUBITEM", sql.SmallInt, item.subitem);

                    request.output("MSG", sql.VarChar);

                    request.execute('POSMADECENTRO.SSP_UPDATE_M_CUPONES_DESCUENTOS_USADOS', function (err, recordsets, returnValue) {
                        if (err) {
                            callback(err);
                        }
                        callback();
                    });
                }, function (err) {
                    if (err) {
                        reject({
                            error: 'err',
                            MSG: err
                        });
                    }

                    resolve({
                        MSG: "ok"
                    });
                })
            });
        });
    }
    ,

    insertPlantillaConectorSiesa: function (centroOperacion, consecutivoDelaOrden, template) {
        return new Promise((resolve, reject) => {

            config.configBD2.database = CONSTANTES.POSDB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
            });
            var transaction = new sql.Transaction(connection);
            transaction.begin(iniciarTransaccion);

            function iniciarTransaccion(err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    return reject({
                        error: err,
                        MSG: err.message
                    });
                }

                async.each(template, function (item, callback) {

                    var requestConectorSiesa = new sql.Request(transaction);
                    requestConectorSiesa.verbose = false;
                    requestConectorSiesa.input("IN_DT_CONECTORES_SIESA_ID", sql.Int, item.dt_conectores_siesa_id);
                    requestConectorSiesa.input("IN_M_CONECTORES_SIESA_ID", sql.Int, item.m_conectores_siesa_id);
                    requestConectorSiesa.input("IN_NOMBRE", sql.VarChar, item.nombre);
                    requestConectorSiesa.input("IN_VALOR", sql.VarChar, item.valor_defecto);
                    requestConectorSiesa.input("IN_CENTRO_OPERACION", sql.Int, centroOperacion);
                    requestConectorSiesa.input("IN_C_ID_ORDEN", sql.Int, consecutivoDelaOrden);


                    requestConectorSiesa.output('MSG', sql.VarChar(200));

                    requestConectorSiesa.execute('POSMADECENTRO.SSP_INSERT_MV_CONECTORES_SIESA', function (err, recordsets, returnValue) {
                        if (err) {
                            // ... error checks
                            return callback(err.message);
                        } else if (requestConectorSiesa.parameters.MSG.value !== "GUARDADO") {
                            return callback(requestConectorSiesa.parameters.MSG.value);
                        }

                        callback();
                    });
                },
                    function (err) {
                        if (err) {
                            reject({
                                error: "err",
                                MSG: err
                            });
                            transaction.rollback(function (err2) {

                            });
                        } else {

                            transaction.commit(function (err, recordset) {
                                // ... error checks
                                resolve({
                                    data: [],
                                    'MSG': "GUARDADO"
                                });
                                console.log("Transaction commited.");
                            });

                        }
                    });
            }
        });
    },

    getAnticiposRealizados: function (documento_cliente, c_centro_operacion, tipo_anticipo) {
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
                request.verbose = false;
                request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, documento_cliente);
                request.input("IN_C_CENTRO_OPERACION", sql.VarChar, c_centro_operacion);
                request.input("IN_TIPO_ANTICIPO", sql.VarChar, tipo_anticipo);

                request.execute('POSMADECENTRO.SSP_GET_DT_PAGOS_ANTICIPOS', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets);
                    }

                });

            });
        });
    },

    getHistoricoAnticiposClienteGenerados: function (idCia, documento_cliente, tipo_anticipo) {
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
                request.verbose = false;
                request.input("IN_C_COMPANIA", sql.SmallInt, idCia);
                request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, documento_cliente);
                
                if (tipo_anticipo == "RAM" || tipo_anticipo == "RAC") {

                    request.execute('POSMADECENTRO.SSP_SALDO_ANTICIPOS_CONTADO_CLIENTE', function (err, recordsets, returnValue) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(recordsets);
                        }

                    });
                } else if (tipo_anticipo == "R1" || tipo_anticipo == "RC") {

                    request.execute('POSMADECENTRO.SSP_SALDO_ANTICIPOS_CREDITO_CLIENTE', function (err, recordsets, returnValue) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(recordsets);
                        }

                    });
                }

            });
        });
    },

    getConsecutivoManualPv: function (c_centro_operacion) {
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
                request.input("IN_C_CENTRO_OPERACION", sql.VarChar, c_centro_operacion);
                request.output('OUT_C_ANTICIPO_MANUAL_PV', sql.Int);
                request.output('OUT_C_ANTICIPO_CREDITO_MANUAL_PV', sql.Int);

                request.execute('POSMADECENTRO.SSP_GET_CONSECUTIVO_MANUAL_PV', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(request.parameters);
                    }

                });

            });
        });
    },

    getOrdenesVentaByCliente: function (body) {
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
                request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, body.documento_cliente);
                request.input("IN_C_CENTRO_OPERACION", sql.VarChar, body.c_centro_operacion);
                //request.input("IN_TIPO_PAGO", sql.VarChar, body.tipo_pago);

                request.execute('POSMADECENTRO.SSP_GET_ORDENES_VENTA_BY_CLIENTE', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets);
                    }

                });

            });
        });
    },

    getDtOrdenVenta: function (idCia, cs_id_orden) {
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
                request.input("IN_ID_COMPANIA", sql.Char(3), idCia);
                request.input("IN_CS_ID_ORDEN", sql.BigInt, cs_id_orden);

                request.execute('POSMADECENTRO.SSP_GET_DT_ORDEN_VENTA_NOTA_CREDITO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets);
                    }

                });

            });
        });
    },

    getPrefijosFacturaCo: function (c_centro_operacion) {
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
                request.input("IN_C_CENTRO_OPERACION", sql.Char(3), c_centro_operacion);

                request.execute('POSMADECENTRO.SSP_GET_PREFIJOS_FACTURA_CO', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets);
                    }

                });

            });
        });
    },

    getDatosDoctoNotaCreditoGenerada: function (idCia, c_centro_operacion, id_tipo_docto, consec_docto) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;
                request.input("IN_ID_CIA", sql.Char(3), idCia);
                request.input("IN_C_CENTRO_OPERACION", sql.Char(3), c_centro_operacion);
                request.input("IN_ID_TIPO_DOCTO", sql.VarChar, id_tipo_docto);
                request.input("IN_CONSEC_DOCTO", sql.Int, consec_docto);

                request.execute('POSMADECENTRO.SSP_GET_DATOS_DOCTO_NOTA_CREDITO_GENERADA', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets);
                    }
                });
            });
        });
    },
    getVentasDiaMadeclub: function (fecha_analizar) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.UNOEEDLLO;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = false;
                request.input("IN_FECHA_CREACION", sql.VarChar(20), fecha_analizar);

                request.execute('POSMADECENTRO.SSP_GET_VENTAS_DIA_PREVIO_MADECLUB', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ data: recordsets });
                    }

                });

            });
        });
    },
    getLogWSMadeclub: function (fecha_analizar) {
        return new Promise((resolve, reject) => {
            config.configBD2.database = CONSTANTES.CORPORATIVADB;
            var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
                // ... error checks
                if (err) {
                    console.error(err);
                    reject(err);

                }
                // Stored Procedure
                var request = new sql.Request(connection);
                request.verbose = true;

                request.input("FH_CONSULTA_VENTAS_DIA", sql.VarChar(20), fecha_analizar);

                request.execute('CORPORATIVA.SSP_INSERT_MV_FECHA_LOG_WS_MADECLUB_CONSULTADA',
                    function (err, recordsets, returnValue) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ data: recordsets });
                        }

                    });

            });
        });
    },
    get_anticipos_by_documento: function (documento_cliente) {
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
                request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar(50), documento_cliente);

                request.execute('POSMADECENTRO.SSP_GET_ANTICIPOS_BY_DOCUMENTO_CLIENTE', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets);
                    }

                });

            });
        });
    },

    getNotasCreditoAsociadasFactura: function (params) {
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
                request.verbose = false;
                request.input("IN_CS_ID_ORDEN", sql.BigInt, params.idOrden);
                request.input("IN_ID_COMPANIA", sql.Char(3), params.idCia);
                request.input("IN_ID_CO", sql.Char(3), params.centroOperacion);
                request.input("IN_PREFIJO_FACTURA", sql.Char(3), params.prefijoFactura);
                request.input("IN_NUMERO_FACTURA", sql.Int, params.numeroFactura);

                request.execute('POSMADECENTRO.SSP_GET_NOTAS_CREDITO_ASOCIADAS_FACTURA', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets);
                    }

                });

            });
        });
    },

    getNotasCreditoCliente: function (params) {
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
                request.verbose = false;
                request.input("IN_ID_COMPANIA", sql.Char(3), params.idCia);
                request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar(20), params.documentoCliente);
                request.input("IN_TIPO_DOCUMENTO", sql.Char(3), params.tipoDocumento);

                request.execute('POSMADECENTRO.SSP_GET_NOTAS_CREDITO_CLIENTE', function (err, recordsets, returnValue) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsets);
                    }

                });

            });
        });
    },

    /**
     * /estructuras TR
     */
    //insert_productos_creacion_solicitud_tr: function (body) {
    //    return new Promise((resolve, reject) => {

    //        let conexion = utils.clone(config.configBD2);

    //        //Utilizar driver para controlar errores de conversión 
    //        conexion.driver = "msnodesqlv8";
    //        conexion.database = CONSTANTES.POSDB;

    //        let connection = new sql.Connection(conexion);

    //        connection.connect(function (err) {

    //            if (err) {
    //                reject({
    //                    error: err,
    //                    MSG: err.message
    //                });
    //            }

    //            let transaction = new sql.Transaction(connection);

    //            transaction.begin(function (err) {
    //                // ... error checks
    //                if (err) {
    //                    reject({
    //                        error: err,
    //                        MSG: err.message
    //                    });
    //                }

    //                /*elimino la data de la temporal que se encuentre asociada a la ov*/
    //                let request_delete = new sql.Request(transaction);
    //                request_delete.verbose = true;

    //                request_delete.input("IN_CS_ID_ORDEN", sql.BigInt, body.cs_id_orden);
    //                request_delete.output('MSG', sql.VarChar);

    //                request_delete.execute('POSMADECENTRO.SSP_DELETE_TW_PRODUCTOS_CREACION_SOLICITUD_TR', function (err, recordsets, returnValue) {
    //                    if (err) {
    //                        reject({
    //                            error: err,
    //                            MSG: err.message
    //                        });
    //                        transaction.rollback(function (err) {
    //                            // ... error checks
    //                            return;
    //                        });
    //                    } else {

    //                        if (request_delete.parameters.MSG.value !== "OK") {
    //                            reject({
    //                                error: "err",
    //                                MSG: request_delete.parameters.MSG.value
    //                            });
    //                            transaction.rollback(function (err2) {
    //                            });

    //                        } else {

    //                            /* actualizamos el orden de los items en la tbl DT_ORDEN_PRODUCCION*/
    //                            let cantRefsIncompletas = body.data_refs_incompletas.length;
    //                            async.each(body.data_refs_incompletas, function (item, callback) {

    //                                var rq_insert_prod = new sql.Request(transaction);
    //                                rq_insert_prod.verbose = true;
    //                                rq_insert_prod.input('IN_CS_ID_ORDEN'       , sql.BigInt, item.cs_id_orden);
    //                                rq_insert_prod.input("IN_C_BODEGA_ENTRADA"  , sql.VarChar, item.c_bodega_entrada);
    //                                rq_insert_prod.input("IN_C_CENTRO_OPERACION", sql.VarChar, item.c_centro_operacion);
    //                                rq_insert_prod.input("IN_C_REFERENCIA"      , sql.VarChar, item.c_referencia);
    //                                rq_insert_prod.input("IN_C_GRUPO"           , sql.VarChar, item.c_grupo);
    //                                rq_insert_prod.input("IN_C_LINEA"           , sql.VarChar, item.c_linea);
    //                                rq_insert_prod.input("IN_ITEM"              , sql.Int, item.item);
    //                                rq_insert_prod.input("IN_SUBITEM"           , sql.Int, item.subItem);
    //                                rq_insert_prod.input("IN_CANT_OV"           , sql.Decimal(14, 4), item.cantidad_ov);
    //                                rq_insert_prod.input("IN_SALDO"             , sql.Decimal(14, 4), item.saldo);
    //                                rq_insert_prod.input("IN_CANT_REQUERIDA"    , sql.Decimal(14, 4), item.cant_solicitud);
    //                                rq_insert_prod.input("IN_C_BODEGA_PRIORIDAD", sql.VarChar, (item.c_bodega_prioridad || null));

    //                                rq_insert_prod.output("MSG", sql.VarChar);

    //                                rq_insert_prod.execute('POSMADECENTRO.SSP_INSERT_PRODUCTOS_CREACION_SOLICITUD_TR', function (err, recordsets, returnValue) {
    //                                    if (err) {
    //                                        // ... error checks
    //                                        console.log(err)
    //                                        callback(err.message);

    //                                    } else if (rq_insert_prod.parameters.MSG.value !== "OK") {
    //                                        callback(rq_insert_prod.parameters.MSG.value);
    //                                    } else {
    //                                        cantRefsIncompletas--;
    //                                        callback();
    //                                    }

    //                                });
    //                            },
    //                                function (err) {

    //                                    if (err) {
    //                                        reject({
    //                                            error: err,
    //                                            MSG: err.message
    //                                        });
    //                                        transaction.rollback(function (err) {
    //                                            // ... error checks
    //                                            return;
    //                                        });

    //                                    } else {

    //                                        if (cantRefsIncompletas === 0) {

    //                                            //if (body.cs_id_orden !== undefined && body.cs_id_orden !== null && body.cs_id_orden.length > 0) {
                                                    
    //                                            //} else {
                                                    
    //                                            //}


    //                                            //transaction.commit(function () {
    //                                            //    resolve({
    //                                            //        data: [],
    //                                            //        MSG: "OK"
    //                                            //    });
    //                                            //    console.log("Transaction commited.");
    //                                            //});

    //                                            let request = new sql.Request(transaction);
    //                                            request.verbose = true;

    //                                            request.input("IN_CS_ID_ORDEN"                   , sql.BigInt, body.cs_id_orden);
    //                                            request.input("IN_C_CENTRO_OPERACION"            , sql.VarChar, body.c_centro_operacion);
    //                                            request.input("IN_C_ESTADO_SOLICITUD_TRASLADO"   , sql.VarChar, body.c_estado_solicitud_traslado);
    //                                            request.input("IN_C_BODEGA_ENTRADA_CONTRAPARTIDA", sql.VarChar, (body.c_bodega_contrapartida || null));
    //                                            request.input("IN_CS_SOLICITUD_TRASLADO_PADRE"   , sql.VarChar, (body.cs_solicitud_traslado_padre || null));
    //                                            request.input("IN_C_BODEGA_PRIORIDAD"            , sql.VarChar, (body.c_bodega_prioridad || null));
    //                                            request.input('IN_LOG_USER'                      , sql.Int, body.idUsuario);

    //                                            request.output('MSG', sql.VarChar);

    //                                            request.execute('POSMADECENTRO.SSP_INSERT_SOLICITUD_TR', function (err, recordsets, returnValue) {
    //                                                if (err) {
    //                                                    reject({
    //                                                        error: err,
    //                                                        MSG: err.message
    //                                                    });
    //                                                    transaction.rollback(function (err) {
    //                                                        // ... error checks
    //                                                        return;
    //                                                    });
    //                                                } else {

    //                                                    if (request.parameters.MSG.value !== "OK") {
    //                                                        reject({
    //                                                            error: "err",
    //                                                            MSG: request.parameters.MSG.value
    //                                                        });
    //                                                        transaction.rollback(function (err2) {
    //                                                        });

    //                                                    } else {
    //                                                        transaction.commit(function () {
    //                                                            resolve({
    //                                                                data: recordsets,
    //                                                                MSG: "OK"
    //                                                            });
    //                                                            console.log("Transaction commited.");
    //                                                        });
    //                                                    }
    //                                                }
    //                                            });

    //                                        }//fin if (cantRefsIncompletas === 0)
    //                                    }
    //                                });
    //                        }
    //                    }
    //                });
    //            });
    //        });
    //    });
    //},

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

    //get_solicitud_traslado_for_aprobacion_tr: function (params) {
    //    return new Promise((resolve, reject) => {
    //        config.configBD2.database = CONSTANTES.POSDB;
    //        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
    //            // ... error checks
    //            if (err) {
    //                console.error(err);
    //                reject(err);

    //            }
    //            // Stored Procedure
    //            var request = new sql.Request(connection);
    //            request.verbose = true;
    //            request.input("IN_C_BODEGA_ORIGEN", sql.VarChar, params.codigoBodega);

    //            request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_FOR_APROBACION_TR', function (err, recordsets, returnValue) {
    //                if (err) {
    //                    reject(err);
    //                } else {
    //                    resolve({ data: recordsets });
    //                }

    //            });

    //        });
    //    });
    //},

    //get_solicitudes_a_despachar: function (params) {
    //    return new Promise((resolve, reject) => {
    //        config.configBD2.database = CONSTANTES.POSDB;
    //        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
    //            // ... error checks
    //            if (err) {
    //                console.error(err);
    //                reject(err);

    //            }
    //            // Stored Procedure
    //            var request = new sql.Request(connection);
    //            request.verbose = true;
    //            request.input("IN_C_BODEGA_ORIGEN", sql.VarChar, params.codigoBodega);

    //            request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_A_DESPACHAR', function (err, recordsets, returnValue) {
    //                if (err) {
    //                    reject(err);
    //                } else {
    //                    resolve({ data: recordsets });
    //                }

    //            });

    //        });
    //    });
    //},

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

    //get_solicitudes_despachar_by_filtro: function (body) {
    //    return new Promise((resolve, reject) => {
    //        config.configBD2.database = CONSTANTES.POSDB;
    //        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
    //            // ... error checks
    //            if (err) {
    //                console.error(err);
    //                reject(err);

    //            }
    //            // Stored Procedure
    //            var request = new sql.Request(connection);
    //            request.verbose = true;
    //            request.input("IN_C_BODEGA_SALIDA", sql.VarChar, body.CodigoBodega);
    //            request.input("IN_C_ESTADO_SOLICITUD_TRASLADO", sql.VarChar, body.c_estado_solicitud_traslado);

    //            request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_A_DESPACHAR_BY_FILTRO', function (err, recordsets, returnValue) {
    //                if (err) {
    //                    reject(err);
    //                } else {
    //                    resolve({ data: recordsets });
    //                }
    //            });
    //        });
    //    });
    //},

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

    //get_solicitud_traslado_for_aprobacion_tr_by_filtro: function (body) {
    //    return new Promise((resolve, reject) => {
    //        config.configBD2.database = CONSTANTES.POSDB;
    //        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
    //            // ... error checks
    //            if (err) {
    //                console.error(err);
    //                reject(err);

    //            }
    //            // Stored Procedure
    //            var request = new sql.Request(connection);
    //            request.verbose = true;
    //            request.input("IN_C_BODEGA_SALIDA"             , sql.VarChar, body.CodigoBodega);
    //            request.input("IN_C_ESTADO_SOLICITUD_TRASLADO" , sql.VarChar, body.c_estado_solicitud_traslado);

    //            request.input("IN_C_CENTRO_OPERACION_OV"       , sql.VarChar, body.c_centro_operacion_ov);
    //            request.input("IN_ID_ORDEN_CO"                 , sql.VarChar, body.id_orden_co);
    //            request.input("IN_C_CENTRO_OPERACION_SOLICITUD", sql.VarChar, body.c_centro_operacion_solicitante);

    //            request.execute('POSMADECENTRO.SSP_GET_SOLICITUD_TRASLADO_FOR_APROBACION_TR_BY_FILTRO', function (err, recordsets, returnValue) {
    //                if (err) {
    //                    reject(err);
    //                } else {
    //                    resolve({ data: recordsets });
    //                }
    //            });
    //        });
    //    });
    //},

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
    
    
    //get_data_impresion_docto_TR_generado: function (body) {
    //    return new Promise((resolve, reject) => {
    //        config.configBD2.database = CONSTANTES.UNOEE;
    //        var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
    //            // ... error checks
    //            if (err) {
    //                console.error(err);
    //                reject(err);

    //            }
    //            // Stored Procedure
    //            var request = new sql.Request(connection);
    //            //request.verbose = true;

    //            request.input("IN_C_CENTRO_OPERACION", sql.VarChar, body.c_centro_operacion);
    //            request.input("IN_CONSEC_DOCTO_GENERADO", sql.Int, body.consec_docto);

    //            request.execute('POSMADECENTRO.SSP_GET_DATA_IMPRESION_DOCTO_TR_GENERADO', function (err, recordsets, returnValue) {
    //                if (err) {
    //                    reject(err);
    //                } else {
    //                    resolve({ data: recordsets });
    //                }
    //            });
    //        });
    //    });
    //},

    generarGuia : (item ) => {
	    return new Promise((resolve, reject) => {

	   
            
	        //consulta el dia anterior
	        //pos_dao.getLogWSMadeclub(f_proceso)
	        //    .then((resultQuery) => {
	        //        console.log("comprobando si existe registro del log", moment().format("YYYY-MM-DD HH:mm:ss"));

	        //        if (resultQuery.data !== undefined && Array.isArray(resultQuery.data) && resultQuery.data.length === 0) {

	                    console.log("before call ws", moment().format("YYYY-MM-DD HH:mm:ss"))
	
	                    require('jsdom/lib/old-api').env("", function (err, window) {
	                        if (err) {
	                            reject(err);
	                            console.error(err);
	                            return;
	                        }

	                        var $ = require("jquery")(window);
							console.log("call ajax");
							
							var username ='EMPCAR01'
							var password ='EMPCAR1'
							
						    var url = "http://200.69.100.66/ServicioLiquidacionRESTpruebas/Service1.svc/Generacion/"
							var myHeaders = new Headers();
							myHeaders.append("Authorization", 'Basic ' + btoa(username + ":" + password));
							myHeaders.append("Content-Type", "text/json");

	                        //test: http://181.49.143.242/madecentro2/general/index/cargardatos
							//prod: https://www.madecentro.com/general/index/cargardatos

							let cuidadDestino  = item.c_departamento_destino.concat(item.c_municipio)
							
							let objGeneracionGuia =

							{
								"ciudad_origen" : "76892",
								"ciudad	vm.objGeneracionGuia_destino" : cuidadDestino,
								"cod_formapago" : item.c_forma_pago,//4,
								"cod_servicio" : item.c_servicio_envio,//3,
								"num_unidades" : item.unidades,//1,
								"mpesoreal_k" :  item.peso,//10,
								"mpesovolumen_k" : item.volumen,//15,volumenEnvio
								"valor_declarado" : item.costo,//10000,
								"mca_nosabado" : 0,
								"mca_docinternacional" : 0,
								"cod_regional_cta" : 1,
								"cod_oficina_cta" : 1,
								"cod_cuenta" : item.c_cuenta,
								"con_cartaporte" : "0",
								"info_origen" : {
									"nom_remitente" : "RTA DESING",
									"dir_remitente" : "Carrera 15 No. 17 - 28 La Nueva Estancia, Yumbo",
									"tel_remitente" :  "6911700",
									"ced_remitente" : "805026021-8"
								},
								"info_destino" : {
									"nom_destinatario" :  item.nombre_cliente_ecommerce,
									"dir_destinatario" : item.direccion_cliente,
									"tel_destinatario" :  item.telefono_cliente_ecommerce || 0,
									"ced_destinatario" : item.documento_cliente_ecommerce
								},
								"info_contenido" : {
									"dice_contener" : "MUEBLES",
									"texto_guia" : item.observacion,
									"accion_notaguia" :  "0",
									"num_documentos" : item.cs_id_orden_venta_co,
									"centrocosto" : ""
								}
							}

							var raw = JSON.stringify(objGeneracionGuia);


	                        $.post({
	                            url: url,
	                            type: "post",
								data: raw,
								headers: myHeaders,
	                            success: function(resultado) {
	                                console.log("post.success", resultado);
	                                console.log("after success ws", moment().format("YYYY-MM-DD HH:mm:ss"));
	                                resolve({
	                                    res: resultado
	                                });
	                            },
	                            error: function (resultado) {
	                                console.log("post.error", resultado);
	                                console.log("after error ws", moment().format("YYYY-MM-DD HH:mm:ss"));
	                                reject({
	                                    res: resultado
	                                });
	                            }
	                        });
	                    });

	                //} else {
	                //    reject({ message: "Ya existe registro de inserción de transacciones." });
	                //}
	            //});
	    });
	},
    
	programar_envio : () => {
		//consultamos la data
	  //  f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');
		let response_ws = {
		    json_response         : "",
		    listInsertParameter   : [],
		    sw_error              : 0,
		    fh_consulta_ventas_dia: ""//moment().subtract(1, 'day').format('YYYY-MM-DD')
		};
        
		//consulta el dia anterior
	    envios_generacion.getPedidosPorDespachar()
	        .then((resultQuery) => {
	         //   console.log("after get ventas", moment().format("YYYY-MM-DD HH:mm:ss"))
	            if (resultQuery.data !== undefined && Array.isArray(resultQuery.data) && resultQuery.data.length > 0 && resultQuery.data[0].length > 0) {

	                //organizamos el dto
	                let listInsertParameter = [];
	                //   console.log("existe cliente 1152448268")

	                resultQuery.data[0].forEach(item => {
						console.log(item)
						envios_generacion.generarGuia(item)
	                    .then(resultWS => {
	                        console.log(`se ha actualizado la información`, listInsertParameter);
	                        response_ws.json_response = JSON.stringify(resultWS);

	                        console.log("..insert after then")
	                        envios_generacion.insert_guia(response_ws)
                                .then(result => {
                                    console.log(result)
                                })
                                .catch(error => {
                                    console.log(error)
                                });
	                    })
	                    .catch(errWS => {
	                        console.log('ha ocurrido un error mientras se llamaba al ws', errWS);
	                        console.log("listInsertParameter", listInsertParameter);
	                        response_ws.json_response = JSON.stringify(errWS);
	                        response_ws.sw_error = 1;

	                        console.log("..insert after catch")
	                        envios_generacion.insert_guia(response_ws)
                                .then(result => {
                                    console.log(result)
                                })
                                .catch(error => {
                                    console.log(error)
                                });
	                    });
	                });

	                response_ws.listInsertParameter = listInsertParameter;
	                console.log("..proceso terminado")

	                // enviamos al webService las inserciones	
	               
	            } else {
	                console.log('no hay envios para registrar');
	                response_ws.json_response = 'no hay envios para registrar';
	                response_ws.sw_error = 1;

	                // console.log("..insert after error 1")
	                // envios_generacion.insert_h_log_w(response_ws)
                    //     .then(result => {
                    //         console.log(result)
                    //     })
                    //     .catch(error => {
                    //         console.log(error)
                    //     });
	            }

	        })
	        .catch(err => {
	            err.log = "catch: ha ocurrido un error";
	            console.log("ha ocurrido un error ", err);
	            response_ws.json_response = JSON.stringify(err);
	            response_ws.sw_error = 1;

	            // console.log("..insert after error 2")
	            // envios_generacion.insert_h_log_w(response_ws)
	            //     .then(result => {
	            //         console.log(result)
	            //     })
	            //     .catch(error => {
	            //         console.log(error)
	            //     });
	        });

    },
    
    getPedidosPorDespachar: function (body) {
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
                request.verbose = false;
                // request.input("IN_FECHA_CREACION", sql.VarChar(20), fecha_analizar);

                request.execute('POS.SSP_GET_ORDENES_PENDIENTE_ENVIO', function (err, recordsets, returnValue) {
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

module.exports = pos_dao;
