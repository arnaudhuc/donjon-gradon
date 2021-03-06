
/**
 * Module dependencies.
 */

var express = require('express');
var index = require('./routes');
var game = require('./routes/game');
var battle = require('./routes/battle');
var http = require('http');
var path = require('path');
var os = require('os');
var ifaces = os.networkInterfaces();
var test = "192.168.";
var mongo = require('mongodb');
var dbname = "test";
var app = express();
var appname = "Donjon & gradon";

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//LocalIp
var result = "";
for (var dev in ifaces) {
    for(var details in ifaces[dev]){
        var detail = ifaces[dev][details]
        if (detail.family=='IPv4' && detail.address.substr(0, test.length) == test) {
            result += detail.address+' ';
        }
    }
}
if(result == ''){
    result = '127.0.0.1';
}
ip = result.split(' ');


// Mongo
var db = mongo.MongoClient;

/*
 * Routes
 */
app.get('/',index.index(ip[0], db, dbname));
app.get('/new', index.newGame(ip[0], db, dbname));
app.post('/new', index.newGame(ip[0], db, dbname));
app.get('/game/:id', game.index(ip[0], db, dbname));
app.get('/del/:id', index.deletePlayer(ip[0], db, dbname));
app.get('/battle/:id/:en', battle.index(ip[0], db, dbname));




var server = http.createServer(app).listen(app.get('port'), function(){
    //Clear console
    var lines = process.stdout.getWindowSize()[1];
    for(var i = 0; i < lines; i++) {
        console.log('\r\n');
    }
    console.log("=== Welcome to " + appname + " ===");
    console.log("=== Express server listening on port " + app.get('port') + " ===");

});

//Web Socket
var io = require('socket.io')(server);
io.on('connection', function (socket) {
    socket.emit('ip', result);//Send Ip address for client, to allow them to connect to the server socket
    /*
    * Init Character stats
    */
    socket.on('created', function(data){
        socket.hero = data ;
        console.log(socket.id+' Hero : \n',socket.hero);
    });
    /*
     * Send status to the other player
     */
    socket.on('statusHero', function(data){
        socket.broadcast.emit('newPlayer', data)
    });
    /*
    * Remove HP
    */
    socket.on('loose', function(data){
        socket.hero.life = data;
        console.log(socket.hero.name + ' : ' + socket.hero.life);
        /*
        * Game Over
        */
        if(socket.hero.life == 0){
          socket.emit('gameOver', true);
        }
    });
});
