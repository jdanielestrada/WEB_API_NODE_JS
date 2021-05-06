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
var AWS = require('aws-sdk');



router.post('/get_autenticar_ususario', function (req, res, next) {
    console.log(req.body);

    var usuario = req.body.usuario;
    var contrasena = req.body.password;

    config.configBD2.database = CONSTANTES.CORPORATIVADB;
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

        request.execute('CORPORATIVA.SSP_AUTENTICARUSUARIO_RTA', function (err, recordsets, returnValue) {
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




router.post('/PostForm/:id_log_insert/:extension',

multipartMiddleware, function (req, res) {

    console.log(req.params);
    console.log(req.body);
    console.log(req.files)


    config.configBD2.database = CONSTANTES.DISENOBD;

    var connection = new sql.connect(utils.clone(config.configBD2), function (err) {

        const transaction = new sql.Transaction(connection);

        transaction.begin(function (err) {
            // ... error checks
            if (err) {
                console.error(err);
                //res.status(err.status || 500);
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                });
                sql.close();
                return;
            }

            // Stored Procedure 
            var request = new sql.Request(transaction);

            request.verbose = true;
            request.input('IN_REFERENCIA', sql.VarChar, req.body.referencia);
            request.input('IN_LOG_INSERT', sql.Int, req.params.id_log_insert);
            request.input('IN_EXTENSION', sql.VarChar, req.params.extension);
            request.input('IN_OBSERVACION', sql.VarChar, req.body.observacion || null);
            request.input('IN_VERSION', sql.Int, req.body.version || 1);
            request.input('IN_ID_ESTRUCTURA', sql.VarChar, req.body.id_estructura || null);
         
            //parámetros de salidas
            request.output('OUT_NOMBRE_ARCHIVO', sql.VarChar);
            request.output('OUT_RUTA_AMAZON_GESTION_DOCUMENTAL', sql.VarChar);
            request.output('MSG', sql.VarChar);

            request.execute('DISENO.SSP_INSERT_DOCUMENTOS', function (err, recordsets, returnValue) {
                if (err) {
                    
                    res.json({
                        error: err,
                        MSG: err.message
                    });
                    transaction.rollback(err => {
                        // ... error checks
                    })
                    sql.close();
                } else {

                    if (request.parameters.MSG.value!= "GUARDADO") {
                        //res.status(500);
                        console.log('entroo aca 2');
                        res.json({
                            error: "err",
                            MSG: request.parameters.MSG.value
                        });
                        transaction.rollback(err => {
                            // ... error checks
                        });
                        sql.close();
                    } else {
                        var nombre_archivo = request.parameters.OUT_NOMBRE_ARCHIVO.value.trim() + '.' + req.params.extension;
                        var rutaFisicaServidor = request.parameters.OUT_RUTA_AMAZON_GESTION_DOCUMENTAL.value;
                        var file = req.files.file;
                        
                        
                        nombre_archivo =nombre_archivo.trim();
                        console.log(nombre_archivo);

                        console.log(rutaFisicaServidor);
                        console.log(file)


                        AWS.config.update({
                            accessKeyId: 'AKIA564SKHXJDNQRHCPW',
                            secretAccessKey: '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'
                        });


                        fs.readFile(file.path, function (err, data) {

                            var dataArchivo = data

                            if (err) throw err; // Something went wrong!
                            var s3bucket = new AWS.S3(); //({ params: { Bucket: 'mdcpruebaupload' } });
                            s3bucket.createBucket(function () {
                                var params = {
                                    //Key: file.originalFilename, //file.name doesn't exist as a property
                                    //Body: data,
                                    Bucket: rutaFisicaServidor,
                                    Key: nombre_archivo,
                                    Body: data,
                                    ACL: 'public-read',
                                    ContentType: "application/pdf"
                                };
                                s3bucket.upload(params, function (err, data) {
                                    let savePath = rutaFisicaServidor + "/" + nombre_archivo;

                                    // Whether there is an error or not, delete the temp file
                                    fs.unlink(file.path, function (err) {
                                        if (err) {
                                            console.error(err);
                                            res.json({
                                                error: err,
                                                MSG: err.message
                                            });
                                            transaction.rollback(err => {
                                                // ... error checks
                                            });
                                            sql.close();
                                        }
                                        console.log('Temp File Delete');
                                    });

                                    console.log("PRINT FILE:", nombre_archivo);
                                    if (err) {
                                        console.log('ERROR MSG: ', err);
                                        // reject(err);
                                    } else {
                                        console.log('Successfully uploaded data');
                                

                                        transaction.commit(function (err) {
                                     
                                            console.log("Transaction commited.");
                                        });
                                        res.json({
                                            'MSG': request.parameters.MSG.value
                                        });
                                        sql.close();


                              
                                    }
                                });
                            });
                        });

                    }
                }
            });
        });



    });

});





module.exports = router;
