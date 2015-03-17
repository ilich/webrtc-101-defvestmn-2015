var shortid = require('shortid');
var express = require('express');
var router = express.Router();

router.get('/:id?', function (req, res) {
	var roomId = req.params.id;
	if (!roomId) {
		roomId = shortid.generate();
	}

	res.render('home/index', {
		header: {
			title: 'DevFestMN 2015 - WebRTC Video Chat'
		},
		roomId: roomId
	});
});

module.exports = router;