import { defaultContext } from './context.js';
import defaultOptions from './options/defaults.js';
import { uniqueId } from './utils/string.js';
import { collapseWhitespace, EMPTY } from './utils/whitespace.js';

const preProcessInput = (input = EMPTY, options = defaultOptions, ctx = defaultContext) => {
  let html = input;

  if (options.collapseWhitespace) {
    html = collapseWhitespace(html, options, true, true);
  }

  let uidAttr = null;
  let uidPattern = null;
  const ignoredCustomMarkupChunks = [];
  const uidIgnore = null;

  const customFragments = options.ignoreCustomFragments.map(re => re.source);

  if (customFragments.length) {
    const reCustomIgnore = new RegExp('\\s*(?:' + customFragments.join('|') + ')+\\s*', 'g');

    // temporarily replace custom ignored fragments with unique attributes
    html = html.replace(reCustomIgnore, (match) => {
      if (!uidAttr) {
        uidAttr = uniqueId(html);
        uidPattern = new RegExp('(\\s*)' + uidAttr + '([0-9]+)' + uidAttr + '(\\s*)', 'g');
      }

      const token = uidAttr + ignoredCustomMarkupChunks.length + uidAttr;
      ignoredCustomMarkupChunks.push(/^(\s*)[\s\S]*?(\s*)$/.exec(match));
      return '\t' + token + '\t';
    });
  }

  ctx.set('uidAttr', uidAttr);
  ctx.set('uidPattern', uidPattern);
  ctx.set('uidIgnore', uidIgnore);
  ctx.set('ignoredCustomMarkupChunks', ignoredCustomMarkupChunks);

  const restore = (output = '') => {
    if (!uidPattern) {
      return output;
    }

    return output.replace(uidPattern, function (match, prefix, index, suffix) {
      let chunk = ignoredCustomMarkupChunks[+index][0];
      if (options.collapseWhitespace) {
        if (prefix !== '\t') {
          chunk = prefix + chunk;
        }
        if (suffix !== '\t') {
          chunk += suffix;
        }

        const trimLeft = /^[ \n\r\t\f]/.test(chunk);
        const trimRight = /[ \n\r\t\f]$/.test(chunk);

        const whitespaceOptions = {
          preserveLineBreaks: options.preserveLineBreaks,
          conservativeCollapse: !options.trimCustomFragments
        };

        return collapseWhitespace(chunk, whitespaceOptions, trimLeft, trimRight);
      }
      return chunk;
    });
  };

  return {
    html,
    restore
  };
};

export default preProcessInput;
