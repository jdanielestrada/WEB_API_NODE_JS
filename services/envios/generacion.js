let soap         = require('strong-soap').soap;
let config       = require('../../utils/config');
let utils        = require('../../utils/utils.js');
let CONSTANTES   = require('../../utils/constantes');
let async        = require('async');
let sql          = require('mssql');
let moment       = require("moment");
let axios        = require("axios");	
let pos_dao      = require('../../dao/pos');
let btoa         = require('btoa');

console.log(btoa("Hello World!"));

//let f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');
var f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');;

let envios_generacion = {
    
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

	init_job : () => {
		console.log("Iniciando tarea");
        
		let CronJob            = require('cron').CronJob;
		let fecha_programacion = `00 00 ${config.horaEjecucionTareaEnvios} * * 1-5`;
		let timeZone           = 'America/Bogota';

	    //Seconds: 0-59 * 
	    //Minutes: 0-59 * (*/1 cada min)
	    //Hours: 0-23 *
	    //Day of Month: 1-31 *
	    //Months: 0-11 *
	    //Day of Week: 0-6 *

		// fecha_programacion = `0 0 */1 * * *`;
		fecha_programacion = `* */2 * * * *`;

		let job = new CronJob(fecha_programacion, () => {

		    console.log('corriendo tarea programada generación guias ...');

			envios_generacion.programar_envio();
		    },() => {
			/* This function is executed when the job stops */
			console.log('job has stopped');
		},
		false, /* Start the job right now */
		timeZone /* Time zone of this job. */
		);

		job.start();

		console.log("Finalizando tarea generación guias");
	},

	insert_guia: function (body) {
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

	                console.log("call insert h_log", moment().format("YYYY-MM-DD HH:mm:ss"))

	                request.input("IN_JSON_RESPONSE_WS", sql.VarChar, body.json_response);
	                request.input('IN_SW_ERROR', sql.Bit, body.sw_error);
	                request.input('IN_FH_CONSULTA_VENTAS_DIA', sql.VarChar, body.fh_consulta_ventas_dia);

	                request.output('OUT_CS_H_LOG_WS_MADECLUB', sql.BigInt);
	                request.output('MSG', sql.VarChar);

	                request.execute('CORPORATIVA.SSP_INSERT_H_LOG_WS_MADECLUB', function(err, recordsets, returnValue) {
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

	                        if (request.parameters.MSG.value !== "OK") {
	                            reject({
	                                error: "err",
	                                MSG: request.parameters.MSG.value
	                            });
	                            transaction.rollback(function(err2) {
	                            });

	                        } else {

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

module.exports  = envios_generacion;