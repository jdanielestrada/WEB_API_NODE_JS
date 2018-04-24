var express           = require('express');
var fs                = require('fs');
var path              = require('path');
var favicon           = require('serve-favicon');
var logger            = require('morgan');
var cookieParser      = require('cookie-parser');
var bodyParser        = require('body-parser');
var cors              = require('cors');

let utils = require('./utils/utils');
let config = require('./utils/config');

//for operation cron
if( config.habilitadaProgramacion ){
    let operation = require('./services/madeclub/operation');
    operation.init_job();
}


//var multipart = require('connect-multiparty');
//var multipartMiddleware = multipart();

// Variable deployPath is set in web.config and must match
// the path of app.js in virtual directory.
// deployPath is set to empty string.
var deployPath = process.env.deployPath || "";

var app = express();


// var logDirectory = __dirname + '/log';
// // ensure log directory exists
// fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
// // create a rotating write stream
// var accessLogStream = FileStreamRotator.getStream({
//     date_format: 'YYYYMMDD',
//     filename   : logDirectory + '/access-%DATE%.log',
//     frequency  : 'daily',
//     verbose    : false
// });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'), {stream: accessLogStream});
app.use(logger('dev'));
//aumentar limite de recepción en el post
//http://stackoverflow.com/questions/19917401/node-js-express-request-entity-too-large
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * configuración de origen para permitir llamados a la api
 */
//var whitelist = ["http://192.168.1.43", "http://localhost:54940"];
//var corsOptions = {
//    origin: function (origin, callback) {
//        if (whitelist.indexOf(origin) !== -1) {
//            callback(null, true)
//        } else {
//            callback(new Error('Not allowed by CORS'))
//        }
//    }
//}
//app.use(cors(corsOptions));

app.use(cors()); //habilitar el cross domain

//cargar los módulos dinámicamente con sus rutas
//esta basado en convención
var routesDir = 'routes';
var archivos  = [];
//console.log("=========================== síncrono======================");
utils.scanSyncfilerecursive(routesDir, archivos);
archivos.forEach(file => {
    //enlazamos el módulo
    var moduloRuta = require('./' + file);
    //agregamos el módulo con la ruta
    var ruta       = file.replace('routes', '')
        .replace('.js', '');

    if (ruta === '/index') {
        ruta = "/";
    }
     
    console.log("cargando ruta...", file);

    app.use(deployPath + ruta, moduloRuta);
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err    = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error  : err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error  : {}
    });
});


module.exports = app;





