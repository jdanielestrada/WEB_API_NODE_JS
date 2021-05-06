var email = require('emailjs');
//no soporta module commonjs
require('../node_modules/mailin-api-node-js/V2.0/mailin.js');

var config = {

    configBD : {
        userName: 'desarrollo',
        password: 'Mdcdllo2015',
        server: '192.168.1.47',
        options: {
            instanceName: 'MDCDLLO',
            database: '',
            rowCollectionOnDone: true,
            rowCollectionOnRequestCompletion: true,
            useUTC: false,
            requestTimeout: 30000,
            connectionTimeout : 30000
        }
    },
    //configuración usada por la librería mssql
   
    configBD2 : {

        user: 'desarrollo',
        password: 'Mdcdllo2015',
        server: '192.168.1.47\\MDCDLLO',
        database: '',
        requestTimeout : 30000,
        connectionTimeout : 30000
        // user: 'proyectos',
        // password: 'MDC811028650',
        // server: '192.168.1.48', // ZEUS_1
        // database: '',
        // requestTimeout: 30000

    },

    //configBD2: {
    //    user: 'proyectos',
    //    password: 'MDC811028650',
    //    server: '192.168.1.31',
    //    database: '',
    //    requestTimeout: 240000,
    //    connectionTimeout: 30000
    //},

    configBDPROD : {

        user: 'proyectos',

        password: 'MDC811028650',

        server: '192.168.1.31', // ZEUS_1

        database: '',
        requestTimeout: 240000

    },
    //*** DB de conexion la UnoEE-Copia1 en apolo
    //configBD3: {
    //    user: 'desarrollo',
    //    password: 'Desarrollo12345',
    //    server: '192.168.1.31', // apolo
    //    database: '',
    //},

    //configuración básica del correo
    serverEmail : email.server.connect({
        user: 'informacion@madecentro.co',
        password: 'Mdc811028650',
        host: 'smtp.gmail.com',
        ssl: true
    }),


    serverEmailSendinBlue : new  Mailin("https://api.sendinblue.com/v2.0","zdr46mO8E7vxAYaI"),
    
    pathBaseGestionDocumental : 'D:',
    
    urlWSMadeclub:   'https://www.madecentro.com/api?wsdl',
    usuarioMadeclub: "SAM0417",
    apiKeyMadeClub:  "madecentro",
    horaEjecucionMadeClub : '03',
    habilitadaProgramacion : false,

    restriccion_host_sam: "app.madecentro.com",
    host_app: "https://app.madecentro.com",

    /**
     * /nodemailer config
     */
    nodemailer_config: {
        account: {
            user: 'madecentro@madecentro.co',
            pass: 'M811028650'
        },
        host: 'smtp-relay.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        from: 'Notificaciones Madecentro <notificaciones@madecentro.co>'
    },
	
    version_apps: [
        {
            id_aplicacion: 1,
            d_aplicacion: "pedidos",
            version: "1.4.0",
            date_version: "20201120" //YYYYMMDDHHmm
        },
        {
            id_aplicacion: 2,
            d_aplicacion: "diseno",
            version: "3.14.0",
            date_version: "201806191547" //YYYYMMDDHHmm
        }		
    ]

};

module.exports = config;