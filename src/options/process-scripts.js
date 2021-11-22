import { ElementType } from 'htmlparser2';

import { specialContentTags } from '../utils/tags.js';
import defaultOptions from './defaults.js';

const processScripts = async (tree, options = defaultOptions, minify) => {
  const nodes = Array.isArray(tree) ? tree : [tree];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    switch (node.type) {
      case ElementType.Root:
        await processScripts(node.children, options, minify);
        break;

      case ElementType.Tag: {
        if (options.processScripts && specialContentTags.has(node.name)) {
          const attr = node.attrs?.find(attr => options.name(attr.name) === 'type');

          if (options.processScripts.indexOf(attr?.value) > -1) {
            const textNode = node.children[0];
            if (textNode) {
              textNode.data = await minify(textNode.data);
            }
          }
        }
        break;
      }

      default:
        break;
    }
  }
};

export default processScripts;
