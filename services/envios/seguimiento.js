let soap         = require('strong-soap').soap;
let config       = require('../../utils/config');
let madeclub_dto = require('./dto');
let utils        = require('../../utils/utils.js');
let CONSTANTES   = require('../../utils/constantes');
let async        = require('async');
let sql          = require('mssql');
let moment       = require("moment");
let axios        = require("axios");
let pos_dao      = require('../../dao/pos');

//let f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');
var f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');;

let seguimientoGuia = {
    
	actualizarEstado : (listInsertParameter , session_id) => {
	    return new Promise((resolve, reject) => {

	        let datos = {
	            "transacciones": listInsertParameter
	        }
            
	    });
	},
    
	consultarPedidos : () => {
		//consultamos la data
	    f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');
		let response_ws = {
		    json_response         : "",
		    listInsertParameter   : [],
		    sw_error              : 0
		};
        
		//consulta el dia anterior
	    pos_dao.getPedidosDespachados(f_proceso)
	        .then((resultQuery) => {
	            console.log(" get PEDIDOS DESPACHADOS", moment().format("YYYY-MM-DD HH:mm:ss"))
	            if (resultQuery.data !== undefined && Array.isArray(resultQuery.data) && resultQuery.data.length > 0 && resultQuery.data[0].length > 0) {

	                //organizamos el dto
	                let listInsertParameter = [];
	                //   console.log("existe cliente 1152448268")

	                resultQuery.data[0].forEach(item => {
	                    listInsertParameter.push({
	                        nro_guia        : item.nro_guia,
	                        cs_id_orden      : item.cs_id_orden,
	                        c_transportadora      : item.c_transportadora_envio
	                    });
	                });

	                response_ws.listInsertParameter = listInsertParameter;
	                console.log("..proceso terminado")

	                //enviamos al webService las inserciones	
	                seguimientoGuia.actualizarEstado(listInsertParameter)
	                    .then(resultWS => {
	                        console.log(`se ha actualizado la información`, listInsertParameter);
	                        response_ws.json_response = JSON.stringify(resultWS);

	                    })
	                    .catch(errWS => {
	                        console.log('ha ocurrido un error mientras se llamaba al ws', errWS);
	                        console.log("listInsertParameter", listInsertParameter);
	                        response_ws.json_response = JSON.stringify(errWS);
	                        response_ws.sw_error = 1;
	                    });
	            } else {
	                console.log('no hay ventas para registrar');
	                response_ws.json_response = 'no hay ventas para registrar';
	                response_ws.sw_error = 1;

	                console.log("..insert after error 1")
	           
	            }

	        })
	        .catch(err => {
	            err.log = "catch: ha ocurrido un error";
	            console.log("ha ocurrido un error ", err);
	            response_ws.json_response = JSON.stringify(err);
	            response_ws.sw_error = 1;

	            console.log("..insert after error 2")
	         
	        });

	},

	init_job : () => {
		console.log("Iniciando tarea");
        
		let CronJob            = require('cron').CronJob;
		let fecha_programacion = `00 00 ${config.horaEjecucionMadeClub} * * 1-5`;
		let timeZone           = 'America/Bogota';

	    //Seconds: 0-59 * 
	    //Minutes: 0-59 * (*/1 cada min)
	    //Hours: 0-23 *
	    //Day of Month: 1-31 *
	    //Months: 0-11 *
	    //Day of Week: 0-6 *

		fecha_programacion = `0 0 */1 * * *`;

		let job = new CronJob(fecha_programacion, () => {

		    console.log('corriendo tarea programada...');

		    //consulta el dia anterior
		    f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');
		        seguimientoGuia.consultarPedidos();
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


};

module.exports  = seguimientoGuia;