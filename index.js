var express = require('express');
var serveStatic = require('serve-static');
var mustacheExpress = require('mustache-express');

var config = require(__dirname + '/config/config');
var homeController = require(__dirname + '/controllers/home');
var signalServer = require(__dirname + '/controllers/signal-server');

var app = express();

app.use(serveStatic('./public'));
app.use('/', homeController);

app.use(function (req, res) {
	res.status(404);
	res.render('404');
})

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.set('view cache', config.app.cache);

var server = app.listen(config.app.port, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Server running at http://%s:%d', host, port);
});

signalServer(server);