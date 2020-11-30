let soap         = require('strong-soap').soap;
let config       = require('../../utils/config');
//let madeclub_dto = require('./dto');
let utils        = require('../../utils/utils.js');
let CONSTANTES   = require('../../utils/constantes');
let async        = require('async');
let sql          = require('mssql');
let moment       = require("moment");
let axios        = require("axios");
let pos_dao      = require('../../dao/pos');

//let f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');
var f_proceso = moment().subtract(1, 'day').format('YYYY-MM-DD');;
var serverSendinBlue = config.serverEmailSendinBlue;

let sendEncuesta = {  
    
	sendEmailEncuestaExperienciaCompra : (req, res, next) => {
		config.configBD2.database = CONSTANTES.CRMBD;
		var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
			// ... error checks
			if (err) {
				console.error(err);
				return res.json(err);
			}
			// Stored Procedure
			var request = new sql.Request(connection);
			request.verbose = false;
			request.execute('CRM.SSP_POST_ENCUESTA_EXPERIENCIA_COMPRA', function (err, recordsets, returnValue) {
				if (err) {
					//return res.json(err);
				}
	
				array = recordsets[0];
				object = recordsets[1][0];
	
				console.log(array);
				console.log(object);
	
	
				let objetBase = recordsets[1][0];
				var count = 0
	
				array.forEach(function (item) {
	
					let template = utils.clone(object.plantilla);
					let pagina_destino = object.urlApp + item.prefijo_factura + '-' + item.nro_factura  + '-' + item.cs_id_orden; 
	
					template = template.replace(/{{numeroFactura}}/g, item.nro_factura);
					template = template.replace(/{{ticket.nombre_cliente}}/g, item.nombre_cliente);
					template = template.replace(/{{paginadestino.html}}/g, pagina_destino);
	
					item.plantillaEmail = template
					count++;
					if (count == array.length ) {
	
						let countSendEmail = 0;
	
						array.forEach(function (sendEncuesta) {
					   
							let emailTest = 'elkin.gutierrez@madecentro.co'

						var formatoEmail = {
	
							//"to": utils.formatearEmailSendinBlue(sendEncuesta.contacto_cliente),
							"to": utils.formatearEmailSendinBlue(emailTest),
							"from": ["notificaciones@madecentro.co", "notificaciones@madecentro.co"],
							"subject": object.asunto_email,
							"html": sendEncuesta.plantillaEmail
						};
	
					   // console.log(formatoEmail);
	
						countSendEmail++;
	
					   
							serverSendinBlue.send_email(formatoEmail)
								if(countSendEmail == (array.length )){
									//res.json('Correos Enviados');
									console.log('Correos Enviados');
								};
	
					});
	
				   
					};
					
				});
			});
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

		//fecha_programacion = `0 02 9 * * *`;
		fecha_programacion = `0 45 15 * * *`;

		let job = new CronJob(fecha_programacion, () => {

		    console.log('corriendo tarea programada...');
			 sendEncuesta.sendEmailEncuestaExperienciaCompra();

			
		},
		false, /* Start the job right now */
		timeZone /* Time zone of this job. */
		);
		
		job.start();

		console.log("Finalizando tarea");
	},
};

module.exports  = sendEncuesta;