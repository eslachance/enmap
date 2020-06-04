const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');
const regexread = /\* \[\.(.*?)\]\((.*?)\)((.*?)<code>(.*?)<\/code>(.*?))/g;
const rpc = s => {
  let repl = s.toLowerCase().replace(/[\s\\\|\[\]\(\)]/g, '-').replace(/[\.,_]+/g, '');

  console.log(repl);

  if (repl[repl.length - 1] !== '-') {
    // repl += '-';
  }
  return repl.replace('--', '-').replace(/--$/, '');
};

const parseTable = {
  '\\*': '',
  '&lt;': '-less-than-',
  '&gt;': '-greater-than',
  '.': ''
};

const parseReturn = s => {
  Object.keys(parseTable).forEach(key => { s = s.replace(key, parseTable[key]); });
  console.log(s);
  return s.toLowerCase();
};

jsdoc2md.render({ files: './src/index.js' }).then(data =>
  fs.writeFile('./docs/api-docs.md',
    data, // .replace(regexread, (a, b, c, d, e, f, g) => `* [${b}](#enmap-${rpc(b)}${parseReturn(e) && `-${parseReturn(e)}`})${d}<code>${e}</code>${f}`.replace('--', '-'))
    () => false));
