var express = require('express');
var path = require('path');

var cheat = require('./cheat');
var heartbeat = require('./heartbeat/heartbeat');

var router = express.Router();

var index = path.join(__dirname, 'views', 'index.ejs');
var views = path.join(path.dirname(require.main.filename), 'views');

router.use(heartbeat.beat);

router.get('/', function(req, res) {
	res.render(index, {
		title: 'Snatch',
		views: views,
	});
});

router.use('/cheat', cheat);

router.use(express.static(path.join(__dirname, 'public')));

module.exports = router;
