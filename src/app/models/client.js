var r = require('rethinkdb');

// when a client is first created it will monitor all games
function Client(connection) {
    this.connection = connection;
    this.monitorAllGames();
}

Client.prototype.monitorAllGames = function(app) {
    if (this.monitorGameIdCursor) {
		this.monitorGameIdCursor.close();
		this.monitorGameIdCursor = null;
	}
	this.monitorAllGames = true;
	this.monitorGameId = null;
};

Client.prototype.monitorGameById = function(gameId, app) {
    this.monitorGameId = gameId;
    var wsConn = this.connection;
    var rdbConn = app.get('rethinkdb-conn');
    r.table('games').get(this.gameId).changes({includeInitial:true}).run(conn)
		.then(function(cursor) {
			// store cursor, so we can stop if necessary
			this.monitorGameIdCursor = cursor;
			cursor.each(function(err, row) {
				if (err) {
					throw err;
				}
				else {
					// send the new game value to the client
					var gameJson = JSON.stringify(row.new_val, null, 2);
					console.log(gameJson);
					wsConn.sendUTF(gameJson);
				}
			});
		})
		.catch(function(err) {
			console.log('Error monitoring game ' + gameId + ': ' + err);
		});
};

// export the class
module.exports = Client;