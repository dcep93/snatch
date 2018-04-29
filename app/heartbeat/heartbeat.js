var path = require('path');

var exec = require('../../../../etc/exec');

var ttd = 60 * 60 * 1000;

var timeout;

function beat(req, res, next) {
	if (timeout === undefined) revive();
	clearTimeout(timeout);
	timeout = setTimeout(kill, ttd);
	next();
}

function kill(req, res) {
	timeout = undefined;
	exec('kill', path.join(__dirname, 'scripts', 'kill.sh'), res);
}

function revive(req, res) {
	exec('revive', path.join(__dirname, 'scripts', 'revive.sh'), res);
}

module.exports = {
	beat: beat,
	kill: kill,
	revive: revive,
};
