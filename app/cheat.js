var express = require('express');
var proxy = require('express-http-proxy');

var socket = require('../../../socket/socket');
var heartbeat = require('./heartbeat/heartbeat');

var cheat = express.Router();

cheat.use('/revive', socket.protect(heartbeat.revive));
cheat.use('/kill', socket.protect(heartbeat.kill));

cheat.get('/bee', function(req, res) {
	res.sendFile(__dirname + '/views/bee.html');
});

cheat.use(proxy('cheat:8000'));
module.exports = cheat;
