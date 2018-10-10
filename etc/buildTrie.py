import collections
import json
import os
import sys
import time

sizeCutoff = 1000000000
MAGIC = "-"
targetCount = collections.defaultdict(int)
sourceToTarget = {}

def main():
	sowpods = open(sys.argv[1])
	words = json.load(sowpods)
	fh = open(sys.argv[2], 'w') if len(sys.argv) > 2 else None
	p('building')
	global bigD
	bigD = trie()
	num = build(bigD, words)
	p('built')
	numNodes = -1 # getNumNodes(bigD)
	p('trimming alts %d' % numNodes)
	trimAlts(bigD)
	numNodes = getNumNodes(bigD)
	p('done %d' % numNodes)
	c = count(bigD)
	if c == num:
		p('check passed: %d' % num)
	else:
		p('check failed: %d/%d' % (c, num))
		exit(1)
	bigD = ddToD(bigD)
	p('ddToD')
	dump(bigD, fh)
	p('closing')

def p(string):
	print time.ctime(), string

def trie():
	return collections.defaultdict(trie)

def build(d, words):
	seen = {}
	num = 0
	skipped = 0
	words = sorted(words, lambda a,b: len(a)-len(b))
	for word in words:
		if word:
			word = word.upper()
			num += 1
			if num % 1000 == 0: p('\t%s %d\t%d/%d\t%0.2f%%' % (word, len(word), skipped, num, 100*float(skipped)/num))
			sortedLetters = ''.join(sorted(word))
			if sortedLetters in seen:
				skipped += 1
				# p('skip\t%s\t%s' % (word, seen[sortedLetters]))
				addAnagram(sortedLetters, word)
			else:
				seen[sortedLetters] = word
				letters = collections.Counter(word)
				add(letters, d, sortedLetters, word)

	return num

def ddToD(d):
	d = dict(d)
	for key in d.keys():
		sub = d[key]
		if type(sub) is collections.defaultdict:
			d[key] = ddToD(sub)
	return d

def getNumNodes(d):
	numNodes = len(d)
	for letter in d:
		sub = d[letter]
		if isinstance(sub, collections.Mapping):
			numNodes += getNumNodes(sub)
	return numNodes

def trimAlts(d, chain=''):
	shouldTrim = MAGIC not in d and chain not in targetCount
	rval = shouldTrim
	for key in reversed(sorted(d.keys())):
		if key is MAGIC:
			rval = False
			continue
		sub = d[key]
		if sub is None:
			if shouldTrim:
				del d[key]
				target = sourceToTarget.pop(chain+key)
				targetCount[target] -= 1
				if targetCount[target] is 0:
					del targetCount[target]
		elif trimAlts(sub, ''.join(sorted(chain+key))):
			del d[key]
		else:
			rval = False
	return rval

def count(d, chain=''):
	if d is None:
		sub = bigD
		for letter in sorted(chain):
			if letter not in sub:
				dump(bigD, None)
				print chain, letter
				print 'failed count unreachable'
				exit(1)
			sub = sub[letter]
		return 0
	c = 0
	if not d:
		dump(bigD, None)
		print chain
		print 'failed count empty dict'
		exit(1)
	for letter in d:
		if letter is MAGIC:
			c += len(d[letter])
		else:
			c += count(d[letter], chain+letter)
	return c

def dump(d, fh):
	if fh is not None:
		json.dump(d, fh)
	else:
		print json.dumps(d, indent=2, sort_keys=True)

def add(letters, d, sortedLetters, word, previous = '', chain = ''):
	if len(letters) == 0:
		if MAGIC not in d:
			d[MAGIC] = []
		d[MAGIC].append(word)
		return

	keys = sorted(letters.keys())
	first = keys[0]
	for letter in keys:
		if letter < previous:
			if letter is first:
				d[letter] = None
				save(chain, letter)
		else:
			rLetters = dict(letters)
			rLetters[letter] -= 1
			if rLetters[letter] is 0:
				del rLetters[letter]
			sub = d[letter]
			add(rLetters, sub, sortedLetters, word, letter, chain+letter)

def save(chain, letter):
	source = chain+letter
	if source in sourceToTarget: return
	target = ''.join(sorted(chain+letter))
	sourceToTarget[source] = target
	targetCount[target] += 1


def addAnagram(sortedLetters, word):
	d = bigD
	for letter in sortedLetters:
		d = d[letter]
	d[MAGIC].append(word)

if __name__ == "__main__":
	main()
