var log = console.log;
console.log = function() {
	var arr = Array.from(arguments);
	var d = new Date();
	var dateString = `${d.toDateString()} ${d.toTimeString().split(' ')[0]}`;
	arr.unshift(dateString);
	log(...arr);
};

var express = require('express');
var bodyParser = require('body-parser');

var cheat = require('./cheat');

var port = process.env.port || 8000;

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(cheat);

app.listen(port, function() {
	console.log(`listening on port ${port}`);
});
