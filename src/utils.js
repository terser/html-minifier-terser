export async function replaceAsync(str, regex, asyncFn) {
  const promises = [];

  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });

  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

// Generator-compatible version of replaceAsync.
// genFn may be a plain function, an async function, or a generator function.
export function* replaceGen(str, regex, genFn) {
  const matches = [];
  str.replace(regex, (...args) => { matches.push(args); });
  const resolved = [];
  for (const args of matches) {
    resolved.push(yield* yieldCall(genFn, ...args));
  }
  let i = 0;
  return str.replace(regex, () => resolved[i++]);
}

// Call fn(...args) and handle sync / Promise / generator results uniformly.
// Yields Promises upward so the driver (minify / minify_sync) can resolve them.
export function* yieldCall(fn, ...args) {
  const result = fn(...args);
  if (result !== null && result !== undefined && typeof result === 'object' && typeof result.next === 'function') {
    return yield* result;
  }
  if (result !== null && result !== undefined && typeof result.then === 'function') {
    return yield result;
  }
  return result;
}
