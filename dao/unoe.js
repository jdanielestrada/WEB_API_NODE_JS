var sql        = require('mssql');
var CONSTANTES = require('../utils/constantes');
var config     = require('../utils/config');
var utils      = require('../utils/utils');
var Promise    = require('bluebird');
var axios      = require("axios");
var moment     = require("moment");

var unoe_dao = {



    /*********************************************************************************************
     *
     * CONECTOR PEDIDO
     *
     *********************************************************************************************/

    pedido_completarPlantillaSiesaCabecera: function (plantilla, esContado, dtoSucursal, ObjNuevaOrden) {
        plantilla.forEach(function (item, index) {
            switch (item.nombre) {
                case "f430_id_co":
                    item.valor_defecto = ObjNuevaOrden.CodigoSucursal;
                    break;
                case "f430_id_fecha":
                    item.valor_defecto = moment().format('YYYYMMDD');
                    break;
                case "f430_notas":
                    item.valor_defecto = "pedido " + ObjNuevaOrden.CodigoSucursal + "-" + ObjNuevaOrden.ConsecutivoOrden + "  : " + ObjNuevaOrden.Comentario;
                    break;
                case "f430_id_tercero_fact":
                case "f430_id_tercero_rem":
                    if (esContado) {
                        item.valor_defecto = "1" + ObjNuevaOrden.CodigoSucursal;
                    } else {
                        item.valor_defecto = ObjNuevaOrden.DatosCliente.Documento;
                    }
                    break;
                case "f430_id_sucursal_fact":
                case "f430_id_sucursal_rem":
                    if (esContado) {
                        item.valor_defecto = "001";
                    } else {
                        item.valor_defecto = dtoSucursal.c_centro_operacion; //CHICHARRON vm.ObjNuevaOrden.DatosCliente.Documento;
                    }
                    break;
                case "f430_id_tipo_docto":
                    item.valor_defecto = esContado ? "PC" : "PD";
                    break;
                case "f430_id_tipo_cli_fact":
                    item.valor_defecto = "002";
                    break;
                case "f430_id_co_fact":
                    item.valor_defecto = ObjNuevaOrden.CodigoSucursal;
                    break;
                case "f430_fecha_entrega":
                    item.valor_defecto = moment().format('YYYYMMDD');
                    break;
                case "f430_num_docto_referencia":
                    item.valor_defecto = ObjNuevaOrden.CodigoSucursal + "-" + ObjNuevaOrden.ConsecutivoOrden;
                    break;
                case "f430_id_cond_pago":
                    if (esContado) {
                        item.valor_defecto = "0";
                    } else {
                        item.valor_defecto = dtoSucursal.codicionPago;
                    }
                    break;
                case "f430_id_cli_contado":
                    item.valor_defecto = ObjNuevaOrden.DatosCliente.Documento;
                    break;
                case "f430_id_tercero_vendedor":
                    item.valor_defecto = ObjNuevaOrden.Asesor.Cedula; // loginService.userData.cedula; //ideal pero no sirve sin la integración unoe
                    //item.valor_defecto = "71388967";
                    break;
                case "F_IND_CONTACTO":
                    item.valor_defecto = "1"; //pendiente analizar el 0
                    break;
                case "f419_contacto":
                    item.valor_defecto = ObjNuevaOrden.DatosCliente.Nombres + " " + (ObjNuevaOrden.DatosCliente.Apellidos || ""); //si F_IND_CONTACTO == 0, asignarlo
                    break;
                case "f419_direccion1":
                    item.valor_defecto = ""; //si F_IND_CONTACTO == 0, asignarlo
                    break;
                case "f431_id_motivo":
                    item.valor_defecto = "01"; //01 contado, 02 crédito
                    break;
            }
        });
    },

    pedido_completarPlantillaSiesaMovimiento: function (plantilla, esContado, consecutivo, referencia, unidadDeMedida, cantidad, precioUnitario, extension1, extension2, ObjNuevaOrden) {
        plantilla.forEach(function (item, index) {
            switch (item.nombre) {
                case "F_NUMERO-REG":
                    item.valor_defecto = consecutivo;
                    break;
                case "f431_id_co":
                    item.valor_defecto = ObjNuevaOrden.CodigoSucursal;
                    break;
                case "f431_id_tipo_docto":
                    if (esContado) {
                        item.valor_defecto = "PC";
                    } else {
                        item.valor_defecto = "PD";
                    }

                    break;
                case "f431_nro_registro":
                    item.valor_defecto = consecutivo - 2;
                    break;
                case "f431_referencia_item":
                    item.valor_defecto = referencia;
                    break;
                case "f431_id_ext1_detalle":
                    item.valor_defecto = extension1;
                    break;
                case "f431_id_ext2_detalle":
                    item.valor_defecto = extension2;
                    break;
                case "f431_id_bodega": //t150_mc_bodegas
                    //creamos un código de compatibilidad
                    if (ObjNuevaOrden.CodigoBodega === null || ObjNuevaOrden.CodigoBodega === "") {
                        if (ObjNuevaOrden.CodigoSucursal === "111") { //el 01 de 111 está deshabilitado
                            item.valor_defecto = ObjNuevaOrden.CodigoSucursal + "02";
                        } else {
                            item.valor_defecto = ObjNuevaOrden.CodigoSucursal + "01";
                        }
                    }
                    else {
                        item.valor_defecto = ObjNuevaOrden.CodigoBodega;
                    }

                    break;
                case "f431_id_co_movto":
                    item.valor_defecto = ObjNuevaOrden.CodigoSucursal;
                    break;
                case "f431_fecha_entrega":
                    item.valor_defecto = moment().format('YYYYMMDD');
                    break;
                case "f431_id_unidad_medida":
                    item.valor_defecto = unidadDeMedida;
                    break;
                case "f431_cant_pedida_base":
                    item.valor_defecto = parseFloat(cantidad).toFixed(4);
                    break;
                case "f431_precio_unitario":
                    item.valor_defecto = parseFloat(precioUnitario).toFixed(2) + "00";
                    break;
                case "f431_id_motivo":
                    if (esContado) {
                        item.valor_defecto = "01";
                    } else {
                        item.valor_defecto = "02";
                    }
                    break;

            }
        });
    },

    pedido_completarPlantillaSiesaDescuento: function (plantillaDescuento, subitem, numeroItemMovimiento, consecutivo, esContado, ObjNuevaOrden) {
        plantillaDescuento.forEach(function (item, index) {
            switch (item.nombre) {
                case "F_NUMERO-REG":
                    item.valor_defecto = consecutivo;
                    break;
                case "f430_id_co":
                    item.valor_defecto = ObjNuevaOrden.CodigoSucursal;
                    break;
                case "f430_id_tipo_docto":
                    if (esContado) {
                        item.valor_defecto = "PC";
                    } else {
                        item.valor_defecto = "PD";
                    }
                    break;
                case "f431_nro_registro":
                    item.valor_defecto = numeroItemMovimiento - 2;
                    break;
                case "f432_tasa":
                    item.valor_defecto = parseFloat(subitem.Descuento).toFixed(2) + "00";
                    break;
                // case "f432_vlr_uni":
                //     item.valor_defecto =  parseFloat(subitem).toFixed(2) + "00";
                //     break;

            }
        });
    },


    /*********************************************************************************************
     *
     * CONECTOR FACTURA
     *
     *********************************************************************************************/


    factura_contado_cabecera_completarPlantilla: function (plantilla, centroOperacion, tipoPago, numeroPedido, cajaRecaudo) {
        plantilla.forEach(function (item, index) {
            switch (item.nombre) {
                case "F350_ID_CO":
                    item.valor_defecto = centroOperacion;
                    break;
                case "F350_ID_TIPO_DOCTO":
                    item.valor_defecto = centroOperacion;
                    break;
                case "F350_FECHA":
                    item.valor_defecto = moment().format('YYYYMMDD');
                    break;
                case "F430_CONSEC_DOCTO":
                    item.valor_defecto = numeroPedido;
                    break;
                case "F430_ID_TIPO_DOCTO":
                    item.valor_defecto = tipoPago;
                    break;
                case "f462_id_caja":
                    item.valor_defecto = cajaRecaudo;
                    break;
            }
        });
    },


    factura_contado_forma_pago_completarPlantilla: function (plantilla, consecutivo,
                                                             centroOperacion, medioPago, listaPagosRealizadosDetalles) {
        plantilla.forEach(function (item, index) {
            switch (item.nombre) {
                case "F_NUMERO_REG":
                    item.valor_defecto = consecutivo;
                    break;
                case "F350_ID_CO":
                case "F350_ID_TIPO_DOCTO":
                    item.valor_defecto = centroOperacion;
                    break;
                case "F358_ID_MEDIOS_PAGO":
                    item.valor_defecto = medioPago.id;
                    break;
                case "F_VLR_MEDIO_PAGO":
                    item.valor_defecto = medioPago.valor;
                    break;
                case "F358_ID_BANCO":
                    item.valor_defecto = medioPago.bancoid;
                    break;
                case "F358_NRO_CHEQUE":
                    item.valor_defecto = medioPago.cheque; //00000000
                    break;
                case "F358_NRO_CUENTA":
                    item.valor_defecto = medioPago.nrocuenta;
                    break;
                case "F358_COD_SEGURIDAD":
                    item.valor_defecto = medioPago.codigoSeguridad;
                    break;
                case "F358_NRO_AUTORIZACION":
                    item.valor_defecto = medioPago.nroAutorizacion;
                    break;
                case "F358_FECHA_VCTO":
                    item.valor_defecto = medioPago.fechaVencimiento;
                    break;
                case "F358_REFERENCIA_OTROS":
                    item.valor_defecto = medioPago.referenciasOtros;
                    break;
                case "F358_FECHA_CONSIGNACION":
                    item.valor_defecto = medioPago.fechaConsignacion;
                    break;
                case "F358_ID_CAUSALES_DEVOLUCION":
                    item.valor_defecto = medioPago.chequeDevuelto.causalesDevolucionCheque;
                    break;
                case "F358_ID_TERCERO":
                    item.valor_defecto = medioPago.chequeDevuelto.tercero;
                    break;
                case "F358_NOTAS":
                    item.valor_defecto = medioPago.nota;
                    break;
                case "F358_ID_CCOSTO":
                    item.valor_defecto = ""; //pendiente a futuro si se analizarà
                    break;
            }
            //busco para ese mv de pago si existe el código analizado y en caso afirmativo sobreescribimos
            var pagoEncontrado = listaPagosRealizadosDetalles.filter(function (pagoRealizado) {
                return pagoRealizado.cs_id_mv_orden_pago === medioPago.cs_id_mv_orden_pago
                    && pagoRealizado.codigo_conector_siesa === item.nombre
                    && medioPago.id !== "001";
            });
            if (pagoEncontrado.length > 0) {
                item.valor_defecto = pagoEncontrado[0].valor_detalle;
            }
        });

    },


    factura_credito_cabecera_completarPlantilla: function (plantilla, centroOperacion, tipoPago, numeroPedido) {
        plantilla.forEach(function (item, index) {
            switch (item.nombre) {
                case "F350_ID_CO":
                    item.valor_defecto = centroOperacion;
                    break;
                case "F350_ID_TIPO_DOCTO":
                    item.valor_defecto = "C02";
                    break;
                case "F350_FECHA":
                    item.valor_defecto = moment().format('YYYYMMDD');
                    break;
                case "F430_CONSEC_DOCTO":
                    item.valor_defecto = numeroPedido;
                    break;
                case "F430_ID_TIPO_DOCTO":
                    item.valor_defecto = tipoPago;
                    break;
                case "f462_id_caja":
                    item.valor_defecto = "";
                    break;
            }
        });
    },


    factura_credito_cxc_completarPlantilla: function (plantilla, consecutivo, centroOperacion, medioPago) {
        plantilla.forEach(function (item, index) {
            switch (item.nombre) {
                case "F_NUMERO_REG":
                    item.valor_defecto = consecutivo;
                    break;
                case "F350_ID_CO":
                    item.valor_defecto = centroOperacion;
                    break;
                case "F350_ID_TIPO_DOCTO":
                    item.valor_defecto = 'C02';
                    break;
                case "F353_FECHA_VCTO":
                    item.valor_defecto = moment().format('YYYYMMDD');
                    break;
                case "F353_FECHA_DSCTO_PP":
                    item.valor_defecto = moment().format('YYYYMMDD');
                    break;
            }
        });


    },

    medioPago : {
        id               : "",
        bancoid          : "",
        cheque           : "00000000",
        nrocuenta        : "",
        codigoSeguridad  : "",
        nroAutorizacion  : "",
        fechaVencimiento : "",
        referenciasOtros : "",
        fechaConsignacion: "",
        chequeDevuelto   : {
            causalesDevolucionCheque: "",
            tercero                 : ""
        },
        nota             : ""
    },

    /*********************************************************************************************
     *
     * LLAMADAS CONECTOR
     *
     *********************************************************************************************/



    importarConectorUNOE2: function (xmlPlantilla, usuario, tipoOperacion, centroOperacion, mensajeDetalle, conector_unoe) {
        return axios.post(conector_unoe + "/api/request/ImportarUNE2", {
            "template"        : xmlPlantilla,
            "usuario"         : usuario,
            "tipoOperacion"   : tipoOperacion,
            "centroOperacion" : centroOperacion,
            "mensajeDetalle"  : mensajeDetalle,
            "nombreAplicacion": "POS",
            "time"            : null,
            "token"           : utils.generarAlfaNumerico("0123456789abcdefghijkmnlopqrstuvwxyzABCDEFGHIJKMNOPQRSTUVWXYZ", 20)

        })
    },

    /******************************************************************************************
     *
     * UTILIDADES PARA EL CONECTOR
     *
     ******************************************************************************************/

    crearXmlConectorSiesaLinea: function (plantilla) {
        var xmlTemplate = "";
        xmlTemplate     = xmlTemplate + "<Linea>";
        plantilla.forEach(function (item, index) {
            if (item.tipo === "numerico") {
                xmlTemplate = xmlTemplate + unoe_dao.padNumerico(item.valor_defecto, item.longitud);
            } else {
                var padding = Array(item.longitud + 1).join(' ');
                if (item.tipo === "decimal") {
                    xmlTemplate = xmlTemplate + unoe_dao.padAlfaNumerico(item.valor_defecto, padding, true);
                }
                if (item.tipo === "alfanumerico") {
                    xmlTemplate = xmlTemplate + unoe_dao.padAlfaNumerico(item.valor_defecto, padding, false);
                }

            }

        });
        xmlTemplate = xmlTemplate + "</Linea>\n";
        return xmlTemplate;
    },

    padNumerico: function (valor, longitud, charRelleno) {
        charRelleno = charRelleno || '0';
        valor       = valor + '';
        return valor.length >= longitud ? valor.substring(0, longitud) : new Array(longitud - valor.length + 1).join(charRelleno) + valor;
    },


    /**
     * http://stackoverflow.com/questions/2686855/is-there-a-javascript-function-that-can-pad-a-string-to-get-to-a-determined-leng
     *
     * @param  {[type]} str     [description]
     * @param  {[type]} pad     [description]
     * @param  {[type]} padLeft [description]
     * @return {[type]}         [description]
     */
    padAlfaNumerico: function (str, pad, padLeft) {
        if (typeof str === 'undefined')
            return pad;
        if (padLeft) {
            return (pad + str).slice(-pad.length);
        } else {
            return (str + pad).substring(0, pad.length);
        }
    }

};

module.exports = unoe_dao;