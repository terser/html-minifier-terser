const removeAttributeQuotes = (attrs) => {
  return attrs.map(attr => {
    if (attr.value.split(' ').length > 1) {
      return attr;
    }

    return {
      ...attr,
      quote: ''
    };
  });
};

export default removeAttributeQuotes;
