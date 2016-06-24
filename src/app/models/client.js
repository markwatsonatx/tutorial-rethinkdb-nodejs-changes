var gameController = require('../controllers/gameController');
var r = require('rethinkdb');

// when a client is first created it will monitor all games
function Client(connection, app) {
    this.connection = connection;
}

Client.prototype.monitorAllGames = function(app) {
    if (this.monitoringGameIdCursor) {
		this.monitoringGameIdCursor.close();
		this.monitoringGameIdCursor = null;
	}
	this.monitoringAllGames = true;
	this.monitoringGameId = null;
	// get all the games and push to the client
	var webSocketConnection = this.connection;
	gameController.getGames(app)
		.then(function(games) {
			for (var i=0; i<games.length; i++) {
				var gameJson = JSON.stringify(games[i], null, 2);
				webSocketConnection.sendUTF(gameJson);
			}
		})
		.catch(function(err) {
			console.log('Error monitoring all games: ' + err);
		});
};

Client.prototype.monitorGameById = function(gameId, app) {
    this.monitoringAllGames = false;
	this.monitoringGameId = gameId;
	var webSocketConnection = this.connection;
    var dbConnection = app.get('rethinkdb.conn');
    r.table('games').get(this.monitoringGameId).changes({includeInitial:true}).run(dbConnection)
		.then(function(cursor) {
			// store cursor, so we can stop if necessary
			this.monitoringGameIdCursor = cursor;
			cursor.each(function(err, row) {
				if (err) {
					throw err;
				}
				else {
					// send the new game value to the client
					var gameJson = JSON.stringify(row.new_val, null, 2);
					webSocketConnection.sendUTF(gameJson);
				}
			});
		})
		.catch(function(err) {
			console.log('Error monitoring game ' + gameId + ': ' + err);
		});
};

// export the class
module.exports = Client;