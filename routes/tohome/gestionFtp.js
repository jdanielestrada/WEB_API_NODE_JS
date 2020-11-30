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



router.get('/get_ftp', function (req, res, next) {

    var ftpClient = require('./lib/client.js'),
        config = {
            host: 'integrationftp.truecommerce.com',
            port: 8080,
            user: '123052049223',
            password: 'Tuhome68539!'
        },
        options = {
            logging: 'basic'
        },
        client = new ftpClient(config, options);

        client.connect(function () {

        client.upload(['Transaction/**'], '/IntegrationFTP/Export/Tuhome Furniture/Transaction', {
            baseDir: 'Transaction',
            overwrite: 'older'
        }, function (result) {
            console.log(result);
        });

        client.download('/IntegrationFTP/Export/Tuhome Furniture/Transaction', 'Transaction/', {
            overwrite: 'all'
        }, function (result) {
            console.log(result);
        });

    });
});



router.post('/generar_pedidos_ftp', function (req, res, next) {

    let base_ruta = CONSTANTES.base_ruta    //'C:/FTP/'  

    let ftp =CONSTANTES.ftp    //'VM'

    let fecha_actual = moment().format("YYYY-MM-DD")
    console.log(fecha_actual)

    let formato_archivo =CONSTANTES.formato_archivo   // '/vmu-'

    let extencion ='.csv'

    let ruta_acrhivo = base_ruta + ftp + formato_archivo + fecha_actual + extencion

    var documento_cliente =CONSTANTES.documento_cliente_ftp  //'900447351' 	//lab
    //var documento_cliente ='901266454' 	//real
    var nombre_cliente   = CONSTANTES.nombre_cliente_ftp //'VIRTUAL MUEBLES S A S'

    var tipo_pedido = 3

    var arreglocsv = [];

    var log_insert  = CONSTANTES.log_insert_ftp//3969

    fs.readFile(ruta_acrhivo, 'utf8', function (err, data) {
        var dataArray = data.split(/\r?\n/);
        console.log(dataArray);

        var contenido = data



        //separa objetos por salto de linea
        let separata = contenido.split("\n");

        //asignar cabecera los separa por ',' 
        var cabecera = separata[0].split(';');
        separata.splice(0, 1);
       //var arreglocsv = [];
       for (var j = 0; j < separata.length; j++) {
        var objetojson = {};

        var item = separata[j].split(';');

       

        for (var i = 0; i < cabecera.length; i++) {
            objetojson[cabecera[i]] = item[i];
        }

        console.log(objetojson)
        if (objetojson.DIRECCION_CLIENTE !== '' && objetojson.DIRECCION_CLIENTE !== undefined) {
            arreglocsv.push({
            
            
                NOMBRE_CLIENTE: objetojson.NOMBRE_CLIENTE,
                CEDULA_CLIENTE: objetojson.CEDULA_CLIENTE,
                NRO_OC: objetojson.ORDEN_COMPRA,
                DIRECCION_CLIENTE: objetojson.DIRECCION_CLIENTE,
                DEPARTAMENTO_CLIENTE: objetojson.DEPARTAMENTO_CLIENTE,
                CUIDAD_CLIENTE: objetojson.CIUDAD_CLIENTE,
                C_PRODUCTO: objetojson.REFERENCIA_PROVEEDOR,
                CODIGO_BARRAS: objetojson.CODIGO_BARRAS,
                CANTIDAD: objetojson.CANTIDAD,
                OBSERVACION:objetojson.OBSERVACIONES,
                C_TINDA:objetojson.TIENDA_ID,
                TELEFONO_CLIENTE: objetojson.TELEFONO_CLIENTE_1,
                SUCURSAL:objetojson.SUCURSAL,
                NOMBRE_PROBEEDOR:objetojson.NOMBRE_PROVEEDOR
            

            });
        }
        
    }

    if(arreglocsv.length > 0){

        config.configBD2.database = CONSTANTES.POSDB;
        var connection = new sql.Connection(utils.clone(config.configBD2),
            function (err) {
            });
        var transaction = new sql.Transaction(connection);
    
        transaction.begin(function (err) {
            // ... error checks
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                res.end();
                return;
            }
    
            const tableDatos = new sql.Table();
  
            console.log(arreglocsv)
    
            tableDatos.columns.add("documento_cliente", sql.VarChar);
            tableDatos.columns.add("nombre_cliente", sql.VarChar);
            tableDatos.columns.add("cs_id_usuario", sql.Int);
            tableDatos.columns.add("documento_cliente_ecommerce", sql.VarChar);
            tableDatos.columns.add("nombre_cliente_ecommerce", sql.VarChar);
            tableDatos.columns.add("orden_compra", sql.VarChar);
            tableDatos.columns.add("direccion_cliente", sql.VarChar);
            tableDatos.columns.add("c_departamento", sql.VarChar);
            tableDatos.columns.add("c_cuidad", sql.VarChar);
            tableDatos.columns.add("c_tipo_pedido", sql.VarChar);
            tableDatos.columns.add("referencia", sql.VarChar);
            tableDatos.columns.add("codigo_barras", sql.VarChar);
            tableDatos.columns.add("cantidad", sql.Decimal(14, 2));
            tableDatos.columns.add("observacion", sql.VarChar);
            tableDatos.columns.add("c_tienda", sql.VarChar);
            tableDatos.columns.add("telefono_cliente", sql.VarChar);
            tableDatos.columns.add("c_sucursal", sql.VarChar);
    
            tableDatos.rows.add(
                documento_cliente,
                nombre_cliente,
                log_insert,
                item.CEDULA_CLIENTE.replace('"',''),
                item.NOMBRE_CLIENTE.replace('"',''),
                item.NRO_OC,
                item.DIRECCION_CLIENTE.replace('"',''),
                item.DEPARTAMENTO_CLIENTE,
                item.CUIDAD_CLIENTE.replace('"',''),
                tipo_pedido,
                item.C_PRODUCTO.replace('"',''),
                item.CODIGO_BARRAS,
                item.CANTIDAD,
                item.OBSERVACION || '',
                item.C_TINDA,
                item.TELEFONO_CLIENTE || '',
                item.SUCURSAL
            );

            console.log(tableDatos);
  
            const request = new sql.Request(transaction);
            request
                .input("IN_DATA_OV", tableDatos)
                .input("IN_TIPO_PEDIDO", sql.Int, tipo_pedido)
                .input("IN_LOG_INSERT", sql.Int, log_insert)
                .output("MSG", sql.VarChar)
    
                .execute('POS.SSP_INSERT_OV_FROM_PLANO',
                function (err, recordsets, returnValue) {
                    if (err) {
                        console.log(err);
                        transaction.rollback(function (err) {
                        });
                        res.json({
                            error: err,
                            MSG: err.message
                        });
                        res.end();
                        return;
                    }
    
                    if (request.parameters.MSG.value !== "OK") {
    
                        transaction.rollback(function (err2) { // ... error checks
                        });
                        res.json({
                            error: "err",
                            MSG: request.parameters.MSG.value
                        });
                        res.end();
    
                    } else {
                        transaction.commit(function (err, recordset) {
                           
                            console.log("Transaction commited.");
    
                            res.json({
                                data: recordsets,
                                'MSG': request.parameters.MSG.value
                            });
                            res.end();
                        });
                    }
                });
        });
  

      }




      });

 
});







module.exports = router;