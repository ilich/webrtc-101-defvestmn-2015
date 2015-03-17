(function () {
	var config = {
		stunServers: [
			'stun.l.google.com:19302',
			'stun1.l.google.com:19302',
			'stun2.l.google.com:19302',
			'stun3.l.google.com:19302',
			'stun4.l.google.com:19302'
		]
	};

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
		this.signalServer = io();
		this.peerConnection = new RTCPeerConnection({
			iceServers: config.stunServers.map(function (server) {
				return {
					url: 'stun:' + server
				}
			})
		}, {
			optional: []
		});

		this.peerConnection.onicecandidate = function (iceEvent) {
			if (iceEvent.candidate === undefined || iceEvent.candidate === null) {
				return;
			}

			me.signalServer.emit('new-ice-candidate', { candidate: iceEvent.candidate });
		};

		this.peerConnection.onaddstream = function (event) {
			connectToVideoStream(event.stream, 'remote-video');
		};

		this.signalServer.on('leave', function () {
			alert('Your parthner left the chat.');
			location.href = "/";
		});

		this.signalServer.on('joined', function (data) {
			function generateRoomUrl(roomId) {
				var url = location.protocol + '//' + location.host + '/' + roomId;
				return url;
			}

			function setupVideo(afterVideoSetup) {
				getUserMedia({
					video: true,
					audio: true
				}, function (localStream) {
					connectToVideoStream(localStream, 'local-video');
					me.peerConnection.addStream(localStream);

					// http://stackoverflow.com/questions/11794305/i-am-not-able-to-receive-remote-video-stream
					//
					// 'the above code pasted contains a small bug, the stream should be added to the peer connection 
					// before generating the answer or offer , that is "addStream" should be called before 
					// any of setlocalDescription or setRemoteDescription calls.'
					//
					// We should continue with WebRTC setup only when local stream
					// has been added to the WebRTC peer connection
					
					afterVideoSetup();

				}, handleError);
			}

			function newDescriptionCreated(description) {
				me.peerConnection.setLocalDescription(description, function () {
					me.signalServer.emit('new-description', { sdp: description });
				}, handleError);
			}

			function setupCaller() {
				me.signalServer.on('callee-arrived', function () {
					me.peerConnection.createOffer(newDescriptionCreated, handleError);
				});

				me.signalServer.on('new-ice-candidate', function (iceEvent) {
					me.peerConnection.addIceCandidate(new RTCIceCandidate(iceEvent.candidate));
				});

				me.signalServer.on('new-description', function (description) {
					me.peerConnection.setRemoteDescription(
						new RTCSessionDescription(description.sdp),
						function () {}, 
						handleError);
				});
			}

			function setupCallee() {
				me.signalServer.on('new-ice-candidate', function (iceEvent) {
					me.peerConnection.addIceCandidate(new RTCIceCandidate(iceEvent.candidate));
				});

				me.signalServer.on('new-description', function (description) {
					me.peerConnection.setRemoteDescription(
						new RTCSessionDescription(description.sdp),
						function () {
							me.peerConnection.createAnswer(newDescriptionCreated, handleError);
						}, 
						handleError);
				});	

				me.signalServer.emit('callee-arrived');				
			}

			function handleError(error) {
				console.log(error);
			}

			if (!data.isJoined) {
				alert('You cannot join this conversation. Please try again or create new conversation.');
				return;
			} else {
				me.isCaller = data.isCaller;

				var url = generateRoomUrl(me.roomId);
				$('#chat-url').text(url);
				$('#chat-url').attr('href', url);
				$('#login').hide();
				$('#chat').show();

				setupVideo(function () {
					if (me.isCaller) {
						setupCaller();
					} else {
						setupCallee(); 
					}
				});
			}
		});
	}

	Room.prototype.join = function () {
		this.signalServer.emit('join', { id: this.roomId });
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
		})
	});
})();