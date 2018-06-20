getJSONs([
	{ path: 'words.json', name: 'words' },
	{ path: 'distribution.json', name: 'distribution' },
]);

function getDefinition(word) {
	var definitions = getDefinitionHelper(word);
	if (definitions.length === 0) {
		return 'No definition found';
	} else {
		return definitions.join('\n\n');
	}
}

function getDefinitionHelper(word) {
	var entry = constants.words[word];
	if (entry.s) {
		var definitions = [];
		for (var i = 0; i < entry.s.length; i++) {
			var stem = entry.s[i];
			if (constants.words[stem] !== undefined) {
				var sub = getDefinitionHelper(stem);
				definitions = definitions.concat(sub);
			}
		}
		return definitions;
	} else {
		var definition = constants.words[word].d;
		if (definition === undefined) return [];
		return [definition];
	}
}

function isWord(word) {
	return constants.words[word] !== undefined;
}

function spell(word, forCheat) {
	if (word.length < state.minimumWordLength) {
		return false;
	}

	var date = new Date();

	var source = spellHelper(word, forCheat, state);
	if (forCheat || source !== false) {
		return source;
	}

	for (var i = 0; i < states.length; i++) {
		var obj = states[i];
		if (obj.invalid) continue;
		if (date - obj.date > state.gracePeriod * 1000) break;
		var stateCopy = $.extend(true, null, states[i].state);
		source = spellHelper(word, forCheat, stateCopy);
		if (source !== false) {
			if (!forCheat) {
				var id = state.id;
				state = stateCopy;
				state.id = id;
			}
			return source + ' from state (' + states[i].id + ')';
		}
		if (
			obj.locked ||
			obj.state.lastWord === -1 ||
			obj.state.lastWord >= word.length
		)
			break;
	}

	return false;
}

function spellHelper(word, forCheat, stateCopy) {
	for (var offset = 0; offset < stateCopy.players.length; offset++) {
		var index = (myIndex + offset + 1) % stateCopy.players.length;
		var player = stateCopy.players[index];
		if (!player.state) continue;
		for (var i = 0; i < player.state.words.length; i++) {
			var words = player.state.words[i];
			var currentWord = words[0];
			var remainingLetters = canSpell(word, currentWord, stateCopy);
			if (remainingLetters !== false && !anySameStem(word, words)) {
				if (!forCheat) {
					words.unshift(word);
					var stolenWordArray = player.state.words.splice(i, 1);
					snatch(stolenWordArray[0], remainingLetters, stateCopy);
				}
				return ' using [' + currentWord + '] from ' + player.name;
			}
		}
	}

	var remainingLetters = canSpell(word, '', stateCopy);
	if (remainingLetters !== false) {
		if (!forCheat) {
			snatch([word], remainingLetters, stateCopy);
		}
		return '';
	}

	return false;
}

function canSpell(word, currentWord, stateCopy) {
	if (currentWord.length >= word.length) {
		return false;
	}

	var remainingLetters = stateCopy.revealed.slice();
	var remainingLettersDict = wordToDict(remainingLetters);
	var wordLetters = wordToDict(word);
	var currentWordLetters = wordToDict(currentWord);
	for (var letter in currentWordLetters) {
		for (var i = 0; i < currentWordLetters[letter].length; i++) {
			var wordLettersIndices = wordLetters[letter];
			if (
				wordLettersIndices === undefined ||
				wordLettersIndices.length === 0
			) {
				return false;
			}
			wordLettersIndices.shift();
		}
	}
	var removeIndices = [];
	for (var letter in wordLetters) {
		for (var i = 0; i < wordLetters[letter].length; i++) {
			var remainingLettersIndices = remainingLettersDict[letter];
			if (
				remainingLettersIndices === undefined ||
				remainingLettersIndices.length === 0
			) {
				return false;
			}
			var index = remainingLettersIndices.shift();
			removeIndices.push(index);
		}
	}
	removeIndices.sort();
	for (var i = removeIndices.length - 1; i >= 0; i--) {
		var index = removeIndices[i];
		remainingLetters.splice(index, 1);
	}
	return remainingLetters;
}

function snatch(words, remainingLetters, stateCopy) {
	stateCopy.revealed = remainingLetters;
	var player = me(stateCopy);
	if (!player.state) {
		player.state = newState();
	}
	player.present = true;
	player.state.words.unshift(words);
	state.currentPlayer = myIndex;
}

function wordToDict(word) {
	var dict = {};
	for (var i = 0; i < word.length; i++) {
		var letter = word[i];
		if (dict[letter] === undefined) {
			dict[letter] = [];
		}
		dict[letter].push(i);
	}
	return dict;
}

function anySameStem(word, words) {
	var wordStems = getStems(word);
	for (var i = 0; i < words.length; i++) {
		var checkWord = words[i];
		var checkWordStems = getStems(checkWord);
		for (var j = 0; j < wordStems.length; j++) {
			for (var k = 0; k < checkWordStems.length; k++) {
				if (wordStems[j] === checkWordStems[k]) {
					return true;
				}
			}
		}
	}
	return false;
}

function getStems(word) {
	var stems = constants.words[word].s;
	if (stems === undefined) {
		return [word];
	}
	return stems;
}

function cheatHelper(callback) {
	var spelledWords = [];
	for (var i = 0; i < state.players.length; i++) {
		for (var j = 0; j < state.players[i].state.words.length; j++) {
			var word = state.players[i].state.words[j][0];
			spelledWords.push(word);
		}
	}

	$.ajax('cheat', {
		data: JSON.stringify({
			letters: state.revealed,
			words: spelledWords,
		}),
		contentType: 'application/json',
		method: 'POST',
		success: function(response) {
			var data = JSON.parse(response);
			console.log(data);
			var words = [];
			for (var i = 0; i < data.words.length; i++) {
				if (spell(data.words[i], true) !== false)
					words.push(data.words[i]);
			}
			callback(words);
		},
		error: function(jqXHR, status, error) {
			alert(error);
		},
	});
}
