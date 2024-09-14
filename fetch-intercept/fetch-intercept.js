/**
 * 🐒 Patch
 * @example
 * ```js
 * const onRequest = (request) => {
 *   console.log('Current URL:', request.url)
 * }
 * const unregister = register({ onRequest })
 * ```
 */
const register = ({ setRequest, setResponse, onRequest, onResponse, onError }) => {
  const g = {
    [true]: () => null,
    [typeof global !== "undefined"]: () => global,
    [typeof globalThis !== "undefined"]: () =>
      // eslint-disable-next-line no-undef
      globalThis,
    [typeof window !== "undefined"]: () =>
      // eslint-disable-next-line no-undef
      window,
  }.true();

  if (typeof g.__originalFetch === "undefined") {
    g.__originalFetch = g.fetch;
  }

  g.fetch = (...args) => {
    // Maybe, we should be handle when Request is not a global Constructor
    const request = setRequest
      ? // eslint-disable-next-line no-undef
        setRequest(new Request(...args))
      : // eslint-disable-next-line no-undef
        new Request(...args);

    onRequest && onRequest(request);

    const onRes = (res) => {
      onResponse && onResponse(res);
      return setResponse ? setResponse(res) : res;
    };

    return g.__originalFetch(...args).then(onRes, onError);
  };

  return () => {
    g.fetch = g.__originalFetch;
    g.__originalFetch = undefined;
  };
};

module.exports = { register };
