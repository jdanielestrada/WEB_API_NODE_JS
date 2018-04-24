var mkpath  = require('mkpath');
var fs      = require('fs');
var async   = require('async');
var http    = require('http');
var request = require('request');
var Promise = require('bluebird');

var utils = {

    // Decoding base-64 image
    // Source: http://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file
    decodeBase64Image: function (dataString) {
        var matches  = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        var response = {};

        if (matches.length !== 3) {
            return new Error('Invalid input string');
        }

        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');

        return response;
    },

    crearFileGestionDocumental: function (ruta, nombrearchivo, extension, archivo) {
        mkpath(ruta, function (err) {
            console.log("detalle:", ruta, nombrearchivo, extension);
            console.log("archivo length", archivo.length);
            var saved = fs.writeFileSync(ruta + nombrearchivo + "." + extension, utils.decodeBase64Image(archivo).data);
            console.log("saved: ", saved);

        });
    },
    //http://stackoverflow.com/questions/6089058/nodejs-how-to-clone-a-object
    //todo: migrar a Object.assign...
    clone                     : function (a) {
        return JSON.parse(JSON.stringify(a));
    },
    downloadFileToDisk        : function (url, dest, cb) {
        var file = fs.createWriteStream(dest);
        file.on('finish', function () {
            file.close(cb); // close() is async, call cb after close completes.
        });
        request.get(url)
            .pipe(file)
            .on('error', function (err) { // Handle errors
                fs.unlink(dest); // Delete the file async. (But we don't check the result)
                if (cb) cb(err.message);
            });
    },
    /**
     * genera codigo alfanumerico
     * http://jquery-manual.blogspot.com/2013/09/generar-codigo-aleatorio-partir-de.html
     * @param  {string} chars    secuencia de caracteres que formarán parte de la creación
     * @param  {int} longitud    la cantidad de secuencia que se devolvérán
     * @return {string}          secuencia aleatoria creada
     */
    generarAlfaNumerico       : function (chars, longitud) {
        var code = "";
        for (var x = 0; x < longitud; x++) {
            var rand = Math.floor(Math.random() * chars.length);
            code += chars.substr(rand, 1);
        }
        return code;
    },

    /**
     * allow catch error async or sync.
     * source:https://strongloop.com/strongblog/async-error-handling-expressjs-es7-promises-generators/
     * @param genFn
     * @returns {Function}
     */
    wrap: function (genFn) {
        var cr = Promise.coroutine(genFn);
        return function (req, res, next) {
            cr(req, res, next).catch(next)
        }
    },

    /**
     * utilidad para formatear los TO en la API SendinBlue
     * @param emails
     */
    formatearEmailSendinBlue: function (emails) {
        var emailAsociativo = emails.split(',').reduce(function (itemPrevio, itemActual) {
            return `${itemPrevio}  "${itemActual}" : "${itemActual}" ,`
        }, "{");
        emailAsociativo     = emailAsociativo.substring(0, emailAsociativo.length - 1) + "}";

        return JSON.parse(emailAsociativo);
    },

    scanfilerecursive    : function (dir, suffix, callback) {
        fs.readdir(dir, function (err, files) {
            var returnFiles = [];
            async.each(files, function (file, next) {
                var filePath = dir + '/' + file;
                fs.stat(filePath, function (err, stat) {
                    if (err) {
                        return next(err);
                    }
                    if (stat.isDirectory()) {
                        utils.scanfilerecursive(filePath, suffix, function (err, results) {
                            if (err) {
                                return next(err);
                            }
                            returnFiles = returnFiles.concat(results);
                            next();
                        })
                    } else if (stat.isFile()) {
                        if (file.indexOf(suffix, file.length - suffix.length) !== -1) {
                            returnFiles.push(filePath);
                        }
                        next();
                    }
                });
            }, function (err) {
                callback(err, returnFiles);
            });
        });
    },
    scanSyncfilerecursive: function (dir, filelist) {
        var fs    = fs || require('fs'),
            files = fs.readdirSync(dir);
        filelist  = filelist || [];
        files.forEach(function (file) {
            if (fs.statSync(dir + '/' + file).isDirectory()) {
                filelist = utils.scanSyncfilerecursive(dir + '/' + file, filelist);
            }
            else {
                filelist.push(dir + "/" + file);
            }
        });
        return filelist;
    },

    /**
     * Decimal adjustment of a number.
     * //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round#Example:_Decimal_rounding
     * http://stackoverflow.com/questions/1726630/formatting-a-number-with-exactly-two-decimals-in-javascript
     * raftel.util.decimalAdjust(56.555, 2)  => 56.56
     * @param {Number}  value The number.
     * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
     * @returns {Number} The adjusted value.
     */
    decimalAdjust: function (value, exp) {
        if (typeof exp === 'undefined' || +exp === 0)
            return Math.round(value);

        value = +value;
        exp   = +exp;

        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
            return NaN;

        // Shift
        value = value.toString().split('e');
        value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
    }
};

module.exports = utils;
