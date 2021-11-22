import { DomUtils, ElementType } from 'htmlparser2';
import defaultOptions from './defaults.js';
import { voidTags } from '../utils/tags.js';

const hasAttrName = (name, attrs) => attrs?.some(attr => attr.name === name) || false;

function canRemoveElement(tag, attrs) {
  switch (tag) {
    case 'textarea':
      return false;

    case 'audio':
    case 'script':
    case 'video':
      if (hasAttrName('src', attrs)) {
        return false;
      }
      break;

    case 'iframe':
      if (hasAttrName('src', attrs) || hasAttrName('srcdoc', attrs)) {
        return false;
      }
      break;

    case 'object':
      if (hasAttrName('data', attrs)) {
        return false;
      }
      break;

    case 'applet':
      if (hasAttrName('code', attrs)) {
        return false;
      }
      break;
  }

  return true;
}

const removeEmtpyElements = (node, options = defaultOptions) => {
  let removeElement = false;

  if (node.children.length) {
    // the node only has comment as its child remove it
    const hasOnlyCommentChildren = node.children.every(child => child.type === ElementType.Comment);
    if (hasOnlyCommentChildren) {
      const commentNode = node.children.find(child => child.type === ElementType.Comment);
      DomUtils.removeElement(commentNode);
    }
  }

  if (
    !node.children.length &&
    !voidTags.has(node.name) &&
    canRemoveElement(node.name, node.attrs)
  ) {
    removeElement = true;
  }

  if (removeElement) {
    DomUtils.removeElement(node);
  }

  return removeElement;
};

export default removeEmtpyElements;
