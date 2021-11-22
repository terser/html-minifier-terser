import { ElementType } from 'htmlparser2';

import defaultOptions from './defaults.js';
import removeRedundantAttributes from './attributes/remove-redundant-attribute.js';
import collapseBooleanAttributes from './attributes/collapse-boolean-attribute.js';
import removeAttributeQuotes from './attributes/remove-attribute-quotes.js';
import removeScriptTypeAttributes from './attributes/remove-script-type-attributes.js';
import removeStyleLinkTypeAttributes from './attributes/remove-style-link-type-attributes.js';
import removeEmptyAttributes from './attributes/remove-empty-attribute.js';
import cleanAttributeValue from './attributes/clean-attribute-value.js';
import { defaultContext } from '../context.js';

const normalizeAttributes = async (node, options = defaultOptions, ctx = defaultContext) => {
  const { attrs } = node;

  if (!attrs) {
    return;
  }

  let normalizedAttrs = attrs;

  if (options.removeRedundantAttributes) {
    normalizedAttrs = removeRedundantAttributes(normalizedAttrs, node);
  }

  if (options.removeScriptTypeAttributes && node.name === ElementType.Script) {
    normalizedAttrs = removeScriptTypeAttributes(normalizedAttrs);
  }

  if (options.removeStyleLinkTypeAttributes && (node.name === ElementType.Style || node.name === 'link')) {
    normalizedAttrs = removeStyleLinkTypeAttributes(normalizedAttrs);
  }

  if (options.collapseBooleanAttributes) {
    normalizedAttrs = collapseBooleanAttributes(normalizedAttrs);
  }

  if (attrs.length) {
    normalizedAttrs = await cleanAttributeValue(normalizedAttrs, node, options, ctx);
  }

  if (options.removeAttributeQuotes) {
    normalizedAttrs = removeAttributeQuotes(normalizedAttrs);
  }

  if (options.removeEmptyAttributes) {
    normalizedAttrs = removeEmptyAttributes(normalizedAttrs, node, options);
  }

  node.attrs = normalizedAttrs;
};

export default normalizeAttributes;
