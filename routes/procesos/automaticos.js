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
// var exec = require('child_process')



router.post('/ejecutar_bat_pedidos', function (req, res, next) {
    console.log(req.body);

    const exec = require('child_process').exec;  
    exec('C:/prueba.bat', (err, stdout, stderr) => {  
      if (err) {  
        console.error(err);  
        return;  
      }  
      console.log('ejecutado correctamente!');  
      return;  
    });  
});



router.post('/ejecutar_bat_pedidos', function (req, res, next) {

    // Process();
    const exec = require('child_process').exec

    const x = 3;
    const y = 15;
    
    exec('./prueba.bat ' + x + ' ' + y, (err, stdout) =>{
        if(err){
            throw err;
        }
    
        console.log('Comando ejecutado');
        console.log(stdout);
    });
});

function Process() {
    const { spawn } = require('child_process');
    const bat = spawn('cmd.exe', ['/c', 'prueba.bat']);
    
    bat.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    bat.stderr.on('data', (data) => {
      console.log(data.toString());
    });
    
    bat.on('exit', (code) => {
      console.log(`Child exited with code ${code}`);
    });
    };







module.exports = router;
