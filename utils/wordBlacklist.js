const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../data/word-blacklist.json');

/* -------------------- FILE HELPERS -------------------- */

function load() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function save(words) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(words, null, 2));
}

/* -------------------- WORD MANAGEMENT -------------------- */

function add(word) {
  const list = load();

  if (list.includes(word)) {
    return { added: false, list };
  }

  list.push(word);
  save(list);
  return { added: true, list };
}

function remove(word) {
  const list = load().filter(w => w !== word);
  save(list);
  return list;
}

/* -------------------- LEETSPEAK REGEX -------------------- */

// Map letters → common substitutions
const LEET_MAP = {
  a: ['a', '4', '@'],
  b: ['b', '8'],
  e: ['e', '3'],
  i: ['i', '1', '!'],
  l: ['l', '1'],
  o: ['o', '0'],
  s: ['s', '5', '$'],
  t: ['t', '7'],
  v: ['v'],
  r: ['r']
};

function wordToRegex(word) {
  const pattern = word
    .split('')
    .map(char => {
      const subs = LEET_MAP[char] || [char];
      return `[${subs.join('')}]`;
    })
    .join('');

  // Word boundary-ish, but allows symbols inside
  return new RegExp(pattern, 'i');
}

function getRegexes() {
  return load().map(word => ({
    word,
    regex: wordToRegex(word)
  }));
}

module.exports = {
  load,
  add,
  remove,
  getRegexes
};
