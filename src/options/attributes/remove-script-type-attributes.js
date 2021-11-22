import { trimWhitespace } from '../../utils/whitespace';

// https://mathiasbynens.be/demo/javascript-mime-type
// https://developer.mozilla.org/en/docs/Web/HTML/Element/script#attr-type
const executableScriptsMimetypes = new Set([
  'text/javascript',
  'text/ecmascript',
  'text/jscript',
  'application/javascript',
  'application/x-javascript',
  'application/ecmascript',
  'module'
]);

const keepScriptsMimetypes = new Set(['module']);

const isScriptTypeAttribute = (value) => {
  const attrValue = trimWhitespace(value.split(/;/, 2)[0]).toLowerCase();
  return attrValue === '' || executableScriptsMimetypes.has(attrValue);
};

const keepScriptTypeAttribute = (value) => {
  const attrValue = trimWhitespace(value.split(/;/, 2)[0]).toLowerCase();
  return keepScriptsMimetypes.has(attrValue);
};

export const isExecutableScript = (tag, attrs) => {
  if (tag !== 'script') {
    return false;
  }

  if (!attrs) {
    return true;
  }

  return attrs.some(attr => {
    const name = attr.name.toLowerCase();

    if (name === 'type') {
      return isScriptTypeAttribute(attr.value);
    }

    return true;
  });
};

const removeScriptTypeAttributes = (attrs = []) => {
  return attrs.filter(attr => {
    const { name, value } = attr;

    if (name !== 'type') {
      return true;
    }

    return !(isScriptTypeAttribute(value) && !keepScriptTypeAttribute(value));
  });
};

export default removeScriptTypeAttributes;
