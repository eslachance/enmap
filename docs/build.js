const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');

jsdoc2md.render({ files: './src/index.js' }).then(data => fs.writeFile('./docs/api-docs.md', data, () => false));
