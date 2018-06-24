// players.state {cheats: int, words: [[string]]}
// state.pile [char]
// state.revealed [char]
// state.minimumWordLength int
// lastWord int

$(document).ready(function() {
	$('#door').click(door);
	$('#leave').click(leave);
	$('#reset').click(prepare);
	$('#flip').click(flip);
	$('#submit').submit(submit);
	$('#cheat').click(cheat);
	$('#shuffle').click(shuffle);
	$('#word_length').on('input', wordLengthF);
	$('#grace_period').on('input', gracePeriodF);
	$(document).keydown(function(e) {
		if (state.currentPlayer !== undefined && e.keyCode === 32) {
			flip();
			e.preventDefault();
		}
	});
});

function newState() {
	return { cheats: 0, words: [], score: 0 };
}

function prepare() {
	state.players.forEach(function(player) {
		player.state = newState();
	});

	state.pile = [];
	for (var letter in constants.distribution) {
		for (var i = 0; i < constants.distribution[letter]; i++) {
			state.pile.push(letter);
		}
	}

	shuffleArray(state.pile);

	state.revealed = [];
	state.currentPlayer = adminIndex;
	state.gracePeriod = 5;
	state.minimumWordLength = 4;
	state.lastWord = -1;

	sendState('prepare');
}

function update() {
	$('#word_length').val(state.minimumWordLength);
	$('#grace_period').val(state.gracePeriod);
	$('#remaining').text(state.pile.length);
	$('#board').empty();
	for (var i = 0; i < state.revealed.length; i++) {
		$('<span>')
			.addClass('space')
			.text(state.revealed[i])
			.appendTo('#board');
	}
	$('#players').empty();
	for (var i = 0; i < state.players.length; i++) {
		var player = state.players[i];
		player.state.score = player.state.score || 0; // todo correct, not backwards compatible
		var score = player.state.score;
		for (var j = 0; j < player.state.words.length; j++) {
			score += player.state.words[j][0].length - 2;
		}
		var name = player.name + ' (' + score + ')';
		if (player.state.cheats) {
			name = 'CHEATER - ' + player.state.cheats + ' ' + name;
		}
		var playerDiv = $('<div>')
			.append(
				$('<p>')
					.text(name + ' - ')
					.append(
						$('<span>')
							.addClass('player_time')
							.text(timeToString(player.time))
					)
			)
			.attr('index', i)
			.addClass('player')
			.addClass('bubble')
			.appendTo('#players');
		if (isAdmin(i)) playerDiv.addClass('admin_player');
		if (!player.present) playerDiv.addClass('absent');
		if (player.state.words.length > 0) {
			var wordsDiv = $('<div>')
				.addClass('bubble')
				.addClass('words')
				.appendTo(playerDiv);
			for (var j = 0; j < player.state.words.length; j++) {
				var word = player.state.words[j][0];
				buildWord(word).appendTo(wordsDiv);
			}
		}
	}
}

function flip() {
	if (isMyTurn() && state.pile.length) {
		advanceTurn();
		var letter = state.pile.pop();
		state.revealed.push(letter);
		state.lastWord = -1;
		sendState('flipped ' + letter);
	}
}

function submit() {
	setTimeout(function() {
		var word = $('#word')
			.val()
			.toUpperCase();
		if (isWord(word)) {
			var source = spell(word);
			if (source !== false) {
				$('#cheats_div').hide();
				$('#word').val('');
				state.lastWord = word.length;
				sendState('spelled [' + word + ']' + source);
			} else {
				alert("can't spell that word!");
			}
		} else {
			me().state.score--;
			sendState('tried to spell [' + word + ']');
			alert('not a word!');
		}
	});
	return false;
}

function cheat() {
	var newCheats = me().state.cheats + 1;
	cheatHelper(function(words) {
		$('#cheats').empty();
		$('#cheats_div').show();
		for (var i = 0; i < words.length; i++) {
			buildWord(words[i]).appendTo('#cheats');
		}
		me().state.cheats = newCheats;
		sendState('cheated and found ' + words.length + ' words');
	});
}

function gracePeriodF() {
	var val = $('#grace_period').val();
	if (!val) return;
	var gracePeriod = state.gracePeriod;
	state.gracePeriod = Number.parseInt(val);
	sendState(
		'updated grace period: ' + gracePeriod + ' to ' + state.gracePeriod
	);
}

function wordLengthF() {
	var val = $('#word_length').val();
	if (!val) return;
	var wordLength = Number.parseInt(val);
	sendState(
		'updated word length: ' + state.minimumWordLength + ' to ' + wordLength
	);
	state.minimumWordLength = wordLength;
}

function shuffle() {
	shuffleArray(state.pile);
	sendState('shuffled');
}

function buildWord(word) {
	var text = $('<p>')
		.addClass('inline')
		.addClass('space')
		.text(word);

	$(document).ready(function() {
		text.attr('title', getDefinition(word));
	});
	return $('<div>').append(text);
}

var oldAdvanceTurn = advanceTurn;
advanceTurn = function() {
	while (true) {
		oldAdvanceTurn();
		if (state.players[state.currentPlayer].present) break;
	}
};
