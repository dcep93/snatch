import hunspell
import json
import sys

def main():
	hobj = hunspell.HunSpell('/Library/Spelling/en_US.dic', '/Library/Spelling/en_US.aff')
	dictionary = getDictionary()

	d = {}
	for line in sys.stdin.readlines():
		if line:
			word = line.lower().strip()
			obj = {}
			stems = getStems(word, hobj)
			if stems is None:
				if word in dictionary:
					obj['d'] = dictionary[word]
			else:
				obj['s'] = stems

			d[word.upper()] = obj

	print json.dumps(d, sort_keys=True, indent=2)

def getStems(word, hobj):
	stems = hobj.stem(word)
	if len(stems) == 0:
		sys.stderr.write(word+"\n")
	stems = [i.upper() for i in stems if i != word]
	if len(stems) == 0:
		return None
	return stems

def getDictionary():
	dictionary = {}
	for line in open('dictionary.txt').readlines():
		line = line.strip()
		if line:
			parts = line.split(' ')
			word = parts[0].lower()
			definition = ' '.join(parts[1:]).strip()
			dictionary[word] = definition
	return dictionary

if __name__ == "__main__":
	main()
