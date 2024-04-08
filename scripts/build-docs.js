/* eslint-disable no-useless-escape */
import jsdoc2md from 'jsdoc-to-markdown';
import { writeFile } from 'node:fs/promises';
import slug from 'limax';

const htmlEntities = {
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
  apos: '\'',
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

const apiDocsHeader = `---
description: >-
  The complete and unadultered API documentation for every single method and
  property accessible in Enmap.
---

# Full Documentation

The following is the complete list of methods available in Enmap. As it is auto-generated from the source code and its comments, it's a little more "raw" than the Usage docs. However, it has the benefit of being more complete and usually more up to date than the manually written docs.

{% hint style="warning" %}
If you're doing a PR on the docs github, please do not manually edit the below contents, as it will be overwritten. Check the src/index.js source code and change the comments there instead!
{% endhint %}

<a name="enmap"></a>
`;

const finalize = str => str
  .replace(/\[Enmap\]\(#Enmap\)/gi, 'Enmap')
  .replace(/\[<code>Enmap<\/code>\]\(#Enmap\)/gi, '<code>Enmap</code>')
  .replace('* [new Enmap(iterable, [options])](#new_Enmap_new)', '* [new Enmap(iterable, [options])](#new-enmap-iterable-options)')
  .split('\n<a name="new_Enmap_new"></a>\n')[2].split('<a name="Enmap"></a>')[0];

const regexread = /^ {8}\* \[\.(.*?)\]\((.*?)\)(.*?)(\(#.*?\)|)$/gm;

const parseData = data => finalize(data.replace(regexread, (_, b, __, d) =>
  `        * [.${b}](#${slug(`enmap.${b} ${unescapeHTML(d.replace(/<\/?code>/g, ''))}`)})${d}`));


const rendered = await jsdoc2md.render({ files: './src/index.js' });
await writeFile('./docs/api.md', apiDocsHeader + parseData(rendered));

