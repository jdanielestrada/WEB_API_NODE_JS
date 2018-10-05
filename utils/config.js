var email = require('emailjs');
//no soporta module commonjs
require('../node_modules/mailin-api-node-js/V2.0/mailin.js');

var config = {

    //configBD : {
    //    userName: 'desarrollo',
    //    password: 'Mdcdllo2015',
    //    server: '192.168.1.37',
    //    options: {
    //        instanceName: 'MDCDLLO',
    //        database: '',
    //        rowCollectionOnDone: true,
    //        rowCollectionOnRequestCompletion: true,
    //        useUTC: false,
    //        requestTimeout: 30000,
    //        connectionTimeout : 30000
    //    }
    //},
    //configuración usada por la librería mssql
    //configBD2 : {
    //    user: 'desarrollo',
    //    password: 'Mdcdllo2015',
    //    server: '192.168.1.37\\MDCDLLO',
    //    database: '',
    //    requestTimeout : 30000,
    //    connectionTimeout : 30000
    //},

    configBD3 : {
        user: 'sa',
        password: 'biable01',
        server: '192.168.1.20',
        database: '',
        requestTimeout : 30000,
        connectionTimeout : 30000
    },

    // //configuración básica del correo
    // serverEmail : email.server.connect({
    //     user: 'informacion@madecentro.co',
    //     password: 'm811028650',
    //     host: 'smtp.gmail.com',
    //     ssl: true
    // }),

    // serverEmailSendinBlue : new  Mailin("https://api.sendinblue.com/v2.0","zdr46mO8E7vxAYaI"),


    pathBaseGestionDocumental: 'C:',
    rutaImgProductos:"/img_rta/"
};

module.exports = config;