import { ElementType } from 'htmlparser2';

class NodeWithChildren {
  constructor(type, children = []) {
    this.type = type;
    this.children = children;
  }
}
export class RootDocument extends NodeWithChildren {
  constructor(children) {
    super(ElementType.Root, children);
  }
}

export class Element extends NodeWithChildren {
  constructor(name, attrs, children, type) {
    super(type, children);
    this.name = name;
    this.attrs = attrs;
    this.startImplied = false;
    this.endImplied = false;
  }
}

class DataNode {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}

export class Text extends DataNode {
  constructor(data) {
    super(ElementType.Text, data);
  }
}

export class Comment extends DataNode {
  constructor(data) {
    super(ElementType.Comment, data);
  }
}

export class Directive extends DataNode {
  constructor(name, data) {
    super(ElementType.Directive, data);
    this.name = name;
  }
}
