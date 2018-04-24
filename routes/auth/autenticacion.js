var express = require('express');
var router = express.Router();
var email = require('emailjs');
var pdf = require('html-pdf');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var _ = require('underscore')._;
var fs = require('fs');
var mkpath = require('mkpath');
var sqlServerConnection = require('../../utils/sqlServerConnection');
var CONSTANTES = require('../../utils/constantes');
var crypto = require('crypto');

//configuración básica del correo
var server = email.server.connect({
    user: 'madecentro@madecentro.co',
    password: 'M811028650',
    host: 'smtp.gmail.com',
    ssl: true
});

var pathBaseGestionDocumental = "./public/uploads";



/* GET autenticacion listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource autenticacion');
});

router.post('/login', function (req, res, next) {
    var usuario = req.body.username;
    var contrasena = req.body.password;
    var sqlconexion = new sqlServerConnection();
    //var request = sqlServerConnection.getRequest(CONSTANTES.MADECENTROBD, 'CORPORATIVA.SSP_AUTHENTICARUSARIO');
    var request = sqlconexion.getRequest(CONSTANTES.CORPORATIVADB, 'CORPORATIVA.SSP_AUTHENTICARUSARIO');
    console.log(request);
    //se agregan los parametros entradas y salidas del SP
    request.addOutputParameter('MSG', TYPES.VarChar);
    request.addParameter('INUSER', TYPES.VarChar, usuario);
    request.addParameter('INPW', TYPES.VarChar, crypto.createHash('md5').update(contrasena).digest('hex'));
    console.log('la contrasena a validar => ' + crypto.createHash('md5').update(contrasena).digest('hex'));
    //se  captura la promesa
    sqlconexion.ejecutarStoredProcedure(request)
        .then(function (result) {
            res.json(result);
            console.log('terminado');
        })
        .catch(function (err) {
            console.log(err);
        });
});

module.exports = router;
/***/

//TODO: archivos de configuración, refactorizar esto más adelante.
//
//
var configUnoEE = {
    userName: 'sa',
    password: 'Ab123456',
    server: '192.168.1.21',
    options: {
        instanceName: 'WMS',
        database: 'unooe_lab',
        rowCollectionOnDone: true,
        rowCollectionOnRequestCompletion: true
    }
};


var configMadecentro = {
    userName: 'sa',
    password: 'Ab123456',
    server: '192.168.1.21',
    options: {
        instanceName: 'WMS',
        database: 'Madecentro_dllo',
        rowCollectionOnDone: true,
        rowCollectionOnRequestCompletion: true
    }
};

var configCRM = {
    userName: 'sa',
    password: 'Ab123456',
    server: '192.168.1.21',
    options: {
        instanceName: 'WMS',
        database: 'MDC_CRM',
        rowCollectionOnDone: true,
        rowCollectionOnRequestCompletion: true
    }
};

/**
 * formatea  rows al estilo de tablas en sqlserver, para su mejor manejo
 * estabamos basadso en el supuesto que los valores de retorno se ejecutan primero
 * @param  {[type]} rows [description]
 * @return {[type]}      [description]
 */
//function formatSqlResult(rows, retornoValues) {
//    //se recorren las filas del elementos
//    var result = [];
//    _.each(rows, function (fila) {

//        var item = '{';
//        //se recorre cada columna
//        var inicio = '';
//        _.each(fila, function (columna) {
//            item = item + inicio + '"' + columna.metadata.colName + '" : "' + columna.value + '"';
//            inicio = ',';
//        });
//        item = item + '}';

//        result.push(JSON.parse(item));
//    });
//    //envolvemos el objeto en forma DTO { data:[{},{},{},{}], varOutput1:"val1", varOutput2:"val2"}
//    result = {
//        data: result
//    };
//    //console.log("retornoValues", retornoValues);
//    //extendemos el objeto,adicionamos los valores de salida
//    _.each(retornoValues, function (valoresRetorno) {
//        _.extend(result, valoresRetorno);
//    });



//    return result;
//}

// Decoding base-64 image
// Source: http://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file
function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}

