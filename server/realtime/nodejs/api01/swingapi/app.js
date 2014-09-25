
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});


// ================================================================
/**
 * Module independencies.
 */

// event loop
var io = require('socket.io').listen(app);
io.set('log level', 2);
// common environment
var totalSwingMagnitude = 0;
// connection loop
io.sockets.on('connection', function (socket) {

  // trigger by API commands
  socket.on('send msg', function (msg) {
    // echo back 
    socket.emit('push msg', msg);
    // broadcast
    socket.broadcast.emit('push msg', msg);
  });
  socket.on('send swing', function (mag) {
    console.log('socket.on with send swing');
    console.log(socket.id);

    totalSwingMagnitude += parseInt(mag);
    // echo back 
    var val = Math.round(Math.sqrt(totalSwingMagnitude));
    socket.emit('push swing', val );
  });
  socket.on('req total swing', function () {
    var val = Math.round(Math.sqrt(totalSwingMagnitude));
    // echo back 
    socket.emit('push swing', val );
  });

  // trigger by disconnection
  socket.on('disconnect', function() {
    console.log('disconnected');
  });
});

// execute intervally
var lastEmitMag = 0;
setInterval( function () {
  var val = Math.round(Math.sqrt(totalSwingMagnitude));
  if( val/lastEmitMag < 0.7 || 1.1 < val/lastEmitMag ) {
    io.sockets.emit('push swing', val );
    lastEmitMag = totalSwingMagnitude;
  }
  totalSwingMagnitude *= 0.9;
}, 100 );
