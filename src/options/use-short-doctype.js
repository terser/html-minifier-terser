import defaultOptions from './defaults.js';
import { collapseWhitespaceAll } from '../utils/whitespace.js';

const useShortDoctype = (node, options = defaultOptions) => {
  if (options.useShortDoctype) {
    node.data = '!doctype' + (options.removeTagWhitespace ? '' : ' ') + 'html';
  } else {
    node.data = collapseWhitespaceAll(node.data);
  }
};

export default useShortDoctype;
