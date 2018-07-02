var express = require('express');

console.log('loading trie');
var trie;
try {
	trie = require('./trie.json');
} catch (e) {
	console.log(e.message);
}
console.log('done');

var MAGIC = '-';
var MIN_LENGTH_FOR_PARENTS = 3;

var router = express.Router();

router.post('/', function(req, res) {
	if (trie === undefined) return res.sendStatus(503);
	console.log(req.body);
	var words = req.body.words;
	var rawLetters = req.body.letters;
	if (rawLetters !== undefined) {
		if (typeof rawLetters !== 'string') rawLetters = rawLetters.join('');
		rawLetters = rawLetters.toUpperCase();
		words.push('');
		letters = {};
		for (var i = 0; i < rawLetters.length; i++) {
			var letter = rawLetters[i];
			if (letters[letter] === undefined) {
				letters[letter] = 0;
			}
			letters[letter]++;
		}
	} else {
		letters = undefined;
	}

	var start = new Date();
	var foundWords = findWords(words, letters);
	var end = new Date();
	var response = {
		words: Array.from(foundWords),
		duration: end - start,
		count: foundWords.size,
	};
	res.send(JSON.stringify(response) + '\n');
});

function findWords(words, letters) {
	var foundWords = new Set();
	var seenChains = new Set();
	for (var i = 0; i < words.length; i++) {
		var word = words[i].toUpperCase();
		if (letters === undefined && word.length <= MIN_LENGTH_FOR_PARENTS) {
			foundWords.add('+' + word);
			continue;
		}
		var chain = sorted(word);
		var t = getTrie(chain);
		if (t === undefined) {
			foundWords.add('-' + word);
			continue;
		}
		if (word !== '' && !isWord(word, t)) foundWords.add(MAGIC + word);
		if (!seenChains.has(chain)) {
			seenChains.add(chain);
			addWords(t, chain, letters, MAGIC, foundWords, new Set());
		}
	}
	return foundWords;
}

function addWords(
	t,
	chain,
	remainingLetters,
	previous,
	foundWords,
	seenChains
) {
	if (seenChains.has(chain)) return;
	seenChains.add(chain);
	if (t === null) t = getTrie(chain);
	for (var letter in t) {
		var sub = t[letter];
		if (letter === MAGIC) {
			if (previous !== MAGIC) {
				for (var i = 0; i < sub.length; i++) {
					foundWords.add(sub[i]);
				}
			}
		} else if (letter >= previous) {
			var newChain = sorted(chain + letter);
			if (remainingLetters === undefined) {
				addWords(
					sub,
					newChain,
					remainingLetters,
					letter,
					foundWords,
					seenChains
				);
			} else if (remainingLetters[letter]) {
				var nextLetters = {};
				for (var fillLetter in remainingLetters) {
					nextLetters[fillLetter] = remainingLetters[fillLetter];
				}
				nextLetters[letter]--;
				addWords(
					sub,
					newChain,
					nextLetters,
					letter,
					foundWords,
					seenChains
				);
			}
		}
	}
}

function getTrie(chain) {
	var t = trie;
	for (var j = 0; j < chain.length; j++) {
		t = t[chain[j]];
		if (t === undefined) break;
	}
	return t;
}

function isWord(word, t) {
	var words = t[MAGIC];
	if (words === undefined) return false;
	for (var i = 0; i < words.length; i++) {
		if (words[i] === word) return true;
	}
	return false;
}

function sorted(letters) {
	var a = letters.split('');
	a.sort();
	return a.join('');
}

module.exports = router;
