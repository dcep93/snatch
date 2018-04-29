package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"
	"sync"
)

type trie struct {
	sync.Mutex
	t map[string]*trie
	w []string
}

var (
	queue = make(chan string)
	workers = flag.Int("workers", 4, "")
	indent = flag.Bool("indent", false, "")
	stop = flag.Int("stop", 0, "")
	wg = &sync.WaitGroup{}
)

func main() {
	flag.Parse()
	t := trie{}
	t.consumeQueue()
	log.Println("building")
	num := t.build()
	log.Println("trimming")
	t.trim()
	log.Println("done")
	c := t.count("")
	if c == num {
		log.Println("check passed: ", num)
	} else {
		log.Fatalf("failed check: %d/%d", c, num)
	}
	t.write()
	log.Println("closing")
}

func (t *trie) consumeQueue() {
	for i := 0; i < *workers; i++ {
		wg.Add(1)
		go t.work()
	}
}

func (t *trie) build() int {
	seen := make(map[string][]string)
	num := 0
	skipped := 0
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		word := scanner.Text()
		if handle(word, seen) {
			skipped++
		}

		num++
		if num % 1000 == 0 {
			log.Printf("%s\t%d/%d\t%0.2f%%\n", word, skipped, num, 100*float64(skipped)/float64(num))
		}
		if num == *stop {
			break
		}
	}

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}

	close(queue)
	wg.Wait()

	for sortedLetters, anagrams := range seen {
		if len(anagrams) > 1 {
			t.setAnagrams(sortedLetters, anagrams)
		}
	}

	return num
}

func (t *trie) trim() {

}

func (t *trie) count(key string) int {
	if t == nil {
		return 0
	}
	if t.t == nil {
		return len(t.w)
	} else {
		c := 0
		for rKey, r := range t.t {
			c += r.count(key+rKey)
		}
		return c
	}
}

func (t *trie) write() {
	var b []byte
	var err error
	if (*indent) {
		b, err = json.MarshalIndent(t, "", "  ")	
	} else {
		b, err = json.Marshal(t)
	}
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(string(b))
}

func (t *trie) work() {
	for word := range queue {
		letters := make(map[string]int)
		for _, letterR := range word {
			letters[string(letterR)]++
		}
		t.add(letters, word, "")
	}
	wg.Done()
}

func handle(word string, seen map[string][]string) bool {
	s := strings.Split(word, "")
	sort.Strings(s)
	sortedLetters := strings.Join(s, "")
	if anagrams, ok := seen[sortedLetters]; ok {
		seen[sortedLetters] = append(anagrams, word)
		// log.Printf("skip\t%s\t%s\n", word, anagrams[0])
		return true
	} else {
		seen[sortedLetters] = []string{word}
		queue <- word
		return false
	}
}

func (t *trie) add(letters map[string]int, word string, previous string) {
	if len(letters) == 0 {
		t.Lock()
		t.w = []string{word}
		t.Unlock()
		return
	}
	t.Lock()
	if t.t == nil {
		t.t = make(map[string]*trie)
	}
	t.Unlock()
	for letter := range letters {
		if letter < previous {
			t.Lock()
			t.t[letter] = nil
			t.Unlock()
		} else {
			rLetters := make(map[string]int)
			for rLetter, count := range letters {
				if rLetter == letter {
					if count > 1 {
						rLetters[rLetter] = count-1
					}
				} else {
					rLetters[rLetter] = count
				}
			}
			t.Lock()
			subT := t.t[letter]
			if subT == nil {
				subT = &trie{}
				t.t[letter] = subT
			}
			t.Unlock()
			subT.add(rLetters, word, letter)
		}
	}
}

func (t *trie) setAnagrams(sortedLetters string, anagrams []string) {
	if len(sortedLetters) == 0 {
		t.w = anagrams
	} else {
		key := string(sortedLetters[0])
		remainder := sortedLetters[1:len(sortedLetters)]
		t.t[key].setAnagrams(remainder, anagrams)
	}
}

func (t *trie) MarshalJSON() ([]byte, error) {
	var obj interface{}
	if t != nil {
		if t.w != nil {
			obj = t.w
		} else {
			obj = t.t
		}
	}
	return json.Marshal(obj)
}
