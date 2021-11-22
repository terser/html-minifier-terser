import { ElementType } from 'htmlparser2';

import defaultOptions from './defaults.js';
import TokenChain from '../utils/tokenchain.js';
import { trimWhitespace } from '../utils/whitespace.js';
import { defaultContext } from '../context.js';

const attrNames = (attrs, options = defaultOptions) => {
  return attrs.map(attr => options.name(attr.name));
};

const createSortFunctions = (tree, options = defaultOptions, ctx = defaultContext, attrChains, classChain) => {
  const nodes = Array.isArray(tree) ? tree : [tree];

  const uidIgnore = ctx.get('uidIgnore');
  const uidAttr = ctx.get('uidAttr');

  const shouldSkipUID = (token, uid) => {
    return !uid || token.indexOf(uid) === -1;
  };

  const shouldSkipUIDs = (token) => {
    return shouldSkipUID(token, uidIgnore) && shouldSkipUID(token, uidAttr);
  };

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    switch (node.type) {
      case ElementType.Root:
        createSortFunctions(node.children, options, ctx, attrChains, classChain);
        break;

      case ElementType.Tag: {
        const { name: tag, attrs = [] } = node;

        if (attrChains) {
          if (!attrChains[tag]) {
            attrChains[tag] = new TokenChain();
          }

          attrChains[tag].add(attrNames(attrs, options).filter(shouldSkipUIDs));
        }

        attrs.forEach(attr => {
          if (classChain && attr.value && options.name(attr.name) === 'class') {
            classChain.add(trimWhitespace(attr.value).split(/[ \t\n\f\r]+/));
          }
        });

        if (node.children.length) {
          createSortFunctions(node.children, options, ctx, attrChains, classChain);
        }
        break;
      }

      default:
        break;
    }
  }
};

const applySort = (tree, options = defaultOptions, sortAttributes, sortClassName) => {
  const nodes = Array.isArray(tree) ? tree : [tree];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    switch (node.type) {
      case ElementType.Root:
        applySort(node.children, options, sortAttributes, sortClassName);
        break;

      case ElementType.Tag:

        if (node.attrs && (sortAttributes || sortClassName)) {
          if (sortAttributes) {
            node.attrs = sortAttributes(node.name, node.attrs);
          }

          if (sortClassName) {
            node.attrs = node.attrs.map(attr => {
              if (options.name(attr.name) === 'class' && sortClassName) {
                return {
                  ...attr,
                  value: sortClassName(attr.value)
                };
              }

              return attr;
            });
          }
        }

        if (node.children.length) {
          applySort(node.children, options, sortAttributes, sortClassName);
        }
        break;

      default:
        break;
    }
  }
};

const createSorter = (tree, options = defaultOptions, ctx = defaultContext) => {
  const attrChains = ctx.get('attrChains') ?? (options.sortAttributes && Object.create(null));
  const classChain = ctx.get('classChain') ?? (options.sortClassName && new TokenChain());

  createSortFunctions(tree, options, ctx, attrChains, classChain);

  if (!attrChains && !classChain) {
    return;
  }

  let sortAttributesFn = null;
  if (attrChains) {
    const attrSorters = Object.create(null);

    for (const tag in attrChains) {
      attrSorters[tag] = attrChains[tag].createSorter();
    }

    const defaultAttrsSorter = (tag, attrs) => {
      const sorter = attrSorters[tag];

      if (sorter) {
        const attrMap = Object.create(null);

        const names = attrNames(attrs);
        names.forEach(function (name, index) {
          (attrMap[name] || (attrMap[name] = [])).push(attrs[index]);
        });

        sorter.sort(names).forEach(function (name, index) {
          attrs[index] = attrMap[name].shift();
        });
      }

      return attrs;
    };

    sortAttributesFn = typeof options.sortAttributes === 'function'
      ? options.sortAttributes
      : defaultAttrsSorter;
  }

  let sortClassNameFn = null;
  if (classChain) {
    const sorter = classChain.createSorter();

    const defaultClassNameSorter = (value) => {
      return sorter.sort(value.split(/[ \n\f\r]+/)).join(' ');
    };

    sortClassNameFn = typeof options.sortClassName === 'function'
      ? options.sortClassName
      : defaultClassNameSorter;
  }

  if (!sortAttributesFn && !sortClassNameFn) {
    return;
  }

  ctx.set('attrChains', attrChains);
  ctx.set('classChain', classChain);

  return () => {
    applySort(tree, options, sortAttributesFn, sortClassNameFn);
  };
};

export default createSorter;
