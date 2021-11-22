import defaultOptions from '../defaults.js';

const EMPTY_ATTRIBUTE_REGEX = new RegExp(
  '^(?:class|id|style|title|lang|dir|on(?:focus|blur|change|click|dblclick|mouse(' +
  '?:down|up|over|move|out)|key(?:press|down|up)))$'
);

function canDeleteEmptyAttribute(tag, name, value, options) {
  const isValueEmpty = !value || /^\s*$/.test(value);
  if (!isValueEmpty) {
    return false;
  }

  return (tag === 'input' && name === 'value') || EMPTY_ATTRIBUTE_REGEX.test(name);
}

const removeEmptyAttributes = (attrs, node, options = defaultOptions) => {
  const tag = node.name;

  return attrs.filter(attr => {
    const { name, value } = attr;

    if (typeof options.removeEmptyAttributes === 'function') {
      return !options.removeEmptyAttributes(name, tag);
    }

    if (canDeleteEmptyAttribute(tag, name, value)) {
      return false;
    }

    return true;
  });
};

export default removeEmptyAttributes;
