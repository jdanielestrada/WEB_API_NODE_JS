(function(module) {
    "use strict";
    var Q = require('q');
    var config = require('./config');
    var utils = require('./utils.js');
    var constantes = require('./constantes');
    var Connection = require('tedious').Connection;
    var Request = require('tedious').Request;
    var _ = require('underscore')._;
    var ConnectionPool = require('tedious-connection-pool');


    var poolConfig = {
        min: 2, // 5
        max: 4, // 20
        retryDelay: 5000,
        acquireTimeout: 60000, //40000,
        log: false
    };


    var sqlServerConnection = function() {

        return {
            request: {},
            response: {
                data: []
            },
            retornoValues: [],
            deferred: Q.defer(),
            configBD: {},


            /**
             * [getRequest description]
             * @param  {[type]} nameDb [description]
             * @param  {[type]} nameSp [description]
             * @return {[type]}        [description]
             */
            getRequest: function(nameDb, nameSp) {
                //seteamos la data
                config.configBD.options.database = nameDb;
                var self = this;
                self.deferred = Q.defer();
                self.request = {};
                self.configBD = utils.clone(config.configBD);
                self.response = {
                    data: []
                };
                self.retornoValues = [];


                self.request = new Request(nameSp, function(err, rowCount, rows) {

                    if (err) {
                        console.log(err);
                        self.deferred.reject(err);
                    }
                    //hacer un tratamiento a la data rows para ponerla organizada
                    _.each(self.retornoValues, function(valoresRetorno) {
                        _.extend(self.response, valoresRetorno);
                    });

                    self.deferred.resolve(self.response);

                });
                return self.request;
            },

            /**
             *  Retorna una promesa de la consutal del SP
             *  @param {string}  nameDb         nombre de la instancia de la BD que se conectará
             * @param  {sting}   nameSp         nombre del SP con su esquema
             * @param  {string}  request        objetos con todos los parámetros de entrada y salida que recibe el SP
             * @return {PROMISE}                promesa con la  consulta del SP
             */
            ejecutarStoredProcedure: function(request) {
                var self = this;
                console.log('conectado a la base de datos');

                var pool = new ConnectionPool(poolConfig, self.configBD);

                //var connection = new Connection(config.configBD);
                //console.log(pool);
                try { //nos conectamos//nos conectamos
                    //connection.on('connect', function(err) {
                    pool.acquire(function(err, connection) {
                        if (err)
                            console.error(err);

                        var request2 = request;

                        //necesarios para armar el DTO necesario del negocio
                        request2.on('returnValue', function(parameterName, value, metadata) {
                            self.retornoValues.push(JSON.parse('{"' + parameterName + '" : "' + value + '"}'));
                        }.bind(self));

                        request2.on('doneInProc', function(rowCount, more, rows) {

                            if (rows !== null && rows !== undefined && rows.length > 0) {
                                self.response.data.push(self.formatear(rows));
                            }

                        }.bind(self));

                        connection.callProcedure(request2);
                    });


                    pool.on('error', function(err) {
                        console.log(err);

                    });

                } catch (error) {
                    console.log(error);
                    return self.deferred.promise;
                }

                return self.deferred.promise;
            },



            //utilidades
            //

            /**
             * formatea  rows al estilo de tablas en sqlserver, para su mejor manejo
             * estabamos basadso en el supuesto que los valores de retorno se ejecutan primero
             * @param  {[type]} rows [description]
             * @return {[type]}      [description]
             */
            formatear: function formatSqlResult(rows) {
                //se recorren las filas del elementos
                var result = [];
                _.each(rows, function(fila) {

                    var item = '{';
                    //se recorre cada columna
                    var inicio = '';
                    _.each(fila, function(columna) {
                        if (typeof(columna.value) === "string") {
                            columna.value = columna.value.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"").trim();

                        }
                        item = item + inicio + '"' + columna.metadata.colName + '" : "' + columna.value + '"';
                        // else{
                        //     item = item + inicio + '"' + columna.metadata.colName + '" : ' + columna.value + '';
                        // }

                        inicio = ',';
                    });
                    item = item + '}';

                    result.push(JSON.parse(item));
                });
                //envolvemos el objeto en forma DTO { data:[{},{},{},{}], varOutput1:"val1", varOutput2:"val2"}

                return result;
            }

        };
    };
    module.exports = sqlServerConnection;

})(module);
