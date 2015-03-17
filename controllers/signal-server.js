function signalServer(expressServer) {
	var io = require('socket.io')(expressServer);

	io.on('connection', function (socket) {
		console.log('New connection: %s', socket.id);

		socket.on('join', function (room) {
			var roomInfo = io.sockets.adapter.rooms[room.id] || null;
			if (roomInfo !== null && Object.keys(roomInfo).length > 1) {
				console.log('%s is full. %s cannot join it', room.id, socket.id);
				socket.emit('joined', { isJoined: false });
				return;
			}

			socket.leave(socket.room);
			socket.room = room.id;
			socket.join(socket.room);

			var isCaller = roomInfo === null;
			console.log('%s joined %s as %s', 
				socket.id, 
				room.id,
				isCaller ? "caller" : "callee");
			socket.emit('joined', { isJoined: true, isCaller: isCaller });
		});

		socket.on('callee-arrived', function () {
			console.log('Started conversation in %s', socket.room);
			socket.to(socket.room).emit('callee-arrived');
		});

		socket.on('new-ice-candidate', function (iceEvent) {
			socket.broadcast.emit('new-ice-candidate', iceEvent);
		});

		socket.on('new-description', function (description) {
			socket.to(socket.room).emit('new-description', description);
		})

		socket.on('disconnect', function() {
			console.log('%s disconnected', socket.id);
			if (socket.room) {
				socket.to(socket.room).emit('leave');	
			}
		});
	});
}

module.exports = signalServer;