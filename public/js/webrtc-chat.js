(function () {

	function Room(roomId) {
		var me = this;
		this.roomId = roomId;
		
		function generateRoomUrl(roomId) {
			var url = location.protocol + '//' + location.host + '/' + roomId;
			return url;
		}

		var url = generateRoomUrl(this.roomId);
		$('#chat-url').text(url);
		$('#chat-url').attr('href', url);
		$('#login').hide();
		$('#chat').show();
	}

	Room.prototype.join = function () {
	}

	// -------------------------

	function isWebRTCSupported() {
		return getUserMedia;
	}

	function joinChat() {
		var roomId = $('#room-id').val();
		if (roomId === '') {
			alert('Room name cannot be empty');
			return;
		}

		var room = new Room(roomId);
		room.join();
	}

	$(document).ready(function () {

		$('#join-chat').click(function () {
			joinChat();
		})
	});
})();