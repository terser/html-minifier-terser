import { ElementType } from 'htmlparser2';

import { Directive, Element, RootDocument, Text, Comment } from './nodes.js';

const defaultOpts = {};

export class DomHandler {
  constructor(options = defaultOpts) {
    this.options = { ...defaultOpts, ...options };

    this.setDefaults();
  }

  onparserinit(parser) {
    this.parser = parser;
  }

  // Resets the handler back to starting state
  setDefaults() {
    this.dom = [];
    this.root = new RootDocument(this.dom);
    this.tagStack = [this.root];
    this.lastNode = null;
    this.parser = null;
    this.attrs = null;
  }

  onreset() {
    this.setDefaults();
  }

  onend() {
    this.parser = null;
  }

  onclosetag(_, isImplied) {
    this.lastNode = null;

    const elem = this.tagStack.pop();
    elem.endIndex = this.parser.endIndex;
    elem.endImplied = isImplied;

    this.attrs = null;
  }

  onattribute(name, value, quote) {
    if (!this.attrs) {
      this.attrs = [];
    }

    this.attrs.push({ name, value, quote });
  }

  onopentag(name, _, isImplied) {
    const type = ElementType.Tag;

    const element = new Element(name, this.attrs, undefined, type);
    element.startImplied = isImplied;

    this.addNode(element);
    this.tagStack.push(element);
    this.attrs = null;
  }

  ontext(data) {
    const { lastNode } = this;

    if (lastNode && lastNode.type === ElementType.Text) {
      lastNode.data += data;
    } else {
      const node = new Text(data);
      this.addNode(node);
      this.lastNode = node;
    }
  }

  oncomment(data) {
    if (this.lastNode?.type === ElementType.Comment) {
      this.lastNode.data += data;
      return;
    }

    const node = new Comment(data);
    this.addNode(node);
    this.lastNode = node;
  }

  oncommentend() {
    this.lastNode = null;
  }

  onprocessinginstruction(name, data) {
    const node = new Directive(name, data);
    this.addNode(node);
  }

  addNode(node) {
    const parent = this.tagStack[this.tagStack.length - 1];
    const previousSibling = parent.children[parent.children.length - 1];

    node.startIndex = this.parser.startIndex;
    node.endIndex = this.parser.endIndex;

    parent.children.push(node);

    if (previousSibling) {
      node.prev = previousSibling;
      previousSibling.next = node;
    }

    node.parent = parent;
    this.lastNode = null;
  }
}

export default DomHandler;
