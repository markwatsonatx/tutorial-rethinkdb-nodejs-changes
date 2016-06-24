var config = require('./config');
var databaseController = require('./controllers/databaseController');
var express = require('express');
var gameController = require('./controllers/gameController');
var http = require('http');
var r = require('rethinkdb');
var WebSocketServer = require('websocket').server;

var app = express();
var webSocketServer;


(function(app) {
	
	// connect to RethinkDB
	// create games database and game table if necessary
    r.connect(config.rethinkdb, function(err, conn) {
        if (err) {
            console.log('Could not open a connection to initialize the database: ' + err.message);
        }
        else {
            console.log('Connected.');
            app.set('rethinkdb.conn', conn);
            databaseController.createDatabase(conn, config.rethinkdb.db)
                .then(function() {
                    return databaseController.createTable(conn, 'games');
                })
				.then(function() {
					return gameController.monitorAllGames(conn);
				})
                .catch(function(err) {
                    console.log('Error connecting to RethinkDB: ' + err);
                });
        }
    });
	
	// create http server and attach web socket server
	var server = http.createServer(function(request, response) {
		console.log(new Date() + ' WebSocket server received request for ' + request.url);
		response.writeHead(404);
		response.end();
	});
	server.listen(config.websocket.port, function() {
		console.log(new Date() + ' WebSocket server is listening on port ' + config.websocket.port);
	});
	webSocketServer = new WebSocketServer({httpServer: server, autoAcceptConnections: false});
	webSocketServer.on('request', function(request) {
		// route connection to webSocketController
		gameController.onWebSocketConnection(app, request);
	});
})(app);

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// start server on the specified port and binding host
app.listen(config.express.port, '0.0.0.0', function() {
  console.log("Server started.")
});