var r = require('rethinkdb');

// when a client is first created it will monitor all games
function Client(connection, app) {
    this.connection = connection;
    this.monitorAllGames(app);
}

Client.prototype.monitorAllGames = function(app) {
    if (this.monitoringGameIdCursor) {
		this.monitoringGameIdCursor.close();
		this.monitoringGameIdCursor = null;
	}
	this.monitoringAllGames = true;
	this.monitoringGameId = null;
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
					console.log(gameJson);
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