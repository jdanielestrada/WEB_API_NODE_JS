#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('./app');
var debug = require('debug')('Madecentro.Pos.WebApi.Nodejs:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

/**
 * soportamos socket io en el proyecto
 * @type {[type]}
 */
var io = require('socket.io')(http.createServer(app));


io.on('connection', function(client) {
    console.log('Client connected...');

    client.on('join', function(data) {
        //console.log(data);
        client.emit('join', 'ok');
    });

    client.on('disconnect', function(){
        console.log('user disconnected');
    });

});


//var port = normalizePort(process.env.PORT || '1600');
//app.set('port', process.env.PORT);
app.listen('1600');//process.env.PORT || 
