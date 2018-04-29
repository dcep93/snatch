var express = require('express');
var proxy = require('express-http-proxy');

var heartbeat = require('./heartbeat/heartbeat');

var cheat = express.Router();

cheat.use(heartbeat.beat);
cheat.use('/revive', heartbeat.revive);

cheat.use(proxy('cheat:8000'));
module.exports = cheat;
