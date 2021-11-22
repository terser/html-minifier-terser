import { ElementType } from 'htmlparser2';

import { defaultContext } from './context.js';
import defaultOptions from './options/defaults.js';
import removeComments from './options/remove-comments.js';
import minifyJS from './options/minify-js.js';
import minifyCSS from './options/minify-css.js';
import removeEmtpyElements from './options/remove-empty-elements.js';
import quoteCharacter from './options/quote-character.js';
import useShortDoctype from './options/use-short-doctype.js';
import normalizeAttributes from './options/attributes.js';
import { isExecutableScript } from './options/attributes/remove-script-type-attributes.js';
import decodeEntities from './options/decode-entities.js';

class Minifier {
  constructor(options = defaultOptions, ctx = defaultContext) {
    this.options = { ...defaultOptions, ...options };
    this.ctx = ctx;
  }

  async processText(node) {
    if (this.options.decodeEntities) {
      node.data = decodeEntities(node.data, node, this.options);
    }
  }

  async processTag(node) {
    // remove elements that are empty
    if (this.options.removeEmptyElements) {
      const removed = removeEmtpyElements(node, this.options);
      if (removed) {
        return;
      }
    }

    await normalizeAttributes(node, this.options, this.ctx);

    // apply preferred quote character
    quoteCharacter(node, this.options);

    await this.minify(node.children);

    switch (node.name) {
      case ElementType.Script: {
        const textNode = node.children[0];
        if (this.options.minifyJS && textNode && isExecutableScript(node.name, node.attrs)) {
          textNode.data = await minifyJS(textNode.data, false, this.options, this.ctx);
        }
        break;
      }

      case ElementType.Style: {
        const textNode = node.children[0];
        if (this.options.minifyCSS && textNode) {
          textNode.data = await minifyCSS(textNode.data, '', this.options);
        }
        break;
      }

      default:
        break;
    }
  }

  processComment(node) {
    if (this.options.removeComments) {
      removeComments(node);
    }
  }

  processDirective(node) {
    switch (node.name) {
      case '!doctype':
        useShortDoctype(node, this.options);
        break;

      default:
        break;
    }
  }

  async minify(tree) {
    const nodes = Array.isArray(tree) ? tree : [tree];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      switch (node.type) {
        case ElementType.Root:
          await this.minify(node.children);
          break;

        case ElementType.Text:
          await this.processText(node);
          break;

        case ElementType.Tag:
          await this.processTag(node);
          break;

        case ElementType.Comment:
          this.processComment(node);
          break;

        case ElementType.Directive:
          this.processDirective(node);
          break;

        default:
          break;
      }
    }

    return tree;
  }
}

export default Minifier;
