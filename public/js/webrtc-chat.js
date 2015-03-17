(function () {

	// Setup WebRTC functions:
	// 1. WebKit browsers require webkit prefix
	// 2. Firefox requires moz prefix
	
	var RTCPeerConnection = window.RTCPeerConnection
		|| window.webkitRTCPeerConnection
		|| window.mozRTCPeerConnection;

	var RTCSessionDescription = window.RTCSessionDescription
		|| window.webkitRTCSessionDescription
		|| window.mozRTCSessionDescription;

	var RTCIceCandidate = window.RTCIceCandidate
		|| window.webkitRTCIceCandidate
		|| window.mozRTCIceCandidate;

	var getUserMedia = null;
	var connectToVideoStream = null;

	if (navigator.getUserMedia) {
		getUserMedia = navigator.getUserMedia.bind(navigator);

		connectToVideoStream = function (stream, controlId) {
			var control = document.getElementById(controlId);
			control.srcObject = stream;
			control.play();
		};
	} else if (navigator.webkitGetUserMedia) {
		getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

		connectToVideoStream = function (stream, controlId) {
			var control = document.getElementById(controlId);
			control.src = webkitURL.createObjectURL(stream);
			control.play();
		};
	} else if (navigator.mozGetUserMedia) {
		getUserMedia = navigator.mozGetUserMedia.bind(navigator);

		connectToVideoStream = function (stream, controlId) {
			var control = document.getElementById(controlId);
			control.mozSrcObject = stream;
			control.play();
		};
	}

	// -------------------------

	// Peer-to-peer chat

	function Room(roomId) {
		var me = this;
		this.roomId = roomId;

		function generateRoomUrl(roomId) {
			var url = location.protocol + '//' + location.host + '/' + roomId;
			return url;
		}

		function setupVideo() {
			getUserMedia({
				video: true,
				audio: true
			}, function (localStream) {
				connectToVideoStream(localStream, 'local-video');
			}, handleError);
		}

		function handleError(error) {
			console.log(error);
		}

		var url = generateRoomUrl(this.roomId);
		$('#chat-url').text(url);
		$('#chat-url').attr('href', url);
		$('#login').hide();
		$('#chat').show();

		setupVideo();
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
		if (!isWebRTCSupported()) {	
			$('.has-webrtc').hide();
			$('#webrtc-not-supported').show();
			return;
		}

		$('#join-chat').click(function () {
			joinChat();
		});
	});
})();