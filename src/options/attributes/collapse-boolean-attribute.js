import { booleanAttributes } from '../../utils/tags.js';

const isBooleanValue = (value) => ['true', 'false'].includes(value);

const isBooleanAttribute = (name, value) => {
  return booleanAttributes.has(name) || (name === 'draggable' && !isBooleanValue(value));
};

const collapseBooleanAttributes = (attrs) => {
  return attrs.map(attr => {
    if (isBooleanAttribute(attr.name.toLowerCase(), attr.value)) {
      return {
        ...attr,
        value: '',
        quote: undefined
      };
    }

    return attr;
  });
};

export default collapseBooleanAttributes;
