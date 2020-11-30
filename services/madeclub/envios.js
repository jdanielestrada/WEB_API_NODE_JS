let soap         = require('strong-soap').soap;
let config       = require('../../utils/config');
let utils        = require('../../utils/utils.js');
let CONSTANTES   = require('../../utils/constantes');
let async        = require('async');
let sql          = require('mssql');
let moment       = require("moment");
let axios        = require("axios");
let pos_dao      = require('../../dao/pos');

//let f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');
var f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');;

let madeclub_operation = {
    
	insertar : (listInsertParameter , session_id) => {
	    return new Promise((resolve, reject) => {

	        let datos = {
	            "transacciones": listInsertParameter
	        }
            
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
	                       
	                        //test: http://181.49.143.242/madecentro2/general/index/cargardatos
	                        //prod: https://www.madecentro.com/general/index/cargardatos

	                        $.post({
	                            url: "http://181.49.143.242/madecentro2/general/index/cargardatos",
	                            type: "post",
	                            data: datos,
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
    
	programar_ventas : () => {
		//consultamos la data
	    f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');
		let response_ws = {
		    json_response         : "",
		    listInsertParameter   : [],
		    sw_error              : 0,
		    fh_consulta_ventas_dia: f_proceso//moment().subtract(1, 'day').format('YYYY-MM-DD')
		};
        
		//consulta el dia anterior
	    pos_dao.getVentasDiaMadeclub(f_proceso)
	        .then((resultQuery) => {
	            console.log("after get ventas", moment().format("YYYY-MM-DD HH:mm:ss"))
	            if (resultQuery.data !== undefined && Array.isArray(resultQuery.data) && resultQuery.data.length > 0 && resultQuery.data[0].length > 0) {

	                //organizamos el dto
	                let listInsertParameter = [];
	                //   console.log("existe cliente 1152448268")

	                resultQuery.data[0].forEach(item => {
	                    listInsertParameter.push({
	                        id_pedido        : item.c_centro_operacion.toString() + '-' + item.prefijo_factura + '-' + item.nro_factura.toString(),
	                        cliente_doc      : item.documento_cliente.toString(),
	                        tienda_made      : item.d_centro_operacion,
	                        fecha_compra     : moment(item.fecha_transaccion).format('YYYY-MM-DD'),
	                        valor_transaccion: Math.ceil(item.valor_transaccion)
	                    });
	                });

	                response_ws.listInsertParameter = listInsertParameter;
	                console.log("..proceso terminado")

	                //enviamos al webService las inserciones	
	                madeclub_operation.insertar(listInsertParameter)
	                    .then(resultWS => {
	                        console.log(`se ha actualizado la información`, listInsertParameter);
	                        response_ws.json_response = JSON.stringify(resultWS);

	                        console.log("..insert after then")
	                        madeclub_operation.insert_h_log_ws_madeclub(response_ws)
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
	                        madeclub_operation.insert_h_log_ws_madeclub(response_ws)
                                .then(result => {
                                    console.log(result)
                                })
                                .catch(error => {
                                    console.log(error)
                                });
	                    });
	            } else {
	                console.log('no hay ventas para registrar');
	                response_ws.json_response = 'no hay ventas para registrar';
	                response_ws.sw_error = 1;

	                console.log("..insert after error 1")
	                madeclub_operation.insert_h_log_ws_madeclub(response_ws)
                        .then(result => {
                            console.log(result)
                        })
                        .catch(error => {
                            console.log(error)
                        });
	            }

	        })
	        .catch(err => {
	            err.log = "catch: ha ocurrido un error";
	            console.log("ha ocurrido un error ", err);
	            response_ws.json_response = JSON.stringify(err);
	            response_ws.sw_error = 1;

	            console.log("..insert after error 2")
	            madeclub_operation.insert_h_log_ws_madeclub(response_ws)
	                .then(result => {
	                    console.log(result)
	                })
	                .catch(error => {
	                    console.log(error)
	                });
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

		fecha_programacion = `0 02 9 * * *`;

		let job = new CronJob(fecha_programacion, () => {

		    console.log('corriendo tarea programada...');

		    //consulta el dia anterior
		    f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');
		        pos_dao.getLogWSMadeclub(f_proceso)
		            .then((resultQuery) => {
		                console.log("comprobando si existe registro del log", moment().format("YYYY-MM-DD HH:mm:ss"));
		                console.log("resultQuery.data", resultQuery.data);

		                if (resultQuery.data !== undefined && Array.isArray(resultQuery.data) && resultQuery.data.length !== undefined && resultQuery.data[0].length === 0) {
		                    madeclub_operation.programar_ventas();
		                }
		            });
		    },() => {
			/* This function is executed when the job stops */
			console.log('job has stopped');
		},
		false, /* Start the job right now */
		timeZone /* Time zone of this job. */
		);

		job.start();

		console.log("Finalizando tarea");
	},

	insert_h_log_ws_madeclub: function (body) {
	    return new Promise((resolve, reject) => {

	        let conexion = utils.clone(config.configBD2);

	        //Utilizar driver para controlar errores de conversión 
	        conexion.driver = "msnodesqlv8";
	        conexion.database = CONSTANTES.CORPORATIVADB;

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
	                            console.log("call insert dt_log", moment().format("YYYY-MM-DD HH:mm:ss"))
	                            console.log("OUT_CS_H_LOG_WS_MADECLUB", request.parameters.OUT_CS_H_LOG_WS_MADECLUB.value)

	                            let cantInserts = body.listInsertParameter.length;
	                            async.each(body.listInsertParameter, function(item, callback) {

	                                    var request_DT = new sql.Request(transaction);
	                                    request_DT.verbose = false;

	                                    request_DT.input('IN_CS_H_LOG_WS_MADECLUB', sql.BigInt, request.parameters.OUT_CS_H_LOG_WS_MADECLUB.value);
	                                    request_DT.input("IN_ID_PEDIDO", sql.VarChar, item.id_pedido);
	                                    request_DT.input("IN_CLIENTE_DOC", sql.VarChar, item.cliente_doc);
	                                    request_DT.input("IN_TIENDA_MADE", sql.VarChar, item.tienda_made);
	                                    request_DT.input('IN_FECHA_COMPRA', sql.VarChar, item.fecha_compra);
	                                    request_DT.input('IN_VALOR_TRANSACCION', sql.Decimal, item.valor_transaccion);

	                                    request_DT.output("MSG", sql.VarChar);

	                                    request_DT.execute('CORPORATIVA.SSP_INSERT_DT_LOG_WS_MADECLUB', function(err, recordsets, returnValue) {
	                                        if (err) {
	                                            // ... error checks
	                                            callback(err.message);

	                                        } else if (request_DT.parameters.MSG.value !== "OK") {
	                                            callback(request_DT.parameters.MSG.value);
	                                        } else {
	                                            cantInserts--;
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
	                                        transaction.rollback(function(err) {
	                                            // ... error checks
	                                            return;
	                                        });

	                                    } else {

	                                        if (cantInserts === 0) {
	                                            transaction.commit(function () {
	                                                resolve({
	                                                    //data: recordsets,
	                                                    MSG: "OK"
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
	},
};

module.exports  = madeclub_operation;