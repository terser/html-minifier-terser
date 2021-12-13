export function createMap(values, ignoreCase) {
  const map = {};

  values.forEach(function (value) {
    map[value] = 1;
  });

  return ignoreCase
    ? function (value) {
      return map[value.toLowerCase()] === 1;
    }
    : function (value) {
      return map[value] === 1;
    };
}

export async function replaceAsync(str, regex, asyncFn) {
  const promises = [];

  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });

  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

export function createMapFromString(values, ignoreCase) {
  return createMap(values.split(/,/), ignoreCase);
}
