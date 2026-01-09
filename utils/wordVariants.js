function wordToRegex(word) {
  const map = {
    a: '[a4@]',
    e: '[e3]',
    i: '[i1!]',
    o: '[o0]',
    s: '[s5$]',
    t: '[t7]',
    l: '[l1]',
    r: '[r4]'
  };

  const pattern = word
    .toLowerCase()
    .split('')
    .map(c => map[c] || c)
    .join('');

  return `\\b${pattern}\\b`;
}

module.exports = { wordToRegex };
