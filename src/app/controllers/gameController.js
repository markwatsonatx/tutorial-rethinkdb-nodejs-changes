var Client = require('../models/client');
var r = require('rethinkdb');

var changesCursor = null;
var clients = [];

module.exports.monitorAllGames = function(conn) {
	return r.table('games').changes().run(conn)
		.then(function(cursor) {
			changesCursor = cursor;
			cursor.each(function(err, row) {
				if (err) {
					throw err;
				}
				else {
					// send every game to every client
					var gameJson = JSON.stringify(row.new_val, null, 2);
					console.log(gameJson);
					for (var i=0; i<clients.length; i++) {
						if (clients[i].monitoringAllGames) {
							clients[i].connection.sendUTF(gameJson);
						}
					}
				}
			});
		})
		.catch(function(err) {
			console.log('Error monitoring all games: ' + err);
		});
};

module.exports.onWebSocketConnection = function(app, request) {
    console.log(new Date() + ' WebSocket connection accepted.');
    var connection = request.accept(null, request.origin);
	var client = new Client(connection, app);
    clients.push(client);
	// call onMessageReceivedFromClient when a new message is received from the client
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log(new Date() + ' WebSocket server received message: ' + message.utf8Data);
            onMessageReceivedFromClient(client, JSON.parse(message.utf8Data), app);
        }
    });
    connection.on('close', function(reasonCode, description) {
		// remove the client from the array on close
        clients.splice(clients.indexOf(client), 1);
        console.log(new Date() + ' WebSocket client ' + connection.remoteAddress + ' disconnected.');
    });
};

var onMessageReceivedFromClient = function(client, message, app) {
    if (message.monitorAllGames) {
        console.log(new Date() + ' Request received to monitor all games.');
		client.monitorAllGames(app);
    }
    else if (message.monitorGameId) {
		console.log(new Date() + ' Request received to monitor game ' + message.monitorGameId + '.');
		client.monitorGameById(message.monitorGameId, app);
	}
};