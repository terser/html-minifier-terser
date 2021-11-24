import { ElementType, DomUtils } from 'htmlparser2';

import defaultOptions from './defaults.js';

import { inlineTags, inlineTextTags, selfClosingInlineTags } from '../utils/tags.js';
import { EMPTY, collapseWhitespace, endsWithWhiteSpace, isEmpty, startsWithWitespace } from '../utils/whitespace.js';

const whitespaceAroundTags = new Set([...inlineTags, ...selfClosingInlineTags]);
const whitespaceInsideTags = inlineTextTags;

const canTrimWhitespace = (tag) => {
  return !/^(?:pre|textarea)$/.test(tag);
};

const textContent = (node, to) => {
  if (Array.isArray(node)) {
    return node.map((n) => textContent(n, to)).join('');
  };

  if (DomUtils.hasChildren(node) && !DomUtils.isComment(node)) {
    return textContent(node.children, to);
  }

  if (DomUtils.isText(node) && node.startIndex < to) {
    return node.data;
  }

  return '';
};

const textContentFrom = (node, from) => {
  if (Array.isArray(node)) {
    return node.map((n) => textContentFrom(n, from)).join('');
  };

  if (DomUtils.hasChildren(node) && !DomUtils.isComment(node)) {
    return textContentFrom(node.children, from);
  }

  if (DomUtils.isText(node) && node.endIndex >= from) {
    return node.data;
  }

  return '';
};

const content = DomUtils.textContent;

const getRoot = (node) => {
  if (node.parent.type === ElementType.Root) {
    return node.parent;
  }

  return getRoot(node.parent);
};

const charsUntil = (node) => {
  const root = getRoot(node);
  return textContent(root, node.startIndex);
};

const charsFrom = (node) => {
  const root = getRoot(node);
  return textContentFrom(root, node.endIndex);
};

const isTag = (node, name) => {
  if (name) {
    return node?.type === ElementType.Tag && node.name === name;
  }

  return node?.type === ElementType.Tag;
};

const isText = (node) => {
  return node?.type === ElementType.Text;
};

const isComment = (node) => {
  return node?.type === ElementType.Comment;
};

const _collapseWhitespace = (str = EMPTY, node, options = defaultOptions) => {
  let text = str;

  // skip processing empty strings
  if (text.length === 0) {
    return text;
  }

  const { prev, parent, next } = node;
  const currentChars = charsUntil(node);

  // trim element
  if (parent.type === ElementType.Root && !prev && !next) {
    text = collapseWhitespace(text, options, true, true);
  }

  if (isTag(parent)) {
    const tag = parent.name;

    if (!whitespaceAroundTags.has(tag) && !whitespaceInsideTags.has(tag)) {
      let trimLeft = endsWithWhiteSpace(currentChars) && !isText(prev);
      let trimRight = (!next || !whitespaceAroundTags.has(next.name)) && !isText(next);

      if (isTag(next, 'wbr') && startsWithWitespace(charsFrom(next))) {
        trimRight = true;
      }

      if (trimLeft) {
        if (isTag(prev) && whitespaceAroundTags.has(prev.name)) {
          trimLeft = false;
        }
      }

      if (trimLeft) {
        trimLeft = canTrimWhitespace(tag);
      }

      if (trimRight) {
        trimRight = canTrimWhitespace(tag);
      }

      const collapseAll = canTrimWhitespace(tag);
      text = collapseWhitespace(text, options, trimLeft, trimRight, collapseAll);
    } else {
      if (whitespaceAroundTags.has(tag)) {
        if (!whitespaceInsideTags.has(tag)) {
          const trimLeft = canTrimWhitespace(tag);
          const trimRight = canTrimWhitespace(tag);

          text = collapseWhitespace(text, options, trimLeft, trimRight);
        } else {
          if (endsWithWhiteSpace(currentChars)) {
            text = collapseWhitespace(text, options, true, false);
          }

          if (tag === 'nobr') {
            const trimLeft = !parent.prev;
            const trimRight = !parent.next || startsWithWitespace(content(parent.next));
            text = collapseWhitespace(text, options, trimLeft, trimRight);
          }
        }
      }
    }
  }

  if (prev) {
    if (whitespaceInsideTags.has(prev.name) && endsWithWhiteSpace(currentChars)) {
      let trimLeft = true;

      if (isEmpty(currentChars) && whitespaceAroundTags.has(prev.name)) {
        trimLeft = false;
      }

      text = collapseWhitespace(text, options, trimLeft);
    } else {
      let collapseAll = true;
      let trimLeft = false;

      if (!whitespaceAroundTags.has(prev.name) && !isText(prev) && !isComment(prev) && parent.type === ElementType.Root) {
        trimLeft = true;
      }

      if (isTag(parent) && !canTrimWhitespace(parent.name)) {
        collapseAll = false;
      }

      text = collapseWhitespace(text, options, trimLeft, false, collapseAll);
    }
  }

  return text;
};

const _processWhitespace = (tree, options = defaultOptions) => {
  const nodes = Array.isArray(tree) ? tree : [tree];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    switch (node.type) {
      case ElementType.Root:
        processWhitespace(node.children, options);
        break;

      case ElementType.Tag:
        if (node.children.length) {
          processWhitespace(node.children, options);
        }
        break;

      case ElementType.Text:
        if (options.collapseWhitespace) {
          node.data = _collapseWhitespace(node.data, node, options);
        }
        break;

      default:
        break;
    }
  }
};

const processWhitespace = (tree, options = defaultOptions) => {
  _processWhitespace(tree, options);
};

export default processWhitespace;
