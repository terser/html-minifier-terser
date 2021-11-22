import { ElementType, DomUtils } from 'htmlparser2';

import defaultOptions from './defaults.js';

import { inlineTags, inlineTextTags, selfClosingTags } from '../utils/tags.js';
import { EMPTY, collapseWhitespace } from '../utils/whitespace.js';

const content = (node) => DomUtils.textContent(node);

const whiteSpaceAroundTags = new Set([...inlineTags, ...selfClosingTags]);
const whiteSpaceInsideTags = inlineTextTags;

const _collapseWhitespace = (str = EMPTY, node, options = defaultOptions) => {
  let text = str;

  // skip processing empty strings
  if (text.length === 0) {
    return text;
  }

  const { prev, next, parent } = node;


  let trimLeft = false
  let trimRight = false
  const isParentTag = parent.type === ElementType.Tag

  // strip non space whitespace then compress spaces to one
  // elements inside tags
  const collapseAll = (isParentTag || parent.type === ElementType.Root) && !prev && !next

  return collapseWhitespace(text, options, trimLeft, trimRight, collapseAll);
};

const processWhitespace = (tree, options = defaultOptions) => {
  const nodes = Array.isArray(tree) ? tree : [tree];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    switch (node.type) {
      case ElementType.Root:
        processWhitespace(node.children, options);
        break;

      case ElementType.Tag:
        if (node.children.length) {
          processWhitespace(node.children, options)
        }
        break

      case ElementType.Text:
        if (options.collapseWhitespace) {
          node.data = _collapseWhitespace(node.data, node, options);
        }
        break;

      default:
        break;
    }
  }
}

export default processWhitespace;
