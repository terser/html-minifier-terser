import { trimWhitespace } from '../../utils/whitespace';

const isStyleLinkTypeAttribute = (value) => {
  const attrValue = trimWhitespace(value).toLowerCase();
  return attrValue === '' || attrValue === 'text/css';
};

const removeScriptTypeAttributes = (attrs = []) => {
  return attrs.filter(attr => {
    const { name, value } = attr;

    if (name !== 'type') {
      return true;
    }

    return !isStyleLinkTypeAttribute(value);
  });
};

export default removeScriptTypeAttributes;
