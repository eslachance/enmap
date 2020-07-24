const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');
const slug = require('limax');

var htmlEntities = {
  nbsp: ' ',
  cent: '¢',
  pound: '£',
  yen: '¥',
  euro: '€',
  copy: '©',
  reg: '®',
  lt: '<',
  gt: '>',
  quot: '"',
  amp: '&',
  apos: '\''
};

const unescapeHTML = str => str.replace(/\&([^;]+);/g, (entity, entityCode) => {
  let match;

  if (entityCode in htmlEntities) {
    return htmlEntities[entityCode];
    /* eslint no-cond-assign: 0 */
  } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
    return String.fromCharCode(parseInt(match[1], 16));
    /* eslint no-cond-assign: 0 */
  } else if (match = entityCode.match(/^#(\d+)$/)) {
    return String.fromCharCode(~~match[1]);
  } else {
    return entity;
  }
});

const finalize = str => str
  .replace(/\[Enmap\]\(#Enmap\)/gi, '[Enmap](#enmap-map)')
  .replace(/\[<code>Enmap<\/code>\]\(#Enmap\)/gi, '[<code>Enmap</code>](#enmap-map)')
  .replace('* [new Enmap(iterable, [options])](#new_Enmap_new)', '* [new Enmap(iterable, [options])](#new-enmap-iterable-options)');

const regexread = /^ {8}\* \[\.(.*?)\]\((.*?)\)(.*?)(\(#.*?\)|)$/gm;

const parseData = data => finalize(data.replace(regexread, (_, b, __, d) =>
  `        * [.${b}](#${slug(`enmap.${b} ${unescapeHTML(d.replace(/<\/?code>/g, ''))}`)})${d}`));

jsdoc2md.render({ files: './src/index.js' }).then(data =>
  fs.writeFile('./docs/api-docs.md',
    parseData(data),
    () => false));
