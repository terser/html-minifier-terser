import { specialContentTags } from '../utils/tags.js';
import defaultOptions from './defaults.js';

// htmlparser2 already supports decoding via decodeEntities option
// this is to fix
// https://github.com/kangax/html-minifier/issues/964
const decodeEntities = (str = '', node, options = defaultOptions) => {
  let text = str;

  if (options.decodeEntities && text && !specialContentTags.has(node.parent?.name)) {
    // Escape any `&` symbols that start either:
    // 1) a legacy named character reference (i.e. one that doesn't end with `;`)
    // 2) or any other character reference (i.e. one that does end with `;`)
    // Note that `&` can be escaped as `&amp`, without the semi-colon.
    // https://mathiasbynens.be/notes/ambiguous-ampersands
    text = text
      .replace(/&((?:Iacute|aacute|uacute|plusmn|Otilde|otilde|agrave|Agrave|Yacute|yacute|Oslash|oslash|atilde|Atilde|brvbar|ccedil|Ccedil|Ograve|curren|divide|eacute|Eacute|ograve|Oacute|egrave|Egrave|Ugrave|frac12|frac14|frac34|ugrave|oacute|iacute|Ntilde|ntilde|Uacute|middot|igrave|Igrave|iquest|Aacute|cedil|laquo|micro|iexcl|Icirc|icirc|acirc|Ucirc|Ecirc|ocirc|Ocirc|ecirc|ucirc|Aring|aring|AElig|aelig|acute|pound|raquo|Acirc|times|THORN|szlig|thorn|COPY|auml|ordf|ordm|Uuml|macr|uuml|Auml|ouml|Ouml|para|nbsp|euml|quot|QUOT|Euml|yuml|cent|sect|copy|sup1|sup2|sup3|iuml|Iuml|ETH|shy|reg|not|yen|amp|AMP|REG|uml|eth|deg|gt|GT|LT|lt)(?!;)|(?:#?[0-9a-zA-Z]+;))/g, '&amp$1')
      .replace(/</g, '&lt;');
  }

  return text;
};

export default decodeEntities;
