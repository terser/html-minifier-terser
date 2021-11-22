import { trimWhitespace } from '../../utils/whitespace.js';

const attributesInclude = (attrs = [], name) => attrs.some(attr => attr.name === name);

const isAttributeRedundant = (tag, name, value, attrs) => {
  const attrValue = value ? trimWhitespace(value.toLowerCase()) : '';

  return (
    (tag === 'script' && name === 'language' && attrValue === 'javascript') ||
    (tag === 'form' && name === 'method' && attrValue === 'get') ||
    (tag === 'input' && name === 'type' && attrValue === 'text') ||
    (tag === 'script' && name === 'charset' && !attributesInclude(attrs, 'src')) ||
    (tag === 'a' && name === 'name' && attributesInclude(attrs, 'id')) ||
    (tag === 'area' && name === 'shape' && attrValue === 'rect')
  );
};

const removeRedundantAttributes = (attrs, node) => {
  return attrs.filter(attr => !isAttributeRedundant(node.name, attr.name, attr.value, attrs));
};

export default removeRedundantAttributes;
