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
var pos_dao        = require('../../dao/pos');
var server = config.serverEmail;
var soap = require('strong-soap').soap;
var moment = require('moment'); 
let xml2js = require("xml2js"); //convierte xml a json





router.get('/getCompanias/:cs_IdUsuario', function (req, res, next) {

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
        request.input("IN_CS_ID_USUARIO", sql.Int, req.params.cs_IdUsuario);
        request.execute('POS.SSP_GET_COMPANIAS', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }

            res.json({
                data : recordsets
            });
        });

    });
});



//AUTENTICAR USUARIO
router.post('/get_autenticar_ususario', function (req, res, next) {
    console.log(req.body);

    var usuario = req.body.usuario;
    var contrasena = req.body.password;

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
        request.input("INUSER", sql.VarChar(30),usuario);
        request.input("INPW", sql.VarChar(30), crypto.createHash('md5').update(contrasena).digest('hex'));
        console.log('la contrasena a validar => ' + crypto.createHash('md5').update(contrasena).digest('hex'));

        request.output('MSG', sql.VarChar);

        request.execute('POS.SSP_AUTENTICARUSUARIO_RTA', function (err, recordsets, returnValue) {
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





router.get('/getClientes/:filtro/:swBuscarClienteEcommerce/:c_compania', function (req, res, next) {

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
        request.input("IN_FILTRO", sql.VarChar, req.params.filtro);
        request.input("IN_SW_CLIENTE_ECOMMERCE", sql.Bit, req.params.swBuscarClienteEcommerce);
        request.input("IN_C_COMPANIA", sql.Int, req.params.c_compania);
        request.output('MSG', sql.VarChar(200));
        request.execute('POS.SSP_GET_CLIENTE_BY_FILTRO', function (err, recordsets, returnValue) {
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





router.get('/getDireccionesCliente/:documento', function (req, res, next) {

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
        request.input("IN_DOCUMENTO", sql.VarChar, req.params.documento);
        request.execute('POS.SSP_GET_DIRECCIONES_CLIENTE_ECOMMERCE', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }

            res.json({
                data : recordsets
            });
        });

    });
});


router.get('/getSucursalesCliente/:documento/:c_compania', function (req, res, next) {

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
        request.input("IN_DOCUMENTO", sql.VarChar, req.params.documento);
        request.input("IN_C_COMPANIA", sql.VarChar, req.params.c_compania);
        request.execute('POS.SSP_GET_SUCURSALES_CLIENTE_ECOMMERCE', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }

            res.json({
                data : recordsets
            });
        });

    });
});







router.get('/get_productos/:filtro/:documentoCliente/:c_compania/:lista_precio', function (req, res, next) {
    console.log(req.params);
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
        request.input("IN_FILTRO", sql.VarChar, req.params.filtro);
        request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, req.params.documentoCliente);
        request.input("IN_C_COMPANIA", sql.Int, req.params.c_compania);
        request.input("IN_LISTA_PRECIO", sql.VarChar, req.params.lista_precio);
        //request.verbose = true;

        request.execute('POS.SSP_GET_PRODUCTOS', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});




router.post('/insertOrdenVenta', function (req, res, next) {
    

    config.configBD2.database = CONSTANTES.POSDB;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
            sql.close();
            return;
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        // request.input("INIDCLIENTE", sql.Int, req.body.csIdCliente);
        request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, req.body.documentoCliente);
        request.input("IN_NOMBRECLIENTE", sql.VarChar, req.body.nombreCliente);
        request.input("IN_ID_SUCURSAL", sql.VarChar, req.body.centroOperacion);
        request.input("IN_ID_BODEGA", sql.VarChar, req.body.bodega);
        request.input("IN_CEDULA", sql.VarChar, req.body.cedulaAsesor);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdusuario);
        request.input("IN_DOCUMENTO_CLIENTE_ECOMMERCE", sql.VarChar, req.body.documentoClienteEcommerce);
        request.input("IN_NOMBRECLIENTE_ECOMMERCE", sql.VarChar, req.body.nombreClienteEcommerce);
        request.input("IN_HORARIO_PEDIDO", sql.VarChar, req.body.horario_pedido);
        request.input("IN_ORDEN_COMPRA", sql.VarChar, req.body.ordenCompraEcommerce);
        request.input("IN_SW_ECOMMERCE", sql.VarChar, req.body.swClienteEcommerce);
        request.input("IN_SW_ABASTECIMIENTO", sql.VarChar, req.body.swAbastecimientoInventario);
        request.input("IN_SW_RECOGE_EN_TIENDA", sql.Bit, req.body.swRecogerTienda);
        request.input("IN_DIRECCION_TIENDA", sql.VarChar, req.body.dSucursalClienteEcommerce);
        request.input("IN_ID_DIRECCION_CLIENTE", sql.VarChar, req.body.IdDireccionClienteEcommerce || null);
        request.input("IN_ID_SUCURSAL_CLIENTE", sql.Int, req.body.IdsucursalCliente || null);
        request.input("IN_ID_DIRECCION_SUCURSAL_CLIENTE", sql.Int, req.body.IdDireccionsucursalCliente || null);
        request.input("IN_ID_MOTIVO", sql.VarChar, req.body.idMotivo || null);
        request.input("IN_TIPO_PEDIDO", sql.Int, req.body.c_tipo_pedido || null);
        request.input("IN_C_COMPANIA", sql.Int, req.body.c_compania);

        request.output("MSG", sql.VarChar);
        request.output("OUTIDORDEN", sql.BigInt);
        request.output("OUTIDORDENCO", sql.BigInt);
        request.output("OUTIDVENTAS", sql.BigInt);
        request.output("OUTLISTAPRECIO", sql.VarChar);
        request.execute('POS.SSP_INSERT_NUEVA_ORDEN_DE_VENTA', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
                sql.close();
                return;
            }

            res.json({
                data : recordsets,
                'MSG': request.parameters.MSG.value,
                'OUTIDORDEN': request.parameters.OUTIDORDEN.value,
                'OUTIDVENTAS': request.parameters.OUTIDVENTAS.value,
                'OUTIDORDENCO': request.parameters.OUTIDORDENCO.value,
                'OUTLISTAPRECIO': request.parameters.OUTLISTAPRECIO.value
            });
            sql.close();
        });
    });
});









router.post('/comprometerOrdenVenta', function (req, res, next) {
    

    config.configBD2.database = CONSTANTES.POSDB;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
            sql.close();
            return;
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_CS_ID_ORDEN", sql.BigInt, req.body.csIdOrden);
        request.input("IN_ID_SUCUERSAL_CARTERA", sql.VarChar, req.body.idSucursalCartera);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdusuario);

        request.output("MSG", sql.VarChar);
        request.execute('POS.SSP_UPDATE_COMPROMETER_ORDEN_DE_VENTA', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
                sql.close();
                return;
            }

            res.json({
                data : recordsets,
                'MSG': request.parameters.MSG.value
            });
            sql.close();
        });
    });
});









router.post('/anularOrdenVenta', function (req, res, next) {
    

    config.configBD2.database = CONSTANTES.POSDB;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
            sql.close();
            return;
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_CS_ID_ORDEN", sql.BigInt, req.body.csIdOrden);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdusuario);

        request.output("MSG", sql.VarChar);
        request.execute('POS.SSP_UPDATE_ANULAR_ORDEN_DE_VENTA', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
                sql.close();
                return;
            }

            res.json({
                data : recordsets,
                'MSG': request.parameters.MSG.value
            });
            sql.close();
        });
    });
});





router.post('/descomprometerOrdenVenta', function (req, res, next) {
    

    config.configBD2.database = CONSTANTES.POSDB;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
            sql.close();
            return;
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_CS_ID_ORDEN", sql.BigInt, req.body.csIdOrden);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdusuario);

        request.output("MSG", sql.VarChar);
        request.execute('POS.SSP_UPDATE_DESCOMPROMETER_ORDEN_DE_VENTA', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
                sql.close();
                return;
            }

            res.json({
                data : recordsets,
                'MSG': request.parameters.MSG.value
            });
            sql.close();
        });
    });
});



router.post('/inserGuiaDespacho', function (req, res, next) {
    

    config.configBD2.database = CONSTANTES.POSDB;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
            sql.close();
            return;
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_CS_ID_ORDEN", sql.BigInt, req.body.cs_id_orden);
        request.input("IN_NRO_GUIA", sql.VarChar, req.body.nroGuia);
        request.input("IN_URL_GUIA", sql.VarChar, req.body.UrlGuia);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdusuario);
        request.input("IN_TRANSPORTADORA", sql.Int, req.body.transportadora);
        request.input("IN_TIPO_ENVIO", sql.Int, req.body.tipoEnvio);

        request.output("MSG", sql.VarChar);
        request.execute('POS.SSP_INSERT_GUIA_DESPACHO', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
                sql.close();
                return;
            }

            res.json({
                data : recordsets,
                'MSG': request.parameters.MSG.value
            });
            sql.close();
        });
    });
});








router.post('/insert_nuevo_producto_orden_venta', function (req, res) {

    config.configBD2.database = CONSTANTES.POSDB;
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            sql.close();
            return res.json({
                error: err,
                MSG: err.message
            });
        }

        /*guardamos el item*/
        var request = new sql.Request(transaction);
        request.verbose = true;

        request.input('IN_CS_ID_VENTA', sql.Int, req.body.cs_id_venta);
        request.input('IN_ITEM', sql.Int, req.body.nro_item);
        request.input('IN_SUBITEM', sql.Int, req.body.sub_item);
        request.input("IN_REFERENCIA_PRODUCTO", sql.VarChar, req.body.c_referencia);
        request.input("IN_CANTIDAD", sql.Decimal(14, 4), req.body.cantidad);
        request.input("IN_PJ_DESCUENTO", sql.Decimal(5, 2), req.body.descuento);
        request.input("IN_PJ_IMPUESTO", sql.Decimal(5, 2), req.body.iva);
        request.input("IN_VR_UNITARIO", sql.Decimal(16, 2), req.body.valor_unitario);
        request.input("IN_VR_IMPUESTO", sql.Decimal(16, 2), req.body.total_iva);
        request.input("IN_VR_DESCUENTO", sql.Decimal(16, 2), req.body.total_descuento);
        request.input("IN_SUBTOTAL", sql.Decimal(16, 2), req.body.sub_total);
        request.input("IN_TOTAL", sql.Decimal(16, 2), req.body.total);
        request.input("IN_UNIDAD_MEDIDA", sql.VarChar, req.body.unidad_medida);
        request.input("IN_DESCRIPCION_REFERENCIA", sql.VarChar, req.body.d_referencia);
        // request.input("IN_C_GRUPO", sql.Char(10), req.body.c_grupo);
        // request.input("IN_C_LINEA", sql.Char(10), req.body.c_linea); 
        // request.input("IN_C_SUBLINEA", sql.Char(10), req.body.c_sublinea);
        // request.input("IN_C_PROVEEDOR", sql.Char(10), req.body.c_proveedor);
        request.input('IN_ROWID_REFERENCIA', sql.Int, req.body.rowid_referencia);
        request.input('IN_ID_LOG_USER', sql.Int, req.body.log_insert);

        request.output('MSG', sql.VarChar);
        
        request.execute('POS.SSP_INSERT_NUEVO_PRODUCTO_ORDEN_VENTA', function (err, recordsets, returnValue) {
            if (err) {
                transaction.rollback(function (err) {
                });
                res.json({
                    error: err,
                    MSG: err.message
                });
                sql.close();

            } else {

                if (request.parameters.MSG.value !== "OK") {

                    transaction.rollback(function (err2) { // ... error checks
                    });
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value
                    });
                    sql.close();
                } else {
                    transaction.commit(function (err, recordset) {
                        console.log("Transaction commited.");

                        res.json({
                            data: recordsets,
                            'MSG': request.parameters.MSG.value
                        });
                        sql.close();
                    });
                }
            }
        });
    });
});



router.get('/getDetallesOrden/:consecutivoOrden', function (req, res, next) {

    config.configBD2.database = CONSTANTES.POSDB;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            res.json(err);
            console.error(err);
            return;
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_CS_ID_ORDEN", sql.Int, req.params.consecutivoOrden);

        request.execute('POS.SSP_GET_H_DETALLEVENTAS_BY_CS_ID_ORDEN', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            } else {
                res.json({
                    data: recordsets
                });
            }

        });
    });

});




//inserta orden de veenta
router.post('/insertOrdenVenta_1', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.POSDB;
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
        request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, req.body.documentoCliente);
        request.input("IN_TIPO_PEDIDO", sql.VarChar, req.body.tipoPedido);
        request.input("IN_NUMERO_PEDIDO", sql.Int, req.body.nroPedido);
        request.input("IN_CLIENTE_PEDIDO", sql.VarChar, req.body.nombreCliente);
        request.input("IN_CLIENTE_ECOMMERCE", sql.VarChar, req.body.clienteEcommerce);
        request.input("IN_DIRECCION_CLIENTE", sql.VarChar, req.body.direccionCliente);
        request.input("IN_DOCUMENTO_CLIENTE_ECOMMERCE", sql.VarChar, req.body.documentoClienteEcommerce);
        // request.input("IN_FECHA_PEDIDO", sql.DateTime, req.body.fechaPedido);
        request.input("IN_C_CENTRO_OPERACION", sql.VarChar, req.body.centroOperacion);
        request.input("IN_ESTADO_PEDIDO_UNOEE", sql.VarChar, req.body.estadoPedido);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);

        request.output("MSG", sql.VarChar);

        request.execute('LOGISTICA.SSP_INSERT_PEDIDO_ECOMMERCE', function (err, recordsets, returnValue) {
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








router.get('/getpaisdepartamentociudad', function (req, res, next) {

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
        request.execute('POS.SSP_POS_GETDATAPAISDEPTOCIUDAD', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });

});





router.get('/getTiposDocumentos', function (req, res, next) {

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
        request.execute('CRM.SSP_GET_TIPOS_DOCUMENTOS', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });

});




router.get('/getTiposPedidos', function (req, res, next) {

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
        request.execute('POS.SSP_GET_TIPO_PEDIDO', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });

});





















router.get('/getClientesEcommerce/:c_compania', function (req, res, next) {

    //return;
    config.configBD2.database = CONSTANTES.CRMBD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("IN_C_COMPANIA", sql.Int, req.params.c_compania);
        request.execute('CRM.SSP_GET_CLIENTES', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});





router.post('/insertCliente', function (req, res, next) {
    
    var correo =  req.body.correo;

    config.configBD2.database = CONSTANTES.CRMBD;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
            sql.close();
            return;
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        // request.input("INIDCLIENTE", sql.Int, req.body.csIdCliente);
        request.input("INDOCUMENTOCLIENTE", sql.VarChar, req.body.documento);
        request.input("INNOMBRES", sql.VarChar, req.body.nombres);
        request.input("INAPELLIDOS", sql.VarChar, req.body.apellidos || "");
        request.input("INCELULAR", sql.VarChar, req.body.celular);
        request.input("INTELEFONO", sql.VarChar, req.body.telefono);
        request.input("INCORREO", sql.VarChar, req.body.correo);
        request.input("INDIRECCION", sql.VarChar, req.body.direccion);
        request.input("INPAIS", sql.VarChar, req.body.direccion_pais);
        request.input("INDEPARTAMENTO", sql.VarChar, req.body.direccion_dpto);
        request.input("INCUIDAD", sql.VarChar, req.body.direccion_cuidad);
        request.input("INIDUSUARIO", sql.Int, req.body.csIdUsuario);
        request.input("INTIPODOCUMENTO", sql.Int, req.body.tipoDocumento || null);

        request.output("MSG", sql.VarChar);
        request.execute('CRM.SSP_INSERT_CLIENTE', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
                sql.close();
                return;
            }

            res.json({
                data : recordsets,
                'MSG': request.parameters.MSG.value
            });
            sql.close();
        });
    });
});







router.post('/updateCliente', function (req, res, next) {
    

    config.configBD2.database = CONSTANTES.CRMBD;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
            sql.close();
            return;
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
         request.input("INIDCLIENTE", sql.Int, req.body.csIdCliente);
        request.input("INDOCUMENTOCLIENTE", sql.VarChar, req.body.documento);
        request.input("INNOMBRES", sql.VarChar, req.body.nombres);
        request.input("INAPELLIDOS", sql.VarChar, req.body.apellidos || "");
        request.input("INCELULAR", sql.VarChar, req.body.celular);
        request.input("INTELEFONO", sql.VarChar, req.body.telefono);
        request.input("INCORREO", sql.VarChar, req.body.correo);
        request.input("INDIRECCION", sql.VarChar, req.body.direccion);
        request.input("INSWACTIVO", sql.VarChar, req.body.sw_activo);
        request.input("INIDUSUARIO", sql.Int, req.body.csIdUsuario);
        request.input("INTIPODOCUMENTO", sql.Int, req.body.tipoDocumento || null);

        request.output("MSG", sql.VarChar);
        request.execute('CRM.SSP_UPDATE_CLIENTE', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
                sql.close();
                return;
            }

            res.json({
                data : recordsets,
                'MSG': request.parameters.MSG.value
            });
            sql.close();
        });
    });
});





router.get('/consultarPedidosEcommerce/:documentoCliente/:nroPedido', function (req, res, next) {
    console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.LOGISTICABD;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        request.input("INDOCUMENTOCLIENTE", sql.VarChar, req.params.documentoCliente);
        request.input("INNROPEDIDO", sql.VarChar, req.params.nroPedido || null);
        //request.verbose = true;

        request.execute('LOGISTICA.SSP_GET_PEDIDOS_ECOMMERCE', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});





router.get('/getFormasPagoenvio', function (req, res, next) {

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
        request.execute('POS.SSP_GET_FORMAS_PAGO_ENVIO', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});







//UPDATE DISENO SOLICTUD
router.post('/insertPedido', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.LOGISTICABD;
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
        request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, req.body.documentoCliente);
        request.input("IN_TIPO_PEDIDO", sql.VarChar, req.body.tipoPedido);
        request.input("IN_NUMERO_PEDIDO", sql.Int, req.body.nroPedido);
        request.input("IN_CLIENTE_PEDIDO", sql.VarChar, req.body.nombreCliente);
        request.input("IN_CLIENTE_ECOMMERCE", sql.VarChar, req.body.clienteEcommerce);
        request.input("IN_DIRECCION_CLIENTE", sql.VarChar, req.body.direccionCliente);
        request.input("IN_DOCUMENTO_CLIENTE_ECOMMERCE", sql.VarChar, req.body.documentoClienteEcommerce);
        // request.input("IN_FECHA_PEDIDO", sql.DateTime, req.body.fechaPedido);
        request.input("IN_C_CENTRO_OPERACION", sql.VarChar, req.body.centroOperacion);
        request.input("IN_ESTADO_PEDIDO_UNOEE", sql.VarChar, req.body.estadoPedido);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);

        request.output("MSG", sql.VarChar);

        request.execute('LOGISTICA.SSP_INSERT_PEDIDO_ECOMMERCE', function (err, recordsets, returnValue) {
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






router.get('/getOrdenesVenta/:cs_IdUsuario/:c_compania', function (req, res, next) {

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
        request.input("IN_CS_ID_USUARIO", sql.Int, req.params.cs_IdUsuario);
        request.input("IN_C_COMPANIA", sql.Int, req.params.c_compania);

        request.execute('POS.SSP_GET_H_ORDENES', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });


});




router.get('/getOrdenesVentaByestado/:cs_IdUsuario/:Estado/:c_compania', function (req, res, next) {

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
        request.input("IN_CS_ID_USUARIO", sql.Int, req.params.cs_IdUsuario);
        request.input("IN_ESTADO", sql.VarChar, req.params.Estado);
        request.input("IN_C_COMPANIA", sql.Int, req.params.c_compania);

        request.execute('POS.SSP_GET_H_ORDENES_BY_ESTADO', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });


});



router.post('/delete_item_ov', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.POSDB;
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
        request.input("IN_CS_ID_MV_VENTAS", sql.BigInt, req.body.cs_mv_ventas);
     

        request.output("MSG", sql.VarChar);

        request.execute('POS.SSP_DELETE_ITEM_ORDEN_VENTA', function (err, recordsets, returnValue) {
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



router.post('/update_item_ov', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.POSDB;
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
        request.input("IN_CS_ID_MV_VENTAS", sql.BigInt, req.body.cs_mv_ventas);
        request.input("IN_CANTIDAD", sql.Int, req.body.cantidad);
        request.input("IN_CS_ID_USUARIO", sql.Int, req.body.cs_IdUsuario);

        request.output("MSG", sql.VarChar);

        request.execute('POS.SSP_UPDATE_ITEM_ORDEN_VENTA', function (err, recordsets, returnValue) {
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


router.post('/update_cliente_ov', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.POSDB;
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
        request.input("IN_CS_ID_ORDEN", sql.BigInt, req.body.csIdOrden);
        request.input("IN_SW_CLIENTE_ECOMMERCE", sql.Bit, req.body.swClienteEcommerce);
        request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, req.body.documentoCliente);
        request.input("IN_NOMBRE_CLIENTE", sql.VarChar, req.body.nombrecliente);
        request.input("IN_CS_ID_USUARIO", sql.Int, req.body.cs_IdUsuario);

        request.output("MSG", sql.VarChar);

        request.execute('POS.SSP_UPDATE_CLIENTE_ORDEN_VENTA', function (err, recordsets, returnValue) {
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


































// ===================================================================================================================






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
                           requestDt.input("IN_COLORES", sql.VarChar, item.ALTO);
                           requestDt.input("IN_HERRAJES", sql.VarChar, item.HERRAJES);
                           requestDt.input("IN_TIPO_TABLERO", sql.VarChar, item.TIPO_TABLERO);
                           requestDt.input("IN_ESPESOR", sql.VarChar, item.ESPESOR);
                           requestDt.input("IN_CANTO", sql.VarChar, item.CANTO);
                           requestDt.input("IN_FUNCION", sql.VarChar, item.FUNCION);
                           requestDt.input("IN_REQUERIMIENTOS", sql.VarChar, item.REQUERIMIENTOS);
                           requestDt.input("IN_NOMBRE_ACTUAL", sql.VarChar, item.NOMBRE_ACTUAL);
                           requestDt.input("IN_REFERENCIA", sql.VarChar, item.REFERENCIA);

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
        request.input("IN_COSTO", sql.VarChar, req.body.costo);
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
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);

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
        request.input("IN_BASE", sql.Int, req.body.base);
        request.input("IN_ALTURA", sql.Int, req.body.altura);
        request.input("IN_CANTO_ARRIBA", sql.VarChar, req.body.cantoArriba);
        request.input("IN_CANTO_ABAJO", sql.VarChar, req.body.cantoAbajo);
        request.input("IN_CANTO_IZQUIERDA", sql.VarChar, req.body.cantoIzquierda);
        request.input("IN_CANTO_DERECHA", sql.VarChar, req.body.cantoDerecha);
        request.input("IN_SW_PREPROCESO", sql.Bit, req.body.swPreproceso);
        request.input("IN_ID_PREPROCESO", sql.VarChar, req.body.idPreproceso || null);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);
        request.input("IN_REFERENCIA", sql.VarChar, req.body.referenciaProducto);
        request.input("IN_SW_ROTA", sql.Bit, req.body.swRota);
        request.input("IN_SW_PUERTA", sql.Bit, req.body.swPuerta);

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



router.get('/get_costos_mueble/:csIdDiseno', function (req, res, next) {
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

        request.execute('DISENO.SSP_GET_COSTOS_MUEBLE', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
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
        request.input("IN_BASE", sql.Int, req.body.base);
        request.input("IN_ALTURA", sql.Int, req.body.altura);
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
        request.input("IN_CS_ID_DT_DISENO", sql.BigInt, req.body.csIdDtDiseno);
        request.input("IN_REFERENCIA", sql.VarChar, req.body.referencia);
        request.input("IN_CANTIDAD", sql.Int, req.body.cantidad);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);

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
        request.input("IN_CANTIDAD", sql.Int, req.body.cantidad);
        // request.input("IN_ALTO", sql.Int, req.body.alto || null);
        // request.input("IN_ANCHO", sql.Int, req.body.ancho || null);
        // request.input("IN_LARGO", sql.Int, req.body.largo || null);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdUsuario);

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




router.post('/postsendemail', function (req, res, next) {

    //consultamos el id de la plantilla necesitada
    //consultamos la plantilla en base al id obtenido
    //adjuntamos plantilla, creamos pdf y enviamos correo
    var plantillaEmail = {};
    async.series([
            function (callback) {
                pos_dao.getParametros("POS_PLANTILLA_EMAIL_COTIZACION", callback);
            },
            function (callback) {
                console.log("RESULTS_POS_DAO[0][0].vr_parametro", pos_dao.RESULTS_POS_DAO[0][0].vr_parametro);
                pos_dao.getPlantilla(pos_dao.RESULTS_POS_DAO[0][0].vr_parametro, callback);
            },
            function (callback) {
                pos_dao.getParametros("REQ_UNIDAD_SGD", callback);
            }
    ],
        function (err, results) {
            if (err) {
                //res.status(err.status || 500);
                return res.json({
                    error: err,
                    MSG  : err.message
                });
            } else {
                plantillaEmail = results[1].data[0][0];
                console.log("obj plantilla", results[1].data[0]);
                pathBaseGestionDocumental = results[2].data[0][0].vr_parametro;
                //console.log("results[0]", results[0]);
                //creamos el PDF
                //leemos los parámetros de la petición
                //email
                var mensaje = "paso1";
                var correo  = req.body.correos;
                console.log("email es: ", correo);


                plantillaEmail.plantilla = plantillaEmail.plantilla.replace(/{{nombre_cliente}}/g, req.body.nombre_cliente);
                plantillaEmail.plantilla = plantillaEmail.plantilla.replace(/{{email_asesor}}/g, req.body.email_asesor);

                //creamos el PDF
                pathBaseGestionDocumental = 'C:'

                var pathpdf = pathBaseGestionDocumental + '/SGD/temporal.pdf';
                var options = {
                    filename: pathpdf,
                    format  : 'Letter'
                };
                mensaje     = "se va a crear pdf";


                fs.readFile('./views/cotizacion.html', function callback(err, data) {
                    if (err) res.json(err);

                    var templateHtml = data.toString();

                    var contenido = req.body.template;

                    //reemplazamos el valor de la plantilla básica
                    templateHtml = templateHtml.replace(/{{contenidoToPdf}}/g, contenido);

                    pdf.create(templateHtml, options).toFile(function (err, responseCreate) {
                        if (err) {
                            console.log(err);
                            return res.json(err);
                        } else {
                            console.log(responseCreate);
                            //guardamos una referencia del PDF  y lo guardamos en gestión documental
                            //enviamos el correo con el pdf adjunto
                            server.send({
                                text      : ' ',
                                from      : 'Cotizaciones RTA',
                                to        : correo,
                                subject   : plantillaEmail.asunto_email + req.body.nombre,
                                attachment: [{
                                    path: pathpdf,
                                    name: 'cotizacion.pdf'
                                }, {
                                    data       : plantillaEmail.plantilla,
                                    alternative: true
                                }]
                            }, function (err, message) {
                                console.log("mensaje enviado?");
                                if (err) {
                                    res.json({
                                        err: err,
                                        message: message
                                    });
                                    return;
                                }
                                mensaje = "se mandó correo";
                                console.log(message);
                                res.json({
                                    "MSG"    : "OK",
                                    "message": message
                                });
                            });


                        }
                    });

                });
            }
        });
});





router.get('/getEmalCliente/:documentoCliente', function (req, res, next) {

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
        request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar(20), req.params.documentoCliente);

        request.execute('POS.SSP_GET_EMAIL_CLIENTE', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });


});





router.get('/getOrdenesHistorico/:csIdUsuario/:year/:month/:c_tipo_pedido/:c_compania', function (req, res, next) {
    console.log(req.params);
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
        request.input("IN_CS_ID_USUARIO", sql.Int, req.params.csIdUsuario);
        request.input("IN_ANIO", sql.Int, req.params.year);
        request.input("IN_MES", sql.Int, req.params.month);
        request.input("IN_C_COMPANIA", sql.Int, req.params.c_compania);
        request.input("IN_C_TIPO_PEDIDO", sql.Int, req.params.c_tipo_pedido);
        

        //request.verbose = true;

        request.execute('POS.GET_ORDENES_HISTORICO', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });


    });
});







router.post('/insertArchivosPlanos_1', function (req, res, next) {

    console.log(req.body);
    
        config.configBD2.database = CONSTANTES.POSDB;
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
    
                /*eliminar la ref de la tabla*/
                request.verbose = true;
                request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, req.body.solicitud.documentoCliente);
                request.input("IN_NOMBRECLIENTE", sql.VarChar, req.body.solicitud.nombreCliente);
                request.input("IN_ID_USUARIO", sql.INT, req.body.solicitud.csIdUsuario);
                request.input("IN_DOCUMENTO_CLIENTE_ECOMMERCE", sql.VarChar, item.CEDULA_CLIENTE);
                request.input("IN_NOMBRECLIENTE_ECOMMERCE", sql.VarChar, item.NOMBRE_CLIENTE);
                request.input("IN_ORDEN_COMPRA", sql.VarChar, item.NRO_OC);
                request.input("IN_DIRECCION_CLIENTE", sql.VarChar, item.DIRECCION_CLIENTE);
                request.input("IN_DEPARTAMENTO", sql.VarChar, item.DEPARTAMENTO_CLIENTE);
                request.input("IN_CUIDAD", sql.VarChar, item.CUIDAD_CLIENTE);
                request.input("IN_TIPO_PEDIDO", sql.VarChar, req.body.solicitud.tipoPedido);
                request.input("IN_REFERENCIA", sql.VarChar, item.C_PRODUCTO);

                request.input("IN_EAN", sql.VarChar, item.CODIGO_BARRAS);
                request.input("IN_CANTIDAD", sql.Decimal(16,2), item.CANTIDAD);
            
    
                request.output('MSG', sql.VarChar(200));
    
                request.execute('POS.SSP_INSERT_ORDENES_ARCHIVO_PLANO', function (err, recordsets, returnValue) {
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
    
    

//  NUEVA LOGICA 

router.post('/insertArchivosPlanos', function (req, res) {

    config.configBD2.database = CONSTANTES.POSDB;
    var connection = new sql.Connection(utils.clone(config.configBD2),
        function (err) {
        });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            res.json({
                error: err,
                MSG: err.message
            });
            res.end();
            return;
        }

        const tableDatos = new sql.Table();


        tableDatos.columns.add("documento_cliente", sql.VarChar);
        tableDatos.columns.add("nombre_cliente", sql.VarChar);
        tableDatos.columns.add("cs_id_usuario", sql.Int);
        tableDatos.columns.add("documento_cliente_ecommerce", sql.VarChar);
        tableDatos.columns.add("nombre_cliente_ecommerce", sql.VarChar);
        tableDatos.columns.add("orden_compra", sql.VarChar);
        tableDatos.columns.add("direccion_cliente", sql.VarChar);
        tableDatos.columns.add("c_departamento", sql.VarChar);
        tableDatos.columns.add("c_cuidad", sql.VarChar);
        tableDatos.columns.add("c_tipo_pedido", sql.VarChar);
        tableDatos.columns.add("referencia", sql.VarChar);
        tableDatos.columns.add("codigo_barras", sql.VarChar);
        tableDatos.columns.add("cantidad", sql.Decimal(14, 2));
        tableDatos.columns.add("observacion", sql.VarChar);
        tableDatos.columns.add("c_tienda", sql.VarChar);
        tableDatos.columns.add("telefono_cliente", sql.VarChar);
        tableDatos.columns.add("c_sucursal", sql.VarChar);


        req.body.detalle.forEach(item => {

            item.OBSERVACION       = item.OBSERVACION.replace('|','')
            item.DIRECCION_CLIENTE = item.DIRECCION_CLIENTE.replace('|','')
            item.OBSERVACION       = item.OBSERVACION.replace(',','')
            item.DIRECCION_CLIENTE = item.DIRECCION_CLIENTE.replace(',','')

            tableDatos.rows.add(
                req.body.solicitud.documentoCliente.trim(),
                req.body.solicitud.nombreCliente.trim(),
                req.body.solicitud.csIdUsuario,
                item.CEDULA_CLIENTE.replace('"',''),
                item.NOMBRE_CLIENTE.replace('"',''),
                item.NRO_OC,
                item.DIRECCION_CLIENTE.replace('"',''),
                item.DEPARTAMENTO_CLIENTE || '',
                item.CUIDAD_CLIENTE.replace('"',''),
                req.body.solicitud.tipoPedido,
                item.C_PRODUCTO.replace('"',''),
                item.CODIGO_BARRAS,
                item.CANTIDAD,
                item.OBSERVACION || '',
                item.C_TINDA,
                item.TELEFONO_CLIENTE || '',
                item.SUCURSAL || '42'
            );


        });

        const request = new sql.Request(transaction);
        request
            .input("IN_DATA_OV", tableDatos)
            .input("IN_TIPO_PEDIDO", sql.Int, req.body.solicitud.tipoPedido)
            .input("IN_FORMATO", sql.Int, req.body.solicitud.c_formato_archivo)
            .input("IN_LOG_INSERT", sql.Int, req.body.solicitud.csIdUsuario)
            .output("MSG", sql.VarChar)

            .execute('POS.SSP_INSERT_OV_FROM_PLANO_CEN',
            function (err, recordsets, returnValue) {
                if (err) {
                    console.log(err);
                    transaction.rollback(function (err) {
                    });
                    res.json({
                        error: err,
                        MSG: err.message
                    });
                    res.end();
                    return;
                }

                if (request.parameters.MSG.value !== "OK") {

                    transaction.rollback(function (err2) { // ... error checks
                    });
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value
                    });
                    res.end();

                } else {
                    transaction.commit(function (err, recordset) {
                        console.log("Transaction commited.");

                        res.json({
                            data: recordsets,
                            'MSG': request.parameters.MSG.value
                        });
                        res.end();
                    });
                }
            });
    });
});













    router.post('/insertArchivosPlanosReferencias', function (req, res, next) {

        console.log(req.body);
        
            config.configBD2.database = CONSTANTES.POSDB;
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
                    request.input("IN_CS_ID_VENTA", sql.VarChar, req.body.solicitud.cs_id_venta);
                    request.input("IN_CS_ID_ORDEN", sql.VarChar, req.body.solicitud.cs_id_orden);
                    request.input("IN_REFERENCIA", sql.VarChar, item.REFERENCIA);
                    request.input("IN_CANTIDAD", sql.Decimal(16,2), item.CANTIDAD);
                    request.input("IN_ID_USUARIO", sql.INT, req.body.solicitud.csIdUsuario);
                    request.output('MSG', sql.VarChar(200));
        
                    request.execute('POS.SSP_INSERT_REFERENCIAS_ARCHIVO_PLANO', function (err, recordsets, returnValue) {
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
        
        
    



    router.post('/insertDireccionCliente', function (req, res, next) {
    
        var correo =  req.body.correo;
    
        config.configBD2.database = CONSTANTES.CRMBD;
        var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
            // ... error checks
            if (err) {
                console.error(err);
                res.json(err);
                sql.close();
                return;
            }
            // Stored Procedure
            var request     = new sql.Request(connection);
            request.verbose = false;
            request.input("INDOCUMENTOCLIENTE", sql.VarChar, req.body.documentoClienteEcommerce);
            request.input("INDIRECCION", sql.VarChar, req.body.direccion);
            request.input("INPAIS", sql.VarChar, req.body.pais);
            request.input("INDEPARTAMENTO", sql.VarChar, req.body.depto);
            request.input("INCUIDAD", sql.VarChar, req.body.cuidad);
            request.input("INIDUSUARIO", sql.Int, req.body.csIdUsuario);
    
            request.output("MSG", sql.VarChar);
            request.output("OUT_ID", sql.BigInt);
            request.execute('CRM.SSP_INSERT_DIRECCION_CLIENTE', function (err, recordsets, returnValue) {
                if (err) {
                    res.json(err);
                    sql.close();
                    return;
                }
    
                res.json({
                    data : recordsets,
                    'MSG': request.parameters.MSG.value,
                    'OUT_ID':request.parameters.OUT_ID.value
                });
                sql.close();
            });
        });
    });
    





   


router.post('/updateDireccionClienteOv', function (req, res, next) {
    

    config.configBD2.database = CONSTANTES.POSDB;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
            sql.close();
            return;
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_CS_ID_ORDEN", sql.BigInt, req.body.cs_id_orden);
        request.input("IN_ID_DIRECCION", sql.VarChar, req.body.id_direccion);
        request.input("IN_CS_ID_USUARIO", sql.Int, req.body.cs_IdUsuario);

        request.output("MSG", sql.VarChar);
        request.execute('POS.SSP_UPDATE_DIRECCION_CLIENTE_OV', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
                sql.close();
                return;
            }

            res.json({
                data : recordsets,
                'MSG': request.parameters.MSG.value
            });
            sql.close();
        });
    });
});



router.post('/updateEstadoGuiaEnvia', function (req, res, next) {
    

    config.configBD2.database = CONSTANTES.POSDB;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
            sql.close();
            return;
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_CS_ID_ORDEN", sql.BigInt, req.body.cs_id_orden);
        request.input("IN_ESTADO_ENVIA", sql.Int, req.body.c_estado_envia);
        request.input("IN_ID_USUARIO", sql.Int, req.body.csIdusuario);

        request.output("MSG", sql.VarChar);
        request.execute('POS.SSP_UPDATE_ESTADO_ENVIA', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
                sql.close();
                return;
            }

            res.json({
                data : recordsets,
                'MSG': request.parameters.MSG.value
            });
            sql.close();
        });
    });
});





router.post('/programar_envio', function (req, res, next) {
    
    envios_generacion.programar_envio();
});




router.get('/getPlantillaByConectorSiesa/:conectorsiesa', function (req, res, next) {

    pos_dao.getPlantillaByConectorSiesa(req.params.conectorsiesa)
        .then(result => {
            res.json({
                MSG: "OK",
                data: result
            });
        })
        .catch(err => {
            console.error(err);
            res.json({
                MSG: "ERROR",
                error: err
            });
        });
});



router.post('/getnroregistrosfactura', function (req, res, next) {
    
    config.configBD2.database = CONSTANTES.POSDB;
    var connection            = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
            sql.close();
            return;
        }

        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        //request.multiple = true;
        request.input('IN_ID_COMPANIA', sql.Int, req.body.idCia);
        request.input('IN_CENTRO_OPERACION', sql.Int, req.body.centroOperacion);
        request.input('IN_NRO_PEDIDO', sql.Int, req.body.nroPedido);
        request.input('IN_TIPO_PAGO', sql.VarChar(5), req.body.tipo_pago);

        request.execute('POS.SSP_GET_NRO_REGISTROS_FACTURA', function (err, recordsets, returnValue) {
            if (err) {
                //res.status(err.status || 500);
                sql.close();
                return res.json({
                    error: err
                });

            } else {
                res.json({
                    data: recordsets
                });
                sql.close();
            }
        });

    });


});





router.post('/insertArchivosPlanosGuias', function (req, res) {

    config.configBD2.database = CONSTANTES.POSDB;
    var connection = new sql.Connection(utils.clone(config.configBD2),
        function (err) {
        });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            res.json({
                error: err,
                MSG: err.message
            });
            res.end();
            return;
        }

        const tableDatos = new sql.Table();

        tableDatos.columns.add("c_transportadora", sql.Int);
        tableDatos.columns.add("cs_id_orden", sql.BigInt);
        tableDatos.columns.add("nro_guia", sql.VarChar);
        tableDatos.columns.add("observacion", sql.VarChar);
        tableDatos.columns.add("cs_id_usuario", sql.Int);


        req.body.detalle.forEach(item => {
            tableDatos.rows.add(
                item.C_TRASPORTADORA,
                item.CS_ID_ORDEN,
                item.NRO_GUIA,
                item.OBSERVACION,
                req.body.solicitud.csIdUsuario
            );
        });

        const request = new sql.Request(transaction);
        request
            .input("IN_DATA", tableDatos)
            .input("IN_LOG_INSERT", sql.Int, req.body.solicitud.csIdUsuario)
            .output("MSG", sql.VarChar)

            .execute('POS.SSP_INSERT_OV_FROM_PLANO_GUIAS',
            function (err, recordsets, returnValue) {
                if (err) {
                    console.log(err);
                    transaction.rollback(function (err) {
                    });
                    res.json({
                        error: err,
                        MSG: err.message
                    });
                    res.end();
                    return;
                }

                if (request.parameters.MSG.value !== "OK") {

                    transaction.rollback(function (err2) { // ... error checks
                    });
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value
                    });
                    res.end();

                } else {
                    transaction.commit(function (err, recordset) {
                        console.log("Transaction commited.");

                        res.json({
                            data: recordsets,
                            'MSG': request.parameters.MSG.value
                        });
                        res.end();
                    });
                }
            });
    });
});





router.post('/generarGuiaSaferbo_WEB', function (req, res) {
    

return new Promise((resolve, reject) => {
   console.log(req.body);

   let request = require('request');

   let url  = req.body.url
   request(url,
       function(err, response, body) {

           if (err) {
               reject({
                   MSG: "Error al tratar de obtener la apiKey. "
               });

           } else {

            let result =(body);
              // let result = JSON.parse(body);
                console.log (result)
                resolve({
                    data: result
                });



            //    if (res.err == 0 && res.msg == "Ok") {
            //        resolve({
            //            data: res
            //        });
            //    } else {
            //        res.MSG = "Error al tratar de obtener la apiKey. " + (res.msg || "");
            //        reject(res);
            //    }
           }
       });

    });

});

router.post('/generarGuiaSaferbo', function(req, res, next) {

    // funcion para quitar caracteres especiales 

    var normalize = (function() {
        var from = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç", 
            to   = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc",
            mapping = {};
       
        for(var i = 0, j = from.length; i < j; i++ )
            mapping[ from.charAt( i ) ] = to.charAt( i );
       
        return function( str ) {
            var ret = [];
            for( var i = 0, j = str.length; i < j; i++ ) {
                var c = str.charAt( i );
                if( mapping.hasOwnProperty( str.charAt( i ) ) )
                    ret.push( mapping[ c ] );
                else
                    ret.push( c );
            }      
            return ret.join( '' );
        }
       
      })();


    let cuidadDestino = req.body.cuidadDestino.replace('#','N');

    console.log(req.body);
    let completarDestino       ='000'
    let cuidad_depto           = cuidadDestino +'-'+ req.body.deptoDestino+'-'+req.body.c_departamento_destino +''+ req.body.c_municipio
    let destino                = cuidad_depto + completarDestino
    let origen                 = 'VALLE-YUMBO-76892000'
    let peso                   = req.body.pesoEnvio
    let valor_declarado        = req.body.valorDeclaradoEnvio.toString()
    let cantidad               = req.body.nroUnidadesEnvio.toString()
    let codigocliente          = CONSTANTES.codigo_cliente // '999997'  
    //let codigocliente        = '034865'  //real 
    let nit_remitente          ='805026021-8'
    let nombre_remitente       ='RTA DESING'
    let telefono_remitente     ='6911700'
    let direccion_remitente    ='Carrera 15 No 17 28'
    let kilos                  = '0'
    let observacion            = req.body.observacion //+' '+ req.body.direccionArchivo
    let observacion2           = req.body.referencia_producto 
    let observacion3           = ''//req.body.direccionDestino 
    let codigo_destinatario    = '0000'
    let nit_destinatario       = req.body.documentoCliente
    let nombre_destinatario    = req.body.clienteDestino
    let telefono_destinatario  = req.body.telefonoDestino
    let direccion_destinatario = req.body.direccionDestino
    direccion_destinatario     = direccion_destinatario.replace('#',' Nro ');
    direccion_destinatario     = normalize(direccion_destinatario)
    let valor_recaudar         ='0'

    console.log(direccion_destinatario);

    let url  = 'https://app.saferbo.com/webservices/ws.generar.guias.directo.php?destino=' + (destino) +'&origen='+ (origen) + '&ds_peso='+ (peso) + '&ds_valoracion='+(valor_declarado) 
    +'&ds_largo=1&ds_ancho=1&ds_alto=1&ds_pesovol=1&ds_contraentrega=0&tipoacceso=1&tipodatos=2&ds_cantidad='+(cantidad)+'&dscodigocliente='+(codigocliente)
    +'&idnegociacion=1&idtipoenvio=1&idtipoliquidacion=1&idtarifaxtrayecto=2&dsnitr='+(nit_remitente)+'&dsnombrer='+(nombre_remitente)+'&dstelr='+(telefono_remitente)
    +'&dsdirr='+(direccion_remitente)+'&dsunidad='+(cantidad)+'&dskilos='+(kilos)+'&dsvalordec='+(valor_declarado)+'&dsobs_1='+(observacion)
    +'&dsobs_2='+(observacion2)+'&dsobs_3='+(observacion3)+'&dscodigodestinatario='+(codigo_destinatario)+'&dsnitd='+(nit_destinatario)+'&dsnombred='+(nombre_destinatario)+'&dsteld='+(telefono_destinatario)
    +'&dsdird='+(direccion_destinatario)+'&dsvalorrecaudar='+(valor_recaudar)+'&arunidades=&idconsec=0'

   // url = 'https://app.saferbo.com/webservices/ws.generar.guias.directo.php?destino=MEDELLIN-ANTIOQUIA-05001000&origen=MEDELLIN-ANTIOQUIA-05001000&ds_peso=154&ds_valoracion=180000&ds_largo=1&ds_ancho=1&ds_alto=1&ds_pesovol=1&ds_contraentrega=0&tipoacceso=1&tipodatos=2&ds_cantidad=0&dscodigocliente=999997&idnegociacion=1&idtipoenvio=1&idtipoliquidacion=1&idtarifaxtrayecto=2&dsnitr=&dsnombrer=&dstelr=&dsdirr=&dsunidad=0&dskilos=0&dsvalordec=180000&dsobs_1=obs&dsobs_2=obs2&dsobs_3=obs3&dscodigodestinatario=0000&dsnitd=71777132&dsnombred=JUAN%20FERNANDO&dsteld=2385370&dsdird=CALLE%2030%2075%2023&dsvalorrecaudar=125000&arunidades=1-2&idconsec=0'
    
    console.log(url);

    // res.json ({

    //     'GUIA':url
    // });


    // return;

    pos_dao.generarGuiaSaferbo(url)
        .then(function(result) {

            let resultado  = "";
            resultado = result.data.split("|");

            console.log(resultado);

            let guia ="";
            let ruta_guia_impresion = resultado[4] +  resultado[3]
            let ruta_guia_impresion_rotulo =  resultado[4] +  resultado[1]
            guia =resultado[0]

            console.log('Nro guia' + guia)
            console.log('rta impresion guia ' + ruta_guia_impresion)
            console.log('rta impresion guia rotulo ' + ruta_guia_impresion_rotulo)

            // validar que se genere una guia 
            
            if (ruta_guia_impresion_rotulo) {
                res.json ({
                    data: resultado,
                    'MSG': "OK",
                    'GUIA':guia,
                    'ROTULO':ruta_guia_impresion_rotulo
                });


               }else{

                console.log('No se generó la guia')
                return  res.json ({
                    error: "err",
                    'MSG': "Error al generar la guia"
                });

            }

        })
        .catch(function(err) {
            return res.json(err);
        });
});




router.post('/actualizarGuiasSaferbo', function (req, res, next) {    

    // WSDL of the web service this client will invoke. This can point to local WSDL as well.
    var url = 'https://www.saferbo.com/webservices/consultar.guias.php?wsdl';
    // console.log(req.body.nro_guia);
    
    var requestArgs = {
        codigo: '999999',
        clave: '999999',
        guias: req.body.nro_guia,
        fechas :'',
        tipoformato :2,
        novedades:'',
        archivo:2
    };

    // console.log(requestArgs);
 
    var options = {};

    var parser = new xml2js.Parser();

    soap.createClient(url, options, function (err, client) {
        client.consultarguias(requestArgs, function (err, result, envelope) {
            if (err) {
                console.log(err);
                return;
            }

            var estado_guia =''

            parser.parseString(result.return.$value, function (err, result) {
                estado_guia =result.consulta.guia[0].estadoguia[0];
            });

            if(estado_guia ==='No hay datos que listar. Intente mas tarde'){
                estado_guia =0
            }else{
                estado_guia = parseFloat(estado_guia)
            }

            if(estado_guia ===50 )
            {
                estado_guia =0
            }

            
            pos_dao.actualizarestadoGuia(estado_guia,req.body.nro_guia, req.body.cs_id_orden)
            .then(function(resultado) {

                res.json ({
                    data: resultado,
                    'ESTADO_GUIA':estado_guia,
                    "MSG" : 'OK'
                });

                console.log('GUIA ACTUALIZADA ' + req.body.nro_guia  +' ESTADO ' + estado_guia  +' OV ' + req.body.cs_id_orden);

                
              
            })
            .catch(function(err) {
                return res.json(err);
            });


            


            // res.json({
            //      data: result.return.$value,
            //     'ESTADO_GUIA':estado_guia
            // });

        });
    });

});





router.post('/generar_pedidos_ftp', function (req, res, next) {

    let base_ruta = CONSTANTES.base_ruta    //'C:/FTP/'  

    let ftp =CONSTANTES.ftp    //'VM'

    let fecha_actual = moment().format("YYYY-MM-DD")
    console.log(fecha_actual)

    let formato_archivo =CONSTANTES.formato_archivo   // '/vmu-'

    let extencion ='.csv'

    let ruta_acrhivo = base_ruta + ftp + formato_archivo + fecha_actual + extencion

    var documento_cliente =CONSTANTES.documento_cliente_ftp  //'900447351' 	//lab
    //var documento_cliente ='901266454' 	//real
    var nombre_cliente   = CONSTANTES.nombre_cliente_ftp //'VIRTUAL MUEBLES S A S'

    var tipo_pedido = 3

    var arreglocsv = [];

    var log_insert  = CONSTANTES.log_insert_ftp//3969

    fs.readFile(ruta_acrhivo, 'utf8', function (err, data) {
        var dataArray = data.split(/\r?\n/);
        console.log(dataArray);

        var contenido = data



        //separa objetos por salto de linea
        let separata = contenido.split("\n");

        //asignar cabecera los separa por ',' 
        var cabecera = separata[0].split(';');
        separata.splice(0, 1);
       //var arreglocsv = [];
       for (var j = 0; j < separata.length; j++) {
        var objetojson = {};

        var item = separata[j].split(';');

       

        for (var i = 0; i < cabecera.length; i++) {
            objetojson[cabecera[i]] = item[i];
        }

        console.log(objetojson)
        if (objetojson.DIRECCION_CLIENTE !== '' && objetojson.DIRECCION_CLIENTE !== undefined) {
            arreglocsv.push({
            
            
                NOMBRE_CLIENTE: objetojson.NOMBRE_CLIENTE,
                CEDULA_CLIENTE: objetojson.CEDULA_CLIENTE,
                NRO_OC: objetojson.ORDEN_COMPRA,
                DIRECCION_CLIENTE: objetojson.DIRECCION_CLIENTE,
                DEPARTAMENTO_CLIENTE: objetojson.DEPARTAMENTO_CLIENTE,
                CUIDAD_CLIENTE: objetojson.CIUDAD_CLIENTE,
                C_PRODUCTO: objetojson.REFERENCIA_PROVEEDOR,
                CODIGO_BARRAS: objetojson.CODIGO_BARRAS,
                CANTIDAD: objetojson.CANTIDAD,
                OBSERVACION:objetojson.OBSERVACIONES,
                C_TINDA:objetojson.TIENDA_ID,
                TELEFONO_CLIENTE: objetojson.TELEFONO_CLIENTE_1,
                SUCURSAL:objetojson.SUCURSAL,
                NOMBRE_PROBEEDOR:objetojson.NOMBRE_PROVEEDOR
            

            });
        }
        
    }

    if(arreglocsv.length > 0){

        config.configBD2.database = CONSTANTES.POSDB;
        var connection = new sql.Connection(utils.clone(config.configBD2),
            function (err) {
            });
        var transaction = new sql.Transaction(connection);
    
        transaction.begin(function (err) {
            // ... error checks
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                res.end();
                return;
            }
    
            const tableDatos = new sql.Table();
  
            console.log(arreglocsv)
    
            tableDatos.columns.add("documento_cliente", sql.VarChar);
            tableDatos.columns.add("nombre_cliente", sql.VarChar);
            tableDatos.columns.add("cs_id_usuario", sql.Int);
            tableDatos.columns.add("documento_cliente_ecommerce", sql.VarChar);
            tableDatos.columns.add("nombre_cliente_ecommerce", sql.VarChar);
            tableDatos.columns.add("orden_compra", sql.VarChar);
            tableDatos.columns.add("direccion_cliente", sql.VarChar);
            tableDatos.columns.add("c_departamento", sql.VarChar);
            tableDatos.columns.add("c_cuidad", sql.VarChar);
            tableDatos.columns.add("c_tipo_pedido", sql.VarChar);
            tableDatos.columns.add("referencia", sql.VarChar);
            tableDatos.columns.add("codigo_barras", sql.VarChar);
            tableDatos.columns.add("cantidad", sql.Decimal(14, 2));
            tableDatos.columns.add("observacion", sql.VarChar);
            tableDatos.columns.add("c_tienda", sql.VarChar);
            tableDatos.columns.add("telefono_cliente", sql.VarChar);
            tableDatos.columns.add("c_sucursal", sql.VarChar);
    
    
            arreglocsv.forEach(item => {
                if(item.SUCURSAL ==='42'){

                    tableDatos.rows.add(
                        documento_cliente,
                        nombre_cliente,
                        log_insert,
                        item.CEDULA_CLIENTE.replace('"',''),
                        item.NOMBRE_CLIENTE.replace('"',''),
                        item.NRO_OC,
                        item.DIRECCION_CLIENTE.replace('"',''),
                        item.DEPARTAMENTO_CLIENTE,
                        item.CUIDAD_CLIENTE.replace('"',''),
                        tipo_pedido,
                        item.C_PRODUCTO.replace('"',''),
                        item.CODIGO_BARRAS,
                        item.CANTIDAD,
                        item.OBSERVACION || '',
                        item.C_TINDA,
                        item.TELEFONO_CLIENTE || '',
                        item.SUCURSAL
                    );

                }
                else{
                    tableDatos.rows.add(
                        item.SUCURSAL,
                        item.NOMBRE_PROBEEDOR,
                        log_insert,
                        item.CEDULA_CLIENTE.trim(),
                        item.NOMBRE_CLIENTE.trim(),
                        item.NRO_OC,
                        item.DIRECCION_CLIENTE,
                        item.DEPARTAMENTO_CLIENTE,
                        item.CUIDAD_CLIENTE,
                        tipo_pedido,
                        item.C_PRODUCTO,
                        item.CODIGO_BARRAS,
                        item.CANTIDAD,
                        item.OBSERVACION || '',
                        item.C_TINDA,
                        item.TELEFONO_CLIENTE || '',
                        item.SUCURSAL
                    );


                }
      
            });

            console.log(tableDatos)

    
            const request = new sql.Request(transaction);
            request
                .input("IN_DATA_OV", tableDatos)
                .input("IN_TIPO_PEDIDO", sql.Int, tipo_pedido)
                .input("IN_LOG_INSERT", sql.Int, log_insert)
                .output("MSG", sql.VarChar)
    
                .execute('POS.SSP_INSERT_OV_FROM_PLANO',
                function (err, recordsets, returnValue) {
                    if (err) {
                        console.log(err);
                        transaction.rollback(function (err) {
                        });
                        res.json({
                            error: err,
                            MSG: err.message
                        });
                        res.end();
                        return;
                    }
    
                    if (request.parameters.MSG.value !== "OK") {
    
                        transaction.rollback(function (err2) { // ... error checks
                        });
                        res.json({
                            error: "err",
                            MSG: request.parameters.MSG.value
                        });
                        res.end();
    
                    } else {
                        transaction.commit(function (err, recordset) {
                           
                            console.log("Transaction commited.");
    
                            res.json({
                                data: recordsets,
                                'MSG': request.parameters.MSG.value
                            });
                            res.end();
                        });
                    }
                });
        });
  

      }




      });

 
});


router.post('/generar_pedidos_ftp_by_fecha', function (req, res, next) {
console.log(req.body);

    let base_ruta = CONSTANTES.base_ruta    //'C:/FTP/'  

    let ftp =CONSTANTES.ftp    //'VM'

    let fecha = req.body.fh_year +'-'+ req.body.fh_month +'-'+ req.body.fh_day 

    let fecha_actual = fecha //moment().format("YYYY-MM-DD")
    console.log(fecha_actual)

    let formato_archivo =CONSTANTES.formato_archivo   // '/vmu-'

    let extencion ='.csv'

    let ruta_acrhivo = base_ruta + ftp + formato_archivo + fecha_actual + extencion

    var documento_cliente =CONSTANTES.documento_cliente_ftp  //'900447351' 	//lab
    //var documento_cliente ='901266454' 	//real
    var nombre_cliente   = CONSTANTES.nombre_cliente_ftp //'VIRTUAL MUEBLES S A S'

    var tipo_pedido = 3

    var arreglocsv = [];

    var log_insert  = CONSTANTES.log_insert_ftp//3969

    fs.readFile(ruta_acrhivo, 'utf8', function (err, data) {
        var dataArray = data.split(/\r?\n/);
        console.log(dataArray);

        var contenido = data



        //separa objetos por salto de linea
        let separata = contenido.split("\n");

        //asignar cabecera los separa por ',' 
        var cabecera = separata[0].split(';');
        separata.splice(0, 1);
       //var arreglocsv = [];
       for (var j = 0; j < separata.length; j++) {
        var objetojson = {};

        var item = separata[j].split(';');

       

        for (var i = 0; i < cabecera.length; i++) {
            objetojson[cabecera[i]] = item[i];
        }

        console.log(objetojson)
        if (objetojson.DIRECCION_CLIENTE !== '' && objetojson.DIRECCION_CLIENTE !== undefined) {
            arreglocsv.push({
            
            
                NOMBRE_CLIENTE: objetojson.NOMBRE_CLIENTE,
                CEDULA_CLIENTE: objetojson.CEDULA_CLIENTE,
                NRO_OC: objetojson.ORDEN_COMPRA,
                DIRECCION_CLIENTE: objetojson.DIRECCION_CLIENTE,
                DEPARTAMENTO_CLIENTE: objetojson.DEPARTAMENTO_CLIENTE,
                CUIDAD_CLIENTE: objetojson.CIUDAD_CLIENTE,
                C_PRODUCTO: objetojson.REFERENCIA_PROVEEDOR,
                CODIGO_BARRAS: objetojson.CODIGO_BARRAS,
                CANTIDAD: objetojson.CANTIDAD,
                OBSERVACION:objetojson.OBSERVACIONES,
                C_TINDA:objetojson.TIENDA_ID,
                TELEFONO_CLIENTE: objetojson.TELEFONO_CLIENTE_1,
                SUCURSAL:objetojson.SUCURSAL,
                NOMBRE_PROBEEDOR:objetojson.NOMBRE_PROVEEDOR
            

            });
        }
        
    }

    if(arreglocsv.length > 0){

        config.configBD2.database = CONSTANTES.POSDB;
        var connection = new sql.Connection(utils.clone(config.configBD2),
            function (err) {
            });
        var transaction = new sql.Transaction(connection);
    
        transaction.begin(function (err) {
            // ... error checks
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                res.end();
                return;
            }
    
            const tableDatos = new sql.Table();
  
            console.log(arreglocsv)
    
            tableDatos.columns.add("documento_cliente", sql.VarChar);
            tableDatos.columns.add("nombre_cliente", sql.VarChar);
            tableDatos.columns.add("cs_id_usuario", sql.Int);
            tableDatos.columns.add("documento_cliente_ecommerce", sql.VarChar);
            tableDatos.columns.add("nombre_cliente_ecommerce", sql.VarChar);
            tableDatos.columns.add("orden_compra", sql.VarChar);
            tableDatos.columns.add("direccion_cliente", sql.VarChar);
            tableDatos.columns.add("c_departamento", sql.VarChar);
            tableDatos.columns.add("c_cuidad", sql.VarChar);
            tableDatos.columns.add("c_tipo_pedido", sql.VarChar);
            tableDatos.columns.add("referencia", sql.VarChar);
            tableDatos.columns.add("codigo_barras", sql.VarChar);
            tableDatos.columns.add("cantidad", sql.Decimal(14, 2));
            tableDatos.columns.add("observacion", sql.VarChar);
            tableDatos.columns.add("c_tienda", sql.VarChar);
            tableDatos.columns.add("telefono_cliente", sql.VarChar);
            tableDatos.columns.add("c_sucursal", sql.VarChar);
    
    
            arreglocsv.forEach(item => {
                if(item.SUCURSAL ==='42'){

                    tableDatos.rows.add(
                        documento_cliente,
                        nombre_cliente,
                        log_insert,
                        item.CEDULA_CLIENTE.replace('"',''),
                        item.NOMBRE_CLIENTE.replace('"',''),
                        item.NRO_OC,
                        item.DIRECCION_CLIENTE.replace('"',''),
                        item.DEPARTAMENTO_CLIENTE.replace('"',''),
                        item.CUIDAD_CLIENTE.replace('"',''),
                        tipo_pedido,
                        item.C_PRODUCTO.replace('"',''),
                        item.CODIGO_BARRAS,
                        item.CANTIDAD,
                        item.OBSERVACION || '',
                        item.C_TINDA,
                        item.TELEFONO_CLIENTE || '',
                        item.SUCURSAL
                    );

                }
                else{
                    tableDatos.rows.add(
                        item.SUCURSAL,
                        item.NOMBRE_PROBEEDOR,
                        log_insert,
                        item.CEDULA_CLIENTE.replace('"',''),
                        item.NOMBRE_CLIENTE.replace('"',''),
                        item.NRO_OC,
                        item.DIRECCION_CLIENTE.replace('"',''),
                        item.DEPARTAMENTO_CLIENTE.replace('"',''),
                        item.CUIDAD_CLIENTE.replace('"',''),
                        tipo_pedido,
                        item.C_PRODUCTO.replace('"',''),
                        item.CODIGO_BARRAS,
                        item.CANTIDAD,
                        item.OBSERVACION || '',
                        item.C_TINDA,
                        item.TELEFONO_CLIENTE || '',
                        item.SUCURSAL
                    );


                }
      
            });

            console.log(tableDatos)

    
            const request = new sql.Request(transaction);
            request
                .input("IN_DATA_OV", tableDatos)
                .input("IN_TIPO_PEDIDO", sql.Int, tipo_pedido)
                .input("IN_LOG_INSERT", sql.Int, log_insert)
                .output("MSG", sql.VarChar)
    
                .execute('POS.SSP_INSERT_OV_FROM_PLANO',
                function (err, recordsets, returnValue) {
                    if (err) {
                        console.log(err);
                        transaction.rollback(function (err) {
                        });
                        res.json({
                            error: err,
                            MSG: err.message
                        });
                        res.end();
                        return;
                    }
    
                    if (request.parameters.MSG.value !== "OK") {
    
                        transaction.rollback(function (err2) { // ... error checks
                        });
                        res.json({
                            error: "err",
                            MSG: request.parameters.MSG.value
                        });
                        res.end();
    
                    } else {
                        transaction.commit(function (err, recordset) {
                           
                            console.log("Transaction commited.");
    
                            res.json({
                                data: recordsets,
                                'MSG': request.parameters.MSG.value
                            });
                            res.end();
                        });
                    }
                });
        });
  

      }




      });

 
});


router.get('/getLogArchivosOv/:year/:month/:day', function (req, res, next) {
    console.log(req.params);
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
        // request.input("IN_CS_ID_USUARIO", sql.Int, req.params.csIdUsuario);
        request.input("IN_ANIO", sql.Int, req.params.year);
        request.input("IN_MES", sql.Int, req.params.month);
        request.input("IN_DIA", sql.Int, req.params.day);
        //request.verbose = true;

        request.execute('POS.GET_LOG_ARCHIVOS', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });


    });
});


router.post('/generarGuiaEnvia', function(req, res, next) {

    console.log(req.body);

    let item = req.body

    pos_dao.generarGuiaEnvia(item)
        .then(function(result) {

            console.log(result);

            if (result.respuesta === '' && result.guia !==null) {
                res.json ({
                    data: result,
                    'MSG': "OK",
                    'GUIA':result.guia,
                    'ROTULO':result.urlguia
                });


               }else{

                console.log('No se generó la guia')
                return  res.json ({
                    error: "err",
                    'MSG': "Error al generar la guia"
                });
              

            }
            
        })
        .catch(function(err) {
            return res.json(err);
        });
});



//elminar log
router.post('/delete_log', function (req, res, next) {

    console.log(req.body);

    config.configBD2.database = CONSTANTES.POSDB;
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
        request.input("IN_ID", sql.BigInt, req.body.cs_id);
     

        request.output("MSG", sql.VarChar);

        request.execute('POS.SSP_DELETE_LOG_ARCHIVOS', function (err, recordsets, returnValue) {
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



router.get('/getVentasProveedores/:csIdUsuario/:year/:month', function (req, res, next) {
    console.log(req.params);
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
        request.input("IN_CS_ID_USUARIO", sql.Int, req.params.csIdUsuario);
        request.input("IN_ANIO", sql.Int, req.params.year);
        request.input("IN_MES", sql.Int, req.params.month);
        //request.verbose = true;

        request.execute('POS.GET_VENTAS_PROVEEDOR_VM', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });


    });
});



router.post('/updatenuevaordencomentario', function (req, res, next) {

    var conexion      = utils.clone(config.configBD2);
    // conexion.driver   = "msnodesqlv8";
    conexion.database = CONSTANTES.POSDB;
    var connection            = new sql.Connection(conexion, function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            sql.close();
            return res.json(err);
        }
        // Stored Procedure
        var request     = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_ID_ORDEN", sql.Int, req.body.consecutivoOrden);
        request.input("IN_ID_USUARIO", sql.Int, req.body.idUsuario);
        request.input("IN_COMENTARIO", sql.VarChar(1000), req.body.comentario);
        
        request.output("MSG", sql.VarChar);

        request.execute('POS.SSP_UPDATE_ORDENES_COMENTARIO', function (err, recordsets, returnValue) {
            if (err) {
                sql.close();
                return res.json(err);
            } else {
                res.json({
                    data: recordsets,
                    MSG : request.parameters.MSG.value
                });
                sql.close();
            }
        });
    });
});


router.get('/getEstadoPedidoUnoee/:nro_pedido/:tipopedido/:c_centro_operacion/:c_compania', function (req, res, next) {
    console.log(req.params);
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
        request.input("IN_NRO_PEDIDO", sql.Int, req.params.nro_pedido);
        request.input("IN_TIPO_PEDIDO", sql.VarChar, req.params.tipopedido);
        request.input("IN_CENTRO_OPERACION", sql.VarChar, req.params.c_centro_operacion);
        request.input("IN_C_COMPANIA", sql.Int, req.params.c_compania);
        

        //request.verbose = true;

        request.execute('POS.GET_ESTADO_PEDIDO_UNOEE', function (err, recordsets, returnValue) {
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
