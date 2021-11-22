/* eslint-disable brace-style */
import { ElementType } from 'htmlparser2';

import defaultOptions from '../defaults.js';
import minifyJS from '../minify-js.js';
import minifyCSS from '../minify-css.js';
import minifyURLs from '../minify-urls.js';

import { collapseWhitespaceAll, EMPTY, SINGLE_SPACE, trimWhitespace } from '../../utils/whitespace.js';
import { srcsetTags } from '../../utils/tags.js';
import { defaultContext } from '../../context.js';

const isEventAttribute = (attrName, options = defaultOptions) => {
  const patterns = options.customEventAttributes;

  if (patterns) {
    for (let i = patterns.length; i--;) {
      if (patterns[i].test(attrName)) {
        return true;
      }
    }
    return false;
  }

  return /^on[a-z]{3,}$/.test(attrName);
};

const isUriTypeAttribute = (attrName, tag) => {
  return (
    (/^(?:a|area|link|base)$/.test(tag) && attrName === 'href') ||
    (tag === 'img' && /^(?:src|longdesc|usemap)$/.test(attrName)) ||
    (tag === 'object' && /^(?:classid|codebase|data|usemap)$/.test(attrName)) ||
    (tag === 'q' && attrName === 'cite') ||
    (tag === 'blockquote' && attrName === 'cite') ||
    ((tag === 'ins' || tag === 'del') && attrName === 'cite') ||
    (tag === 'form' && attrName === 'action') ||
    (tag === 'input' && (attrName === 'src' || attrName === 'usemap')) ||
    (tag === 'head' && attrName === 'profile') ||
    (tag === 'script' && (attrName === 'src' || attrName === 'for'))
  );
};

const isLinkType = (tag, attrs, value) => {
  if (tag !== 'link') {
    return false;
  }

  return attrs.some(attr => attr.name === 'rel' && attr.value === value);
};

const isNumberTypeAttribute = (attrName, tag) => {
  return (
    (/^(?:a|area|object|button)$/.test(tag) && attrName === 'tabindex') ||
    (tag === 'input' && (attrName === 'maxlength' || attrName === 'tabindex')) ||
    (tag === 'select' && (attrName === 'size' || attrName === 'tabindex')) ||
    (tag === 'textarea' && /^(?:rows|cols|tabindex)$/.test(attrName)) ||
    (tag === 'colgroup' && attrName === 'span') ||
    (tag === 'col' && attrName === 'span') ||
    ((tag === 'th' || tag === 'td') && (attrName === 'rowspan' || attrName === 'colspan'))
  );
};

const isSrcset = (attrName, tag) => {
  return attrName === 'srcset' && srcsetTags.has(tag);
};

function isMetaViewport(tag, attrs) {
  if (tag !== 'meta') {
    return false;
  }
  return attrs.some(attr => attr.name === 'name' && attr.value === 'viewport');
}

const isContentSecurityPolicy = (tag, attrs) => {
  if (tag !== 'meta') {
    return false;
  }

  return attrs.some(attr => {
    const { name, value } = attr;
    return name.toLowerCase() === 'http-equiv' && value.toLowerCase() === 'content-security-policy';
  });
};

const isStyleLinkTypeAttribute = (attrValue) => {
  const value = trimWhitespace(attrValue).toLowerCase();
  return (value === '' || value === 'text/css');
};

const isStyleSheet = (tag, attrs) => {
  if (tag !== 'style') {
    return false;
  }

  for (let i = 0; i < attrs.length; i++) {
    const attrName = attrs[i].name.toLowerCase();
    if (attrName === 'type') {
      return isStyleLinkTypeAttribute(attrs[i].value);
    }
  }

  return true;
};

const isMediaQuery = (tag, attrs, attrName) => {
  return (
    attrName === 'media' &&
    (isLinkType(tag, attrs, 'stylesheet') || isStyleSheet(tag, attrs))
  );
};

const cleanAttributeValue = async (attrs, node, options = defaultOptions, ctx = defaultContext) => {
  const tag = node.name;

  const promises = attrs.map(async (attr) => {
    const { name, value } = attr;

    let attrValue = value;

    if (isEventAttribute(name, options)) {
      attrValue = trimWhitespace(attrValue).replace(/^javascript:\s*/i, '');
      attrValue = await minifyJS(attrValue, true, options, ctx);
    }

    else if (name === 'class') {
      attrValue = trimWhitespace(attrValue);
      // TODO: Implement sort attributes here if not implemented later
      attrValue = collapseWhitespaceAll(attrValue);
    }

    else if (isUriTypeAttribute(name, tag)) {
      attrValue = trimWhitespace(attrValue);
      attrValue = isLinkType(tag, attrs, 'canonical')
        ? attrValue
        : minifyURLs(attrValue, options);
    }

    else if (isNumberTypeAttribute(name, tag)) {
      attrValue = trimWhitespace(attrValue);
    }

    else if (name === ElementType.Style) {
      attrValue = trimWhitespace(attrValue);
      if (attrValue) {
        if (/;$/.test(attrValue) && !/&#?[0-9a-zA-Z]+;$/.test(attrValue)) {
          attrValue = attrValue.replace(/\s*;$/, ';');
        }

        attrValue = await minifyCSS(attrValue, 'inline', options);
      }
    }

    else if (isSrcset(name, tag)) {
      // https://html.spec.whatwg.org/multipage/embedded-content.html#attr-img-srcset
      attrValue = trimWhitespace(attrValue).split(/\s+,\s*|\s*,\s+/).map(function (candidate) {
        let url = candidate;
        let descriptor = '';
        const match = candidate.match(/\s+([1-9][0-9]*w|[0-9]+(?:\.[0-9]+)?x)$/);
        if (match) {
          url = url.slice(0, -match[0].length);
          const num = +match[1].slice(0, -1);
          const suffix = match[1].slice(-1);
          if (num !== 1 || suffix !== 'x') {
            descriptor = ' ' + num + suffix;
          }
        }
        return minifyURLs(url, options) + descriptor;
      }).join(', ');
    }

    else if (isMetaViewport(tag, attrs) && name === 'content') {
      attrValue = attrValue.replace(/\s+/g, '').replace(/[0-9]+\.[0-9]+/g, function (numString) {
        // "0.90000" -> "0.9"
        // "1.0" -> "1"
        // "1.0001" -> "1.0001" (unchanged)
        return (+numString).toString();
      });
    }

    else if (isContentSecurityPolicy(tag, attrs) && name.toLowerCase() === 'content') {
      attrValue = collapseWhitespaceAll(attrValue);
    }

    else if (options.customAttrCollapse && options.customAttrCollapse.test(name)) {
      attrValue = trimWhitespace(attrValue
        .replace(/ ?[\n\r]+ ?/g, '')
        .replace(/\s{2,}/g, options.conservativeCollapse ? SINGLE_SPACE : EMPTY
        )
      );
    }

    else if (tag === ElementType.Script && name === 'type') {
      attrValue = trimWhitespace(attrValue.replace(/\s*;\s*/g, ';'));
    }

    else if (isMediaQuery(tag, attrs, name)) {
      attrValue = trimWhitespace(attrValue);
      attrValue = await minifyCSS(attrValue, 'media', options);
    }

    return {
      ...attr,
      value: attrValue
    };
  });

  return Promise.all(promises);
};

export default cleanAttributeValue;
