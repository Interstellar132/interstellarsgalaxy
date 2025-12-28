const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../data/blacklist.json');

let data = {
  words: []
};

// Load file on startup
if (fs.existsSync(FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    console.error('Failed to load blacklist.json, resetting.');
  }
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// Convert word to regex-safe leetspeak pattern
function toVariantRegex(word) {
  const map = {
    a: '[a4@]',
    e: '[e3]',
    i: '[i1!]',
    o: '[o0]',
    s: '[s5$]',
    t: '[t7]',
    b: '[b8]',
    g: '[g9]',
    l: '[l1]',
    z: '[z2]'
  };

  return word
    .toLowerCase()
    .split('')
    .map(c => map[c] || c)
    .join('');
}

module.exports = {
  add(word) {
    word = word.toLowerCase();
    if (data.words.includes(word)) return false;

    data.words.push(word);
    save();
    return true;
  },

  remove(word) {
    word = word.toLowerCase();
    const index = data.words.indexOf(word);
    if (index === -1) return false;

    data.words.splice(index, 1);
    save();
    return true;
  },

  list() {
    return [...data.words];
  },

  matches(messageContent) {
    const content = messageContent.toLowerCase();

    return data.words.find(word => {
      const pattern = toVariantRegex(word);
      const regex = new RegExp(pattern, 'i');
      return regex.test(content);
    });
  }
};
